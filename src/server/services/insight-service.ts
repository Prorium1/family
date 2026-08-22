import 'server-only'
import { getRepositories } from '@/server/repositories'
import { isRevealed, transition } from '@/server/policies/assignment-policy'
import { isAiReadable } from '@/server/policies/visibility-policy'
import { AI_SCHEMA_VERSION, dailyInsightSchema, type DailyInsight } from '@/lib/validation/ai-insight'
import { coupleAllowsAiProcessing } from './settings-service'
import { generateStructured, inputHashOf, AiGenerationError } from '@/lib/ai/client'
import { LOVE_INTERPRETER_SYSTEM_PROMPT, wrapUserData } from '@/lib/ai/system-prompt'
import { checkTextSafety, combineAssessments } from '@/lib/security/safety-checker'
import type { QuestionAssignment, AiInsightRecord, Answer } from '@/types/entities'

/**
 * Daily insight generation (spec §10, §17, §30):
 * - Only visibility-approved text reaches the model
 * - Duplicate generation for identical input is impossible (input hash +
 *   in-flight coalescing)
 * - Failure never blocks the reveal: the assignment falls back to `revealed`
 *   with a retriable error flag
 * - ai_generation_logs receives metadata only
 */

const inFlight = new Map<string, Promise<void>>()

interface InsightView {
  status: 'none' | 'generating' | 'ready' | 'failed' | 'consent_off'
  payload: DailyInsight | null
}

export async function getInsightForAssignment(
  assignment: QuestionAssignment,
  viewerUserId: string,
): Promise<InsightView> {
  if (!isRevealed(assignment.status)) return { status: 'none', payload: null }

  // Consent first, before anything is read or generated (spec §4-2). Without
  // it the couple still gets the reveal — they simply get it without the AI.
  if (!(await coupleAllowsAiProcessing(assignment.coupleId, viewerUserId))) {
    return { status: 'consent_off', payload: null }
  }

  const repos = getRepositories()

  // Auto-start generation on first view after reveal.
  if (assignment.status === 'revealed' && !assignment.insightError) {
    await ensureDailyInsight(assignment.id, viewerUserId)
    const refreshed = await repos.assignments.getById(assignment.id, viewerUserId)
    if (refreshed) assignment = refreshed
  }

  const current = await repos.insights.findCurrent(assignment.id)
  if (current?.status === 'succeeded') {
    const parsed = dailyInsightSchema.safeParse(current.payload)
    if (parsed.success) return { status: 'ready', payload: parsed.data }
  }
  if (current?.status === 'generating') return { status: 'generating', payload: null }
  if (assignment.insightError || current?.status === 'failed') {
    return { status: 'failed', payload: null }
  }
  return { status: 'none', payload: null }
}

async function buildContext(assignmentId: string, viewerUserId: string) {
  const repos = getRepositories()
  const assignment = await repos.assignments.getById(assignmentId, viewerUserId)
  if (!assignment || !isRevealed(assignment.status)) return null
  const question = await repos.questions.getById(assignment.questionId)
  if (!question) return null

  const { mine, partner } = await repos.answers.getForAssignment(assignmentId, viewerUserId)
  const answers = [mine, partner].filter((a): a is Answer => a !== null)
  if (answers.length < 2) return null

  const readable = await Promise.all(
    answers
      .filter((a) => isAiReadable(a.visibility))
      .map(async (a) => {
        const profile = await repos.profiles.getById(a.userId)
        return {
          name: profile?.displayName ?? 'パートナー',
          text: a.value.kind === 'text' ? a.value.text : JSON.stringify(a.value),
        }
      }),
  )

  const safety = combineAssessments(readable.map((r) => checkTextSafety(r.text)))
  return { assignment, question, readable, safety }
}

export async function ensureDailyInsight(
  assignmentId: string,
  viewerUserId: string,
  options: { regenerate?: boolean } = {},
): Promise<void> {
  const repos = getRepositories()
  const context = await buildContext(assignmentId, viewerUserId)
  if (!context) return
  const { assignment, question, readable, safety } = context

  // The last gate before any answer text leaves this process.
  if (!(await coupleAllowsAiProcessing(assignment.coupleId, viewerUserId))) return

  // Injection-flagged input never reaches a model (spec §19).
  if (safety.injectionDetected) {
    await repos.safetyEvents.record({
      id: `se_${crypto.randomUUID()}`,
      userId: viewerUserId,
      coupleId: assignment.coupleId,
      context: 'daily_answer',
      level: safety.level,
      categories: safety.categories,
      createdAt: new Date().toISOString(),
    })
  }

  const inputHash = inputHashOf({
    schemaVersion: AI_SCHEMA_VERSION,
    questionId: question.id,
    answers: readable.map((r) => r.text).sort(),
  })

  // Dedupe: an identical input that already succeeded is simply reused.
  const existing = await repos.insights.findByInputHash(assignment.id, inputHash)
  if (existing && !options.regenerate) {
    if (existing.status === 'succeeded' || existing.status === 'generating') return
  }

  const flightKey = `${assignment.id}:${inputHash}:${options.regenerate ? 'regen' : 'auto'}`
  const running = inFlight.get(flightKey)
  if (running) return running

  const task = runGeneration(assignment, viewerUserId, question.text, question.category, readable, safety, inputHash)
  inFlight.set(flightKey, task)
  try {
    await task
  } finally {
    inFlight.delete(flightKey)
  }
}

async function runGeneration(
  assignment: QuestionAssignment,
  viewerUserId: string,
  questionText: string,
  questionCategory: string,
  readable: Array<{ name: string; text: string }>,
  safety: ReturnType<typeof checkTextSafety>,
  inputHash: string,
): Promise<void> {
  const repos = getRepositories()
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()
  const attempt =
    ((await repos.insights.findCurrent(assignment.id))?.attempt ?? 0) + 1

  let assignmentNow = assignment
  const now = () => new Date().toISOString()
  if (assignmentNow.status !== 'insight_generating') {
    assignmentNow = transition(assignmentNow, 'insight_generating', now())
    await repos.assignments.save(assignmentNow)
  }

  const record: AiInsightRecord = await repos.insights.create({
    id: `ins_${crypto.randomUUID()}`,
    coupleId: assignment.coupleId,
    assignmentId: assignment.id,
    kind: 'daily',
    schemaVersion: AI_SCHEMA_VERSION,
    inputHash,
    attempt,
    isCurrent: true,
    status: 'generating',
    payload: null,
    createdAt: now(),
  })

  try {
    const prompt = [
      '以下は、あるカップル二人が今日の質問に寄せた回答です。二人の対話を支えるメッセージを、指定のスキーマで作成してください。',
      wrapUserData('question', questionText),
      ...readable.map((r, i) => wrapUserData(`answer_${i + 1}_${r.name}`, r.text)),
    ].join('\n\n')

    const outcome = await generateStructured({
      kind: 'daily_insight',
      schema: dailyInsightSchema,
      system: LOVE_INTERPRETER_SYSTEM_PROMPT,
      prompt,
      context: {
        question: { text: questionText, category: questionCategory },
        answers: readable,
        safetyLevel: safety.level,
      },
    })

    await repos.insights.save({ ...record, status: 'succeeded', payload: outcome.object })
    const refreshed = await repos.assignments.getById(assignment.id, viewerUserId)
    const target = refreshed ?? assignmentNow
    if (target.status === 'insight_generating') {
      await repos.assignments.save({
        ...transition(target, 'insight_ready', now()),
        insightError: null,
      })
    }
    await repos.aiLogs.record({
      id: `ail_${crypto.randomUUID()}`,
      requestId,
      userId: null,
      coupleId: assignment.coupleId,
      kind: 'daily_insight',
      model: outcome.model,
      inputTokens: outcome.inputTokens,
      outputTokens: outcome.outputTokens,
      success: true,
      durationMs: Date.now() - startedAt,
      schemaVersion: AI_SCHEMA_VERSION,
      errorCode: null,
      createdAt: now(),
    })
  } catch (error) {
    const code = error instanceof AiGenerationError ? error.code : 'provider_failed'
    await repos.insights.save({ ...record, status: 'failed', isCurrent: true })
    // Failure returns the assignment to `revealed`: answers stay readable,
    // and the UI offers a retry (spec §30).
    const refreshed = await repos.assignments.getById(assignment.id, viewerUserId)
    const target = refreshed ?? assignmentNow
    if (target.status === 'insight_generating') {
      await repos.assignments.save({
        ...transition(target, 'revealed', now()),
        insightError: code,
      })
    }
    await repos.aiLogs.record({
      id: `ail_${crypto.randomUUID()}`,
      requestId,
      userId: null,
      coupleId: assignment.coupleId,
      kind: 'daily_insight',
      model: 'unknown',
      inputTokens: null,
      outputTokens: null,
      success: false,
      durationMs: Date.now() - startedAt,
      schemaVersion: AI_SCHEMA_VERSION,
      errorCode: code,
      createdAt: now(),
    })
  }
}

export async function regenerateDailyInsight(
  assignmentId: string,
  viewerUserId: string,
): Promise<void> {
  const repos = getRepositories()
  const assignment = await repos.assignments.getById(assignmentId, viewerUserId)
  if (!assignment || !isRevealed(assignment.status)) return
  // Clear the error flag so the pipeline runs again.
  if (assignment.insightError) {
    await repos.assignments.save({ ...assignment, insightError: null })
  }
  await ensureDailyInsight(assignmentId, viewerUserId, { regenerate: true })
}

import 'server-only'
import { getRepositories } from '@/server/repositories'
import { repairPrompts } from '@/content/repair-questions'
import { checkTextSafety, combineAssessments } from '@/lib/security/safety-checker'
import {
  AI_SCHEMA_VERSION,
  repairInsightSchema,
  type RepairInsight,
} from '@/lib/validation/ai-insight'
import { generateStructured, inputHashOf, AiGenerationError } from '@/lib/ai/client'
import { LOVE_INTERPRETER_SYSTEM_PROMPT, wrapUserData } from '@/lib/ai/system-prompt'
import { track } from '@/lib/analytics/track'
import type { RepairMode, VisibilityLevel } from '@/types/domain'
import type { RepairSessionDTO } from '@/types/dto'
import type { RepairSession } from '@/types/entities'

/**
 * Repair Mode (spec §12, §19). Non-negotiables enforced here:
 * - raw entry text is never auto-shared (visibility defaults to ai_summary)
 * - urgent safety findings pause mediation, suppress partner notification
 *   and surface support resources instead of an insight
 * - the AI receives only ai-readable entries
 */

export async function startRepairSession(
  coupleId: string,
  initiatorUserId: string,
  mode: RepairMode,
  topic: string | null,
): Promise<string> {
  const repos = getRepositories()
  const session: RepairSession = {
    id: `rs_${crypto.randomUUID()}`,
    coupleId,
    initiatorUserId,
    mode,
    status: 'open',
    topic,
    safetyLevel: 'none',
    safetyCategories: [],
    partnerNotified: false,
    createdAt: new Date().toISOString(),
    closedAt: null,
  }
  await repos.repair.createSession(session)
  await track('repair_session_started', { mode })
  return session.id
}

export async function getRepairSession(
  sessionId: string,
  userId: string,
): Promise<RepairSessionDTO | null> {
  const repos = getRepositories()
  const session = await repos.repair.getSession(sessionId, userId)
  if (!session) return null

  const myEntries = await repos.repair.listOwnEntries(sessionId, userId)
  const partnerSubmitted = await repos.repair.hasPartnerSubmitted(sessionId, userId)
  const agreements = await repos.repair.listAgreements(sessionId, userId)

  let insight: RepairInsight | null = null
  let insightStatus: RepairSessionDTO['insightStatus'] = 'none'
  const current = await repos.repair.findCurrentInsight(sessionId)
  if (current?.status === 'succeeded') {
    const parsed = repairInsightSchema.safeParse(current.payload)
    if (parsed.success) {
      insight = parsed.data
      insightStatus = 'ready'
    }
  } else if (current?.status === 'generating') {
    insightStatus = 'generating'
  } else if (current?.status === 'failed') {
    insightStatus = 'failed'
  }

  return {
    sessionId: session.id,
    mode: session.mode,
    status: session.status,
    topic: session.topic,
    isInitiator: session.initiatorUserId === userId,
    safetyLevel: session.safetyLevel,
    myEntries: myEntries.map((e) => ({
      promptId: e.promptId,
      text: e.text,
      visibility: e.visibility,
      submitted: e.submitted,
    })),
    mySubmitted: myEntries.length > 0 && myEntries.every((e) => e.submitted),
    partnerJoined: session.mode === 'together',
    partnerSubmitted,
    insight,
    insightStatus,
    agreements: agreements.map((a) => ({
      id: a.id,
      text: a.text,
      agreedByMe: a.agreedByUserIds.includes(userId),
      agreedByPartner: a.agreedByUserIds.some((id) => id !== userId),
    })),
  }
}

export async function saveRepairEntries(
  sessionId: string,
  userId: string,
  entries: Array<{ promptId: string; text: string }>,
  visibility: VisibilityLevel,
  submit: boolean,
): Promise<{ safetyPaused: boolean }> {
  const repos = getRepositories()
  const session = await repos.repair.getSession(sessionId, userId)
  if (!session) throw new Error('session not found')

  const now = new Date().toISOString()
  for (const entry of entries) {
    if (!repairPrompts.some((p) => p.id === entry.promptId)) continue
    if (!entry.text.trim()) continue
    await repos.repair.saveEntry({
      id: `re_${crypto.randomUUID()}`,
      sessionId,
      userId,
      promptId: entry.promptId,
      text: entry.text,
      visibility,
      sharedExcerpts: [],
      submitted: submit,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Pre-AI safety check on this author's text (spec §19).
  const assessment = combineAssessments(entries.map((e) => checkTextSafety(e.text)))
  if (assessment.level !== 'none') {
    await repos.safetyEvents.record({
      id: `se_${crypto.randomUUID()}`,
      userId,
      coupleId: session.coupleId,
      context: 'repair_entry',
      level: assessment.level,
      categories: assessment.categories,
      createdAt: now,
    })
  }

  if (assessment.level === 'urgent') {
    // Pause mediation. No partner notification, ever (spec §4-5).
    await repos.repair.saveSession({
      ...session,
      status: 'paused_for_safety',
      safetyLevel: 'urgent',
      safetyCategories: assessment.categories,
      partnerNotified: false,
    })
    return { safetyPaused: true }
  }

  if (submit) {
    const partnerSubmitted = await repos.repair.hasPartnerSubmitted(sessionId, userId)
    const readyForInsight = session.mode === 'solo' || partnerSubmitted
    if (readyForInsight) {
      await generateRepairInsight(sessionId, userId)
    } else if (session.status === 'open') {
      await repos.repair.saveSession({ ...session, status: 'waiting_partner' })
    }
  }
  return { safetyPaused: false }
}

export async function generateRepairInsight(sessionId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  const session = await repos.repair.getSession(sessionId, userId)
  if (!session || session.status === 'paused_for_safety') return

  const aiEntries = await repos.repair.listAiReadableEntries(sessionId)
  if (aiEntries.length === 0) return

  const assessment = combineAssessments(aiEntries.map((e) => checkTextSafety(e.text)))
  if (assessment.level === 'urgent') {
    await repos.repair.saveSession({
      ...session,
      status: 'paused_for_safety',
      safetyLevel: 'urgent',
      safetyCategories: assessment.categories,
      partnerNotified: false,
    })
    return
  }
  if (assessment.injectionDetected) {
    // Injection-flagged text never reaches the model; fail softly.
    await repos.repair.saveSession({ ...session, status: 'insight_ready' })
    return
  }

  const names = new Map<string, string>()
  for (const entry of aiEntries) {
    if (!names.has(entry.userId)) {
      const profile = await repos.profiles.getById(entry.userId)
      names.set(entry.userId, profile?.displayName ?? 'パートナー')
    }
  }

  const inputHash = inputHashOf({
    schemaVersion: AI_SCHEMA_VERSION,
    entries: aiEntries.map((e) => `${e.promptId}:${e.text}`).sort(),
  })
  const existing = await repos.repair.findInsight(sessionId, inputHash)
  if (existing && (existing.status === 'succeeded' || existing.status === 'generating')) {
    if (existing.status === 'succeeded' && session.status !== 'insight_ready') {
      await repos.repair.saveSession({ ...session, status: 'insight_ready' })
    }
    return
  }

  await repos.repair.saveSession({ ...session, status: 'analyzing' })
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()
  const record = await repos.repair.saveInsight({
    id: `ri_${crypto.randomUUID()}`,
    sessionId,
    schemaVersion: AI_SCHEMA_VERSION,
    inputHash,
    attempt: ((await repos.repair.findCurrentInsight(sessionId))?.attempt ?? 0) + 1,
    isCurrent: true,
    status: 'generating',
    payload: null,
    createdAt: new Date().toISOString(),
  })

  try {
    const prompt = [
      '以下は、すれ違いを整えるために二人（または一人）が書いた気持ちの整理です。中立的な要約と対話の道筋を、指定のスキーマで作成してください。',
      ...aiEntries.map((e) =>
        wrapUserData(`${names.get(e.userId)}:${e.promptId}`, e.text),
      ),
    ].join('\n\n')

    const outcome = await generateStructured({
      kind: 'repair_insight',
      schema: repairInsightSchema,
      system: LOVE_INTERPRETER_SYSTEM_PROMPT,
      prompt,
      context: {
        entries: aiEntries.map((e) => ({
          name: names.get(e.userId) ?? '',
          promptId: e.promptId,
          text: e.text,
        })),
        safetyLevel: assessment.level,
      },
    })

    // Post-check: the model may itself escalate (spec §17 safetyLevel).
    if (outcome.object.shouldPauseMediation || outcome.object.safetyLevel === 'urgent') {
      await repos.repair.saveInsight({ ...record, status: 'succeeded', payload: outcome.object })
      await repos.repair.saveSession({
        ...session,
        status: 'paused_for_safety',
        safetyLevel: 'urgent',
        partnerNotified: false,
      })
    } else {
      await repos.repair.saveInsight({ ...record, status: 'succeeded', payload: outcome.object })
      await repos.repair.saveSession({ ...session, status: 'insight_ready' })
    }
    await repos.aiLogs.record({
      id: `ail_${crypto.randomUUID()}`,
      requestId,
      userId: null,
      coupleId: session.coupleId,
      kind: 'repair_insight',
      model: outcome.model,
      inputTokens: outcome.inputTokens,
      outputTokens: outcome.outputTokens,
      success: true,
      durationMs: Date.now() - startedAt,
      schemaVersion: AI_SCHEMA_VERSION,
      errorCode: null,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    const code = error instanceof AiGenerationError ? error.code : 'provider_failed'
    await repos.repair.saveInsight({ ...record, status: 'failed' })
    await repos.repair.saveSession({ ...session, status: 'open' })
    await repos.aiLogs.record({
      id: `ail_${crypto.randomUUID()}`,
      requestId,
      userId: null,
      coupleId: session.coupleId,
      kind: 'repair_insight',
      model: 'unknown',
      inputTokens: null,
      outputTokens: null,
      success: false,
      durationMs: Date.now() - startedAt,
      schemaVersion: AI_SCHEMA_VERSION,
      errorCode: code,
      createdAt: new Date().toISOString(),
    })
  }
}

export async function recordRepairAgreement(
  sessionId: string,
  userId: string,
  text: string,
): Promise<void> {
  const repos = getRepositories()
  const session = await repos.repair.getSession(sessionId, userId)
  if (!session) throw new Error('session not found')
  await repos.repair.saveAgreement({
    id: `ra_${crypto.randomUUID()}`,
    sessionId,
    coupleId: session.coupleId,
    text,
    agreedByUserIds: [userId],
    createdAt: new Date().toISOString(),
  })
}

export async function resolveRepairSession(sessionId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  const session = await repos.repair.getSession(sessionId, userId)
  if (!session) return
  await repos.repair.saveSession({
    ...session,
    status: 'resolved',
    closedAt: new Date().toISOString(),
  })
  await track('repair_session_completed', { mode: session.mode })
}

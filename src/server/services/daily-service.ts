import 'server-only'
import { createHash } from 'node:crypto'
import { getRepositories } from '@/server/repositories'
import {
  canEditAnswer,
  isRevealed,
  statusAfterSubmit,
  transition,
} from '@/server/policies/assignment-policy'
import { partnerOf } from '@/server/policies/couple-policy'
import type { Question, QuestionAssignment, AnswerValue } from '@/types/entities'
import type { VisibilityLevel } from '@/types/domain'
import type { RevealedAnswerDTO, TodayViewDTO } from '@/types/dto'
import { daysBetween, localDateKey } from '@/lib/dates'
import { track } from '@/lib/analytics/track'
import { getInsightForAssignment } from './insight-service'

/**
 * Daily question flow (spec §8–§10). One question per couple per local day,
 * picked deterministically; sensitivity unlocks gradually with pairing age
 * (§9: sensitive topics never on day one).
 */

function maxSensitivityFor(pairedAt: string | null): number {
  const days = pairedAt ? daysBetween(pairedAt) : 0
  if (days < 7) return 0
  if (days < 21) return 1
  return 2
}

function pickQuestion(questions: Question[], coupleId: string, date: string): Question {
  const digest = createHash('sha256').update(`${coupleId}:${date}`).digest()
  const index = digest.readUInt32BE(0) % questions.length
  return questions[index]
}

export async function ensureTodayAssignment(
  coupleId: string,
  userId: string,
): Promise<QuestionAssignment> {
  const repos = getRepositories()
  const profile = await repos.profiles.getById(userId)
  const date = localDateKey(profile?.timezone ?? 'Asia/Tokyo')
  const existing = await repos.assignments.getTodayForCouple(coupleId, userId, date)
  if (existing) return existing

  const membership = await repos.couples.getById(coupleId, userId)
  if (!membership) throw new Error('not a couple member')
  const maxSensitivity = maxSensitivityFor(membership.couple.pairedAt)
  const candidates = (await repos.questions.listActive()).filter(
    (q) =>
      !q.premium &&
      q.sensitivity <= maxSensitivity &&
      (q.stages === 'all' || q.stages.includes(membership.couple.relationshipStage)) &&
      ['pack-daily', 'pack-gratitude', 'pack-affection'].includes(q.packId),
  )
  const question = pickQuestion(candidates, coupleId, date)
  const now = new Date().toISOString()
  return repos.assignments.create({
    id: `as_${crypto.randomUUID()}`,
    coupleId,
    questionId: question.id,
    source: 'daily',
    journeyStepId: null,
    assignedDate: date,
    status: 'assigned',
    statusHistory: [{ status: 'assigned', at: now }],
    revealedAt: null,
    insightError: null,
    createdAt: now,
  })
}

export async function getTodayView(
  assignmentId: string,
  viewerUserId: string,
): Promise<TodayViewDTO | null> {
  const repos = getRepositories()
  const assignment = await repos.assignments.getById(assignmentId, viewerUserId)
  if (!assignment) return null
  const question = await repos.questions.getById(assignment.questionId)
  if (!question) return null

  const { mine, partner, partnerSubmitted } = await repos.answers.getForAssignment(
    assignmentId,
    viewerUserId,
  )

  const insight = await getInsightForAssignment(assignment, viewerUserId)

  const toRevealed = async (userId: string, value: AnswerValue, submittedAt: string | null) => {
    const profile = await repos.profiles.getById(userId)
    return {
      userId,
      displayName: profile?.displayName ?? '',
      value,
      submittedAt,
    } satisfies RevealedAnswerDTO
  }

  return {
    assignmentId: assignment.id,
    status: assignment.status,
    question: {
      id: question.id,
      text: question.text,
      helper: question.helper ?? null,
      format: question.format,
      options: question.options ?? null,
      category: question.category,
      estimatedMinutes: question.estimatedMinutes,
    },
    myAnswer: {
      value: mine?.value ?? null,
      visibility: mine?.visibility ?? 'shared',
      submitted: mine?.submitted ?? false,
    },
    partnerSubmitted,
    // The repository already refused to return an unrevealed partner answer;
    // this mapper only shapes what is legitimately visible.
    partnerAnswer: partner ? await toRevealed(partner.userId, partner.value, partner.submittedAt) : null,
    myRevealedAnswer:
      mine && isRevealed(assignment.status)
        ? await toRevealed(mine.userId, mine.value, mine.submittedAt)
        : null,
    insight: insight.payload,
    insightStatus: insight.status,
    revealedAt: assignment.revealedAt,
  }
}

export async function saveDraft(
  assignmentId: string,
  userId: string,
  value: AnswerValue,
  visibility: VisibilityLevel,
): Promise<void> {
  const repos = getRepositories()
  const assignment = await repos.assignments.getById(assignmentId, userId)
  if (!assignment) throw new Error('assignment not found')
  if (!canEditAnswer(assignment)) throw new Error('answers are locked after reveal')

  const { mine } = await repos.answers.getForAssignment(assignmentId, userId)
  const now = new Date().toISOString()
  if (mine) {
    await repos.answers.addRevision({
      id: `rev_${crypto.randomUUID()}`,
      answerId: mine.id,
      value: mine.value,
      editedAt: now,
    })
  }
  await repos.answers.saveDraft({
    id: mine?.id ?? `ans_${crypto.randomUUID()}`,
    assignmentId,
    coupleId: assignment.coupleId,
    userId,
    value,
    visibility,
    submitted: mine?.submitted ?? false,
    submittedAt: mine?.submittedAt ?? null,
    createdAt: mine?.createdAt ?? now,
    updatedAt: now,
  })
  if (assignment.status === 'assigned') {
    await repos.assignments.save(transition(assignment, 'draft', now))
  }
}

/**
 * Submit — and when this is the second submission, advance to
 * ready_to_reveal → revealed in the same operation, so no client ever
 * observes a half-revealed state (spec §4-3, §10).
 */
export async function submitAnswer(assignmentId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  let assignment = await repos.assignments.getById(assignmentId, userId)
  if (!assignment) throw new Error('assignment not found')
  if (!canEditAnswer(assignment)) throw new Error('already revealed')

  const { mine } = await repos.answers.getForAssignment(assignmentId, userId)
  if (!mine) throw new Error('no draft to submit')
  const now = new Date().toISOString()
  await repos.answers.submit(mine.id, userId, now)

  const after = await repos.answers.getForAssignment(assignmentId, userId)
  const bothSubmitted = (after.mine?.submitted ?? false) && after.partnerSubmitted

  if (assignment.status === 'assigned' || assignment.status === 'draft') {
    assignment = transition(assignment, 'submitted', now)
  }
  const next = statusAfterSubmit(bothSubmitted)
  if (assignment.status === 'submitted' || assignment.status === 'waiting_partner') {
    if (next === 'ready_to_reveal' || assignment.status === 'submitted') {
      assignment = transition(assignment, next, now)
    }
  }
  if (assignment.status === 'ready_to_reveal') {
    assignment = transition(assignment, 'revealed', now)
    await track('both_answers_revealed', { assignmentId })
  }
  await repos.assignments.save(assignment)
  await track('answer_submitted', { assignmentId })
}

export async function markTalked(assignmentId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  const assignment = await repos.assignments.getById(assignmentId, userId)
  if (!assignment) return
  if (assignment.status === 'insight_ready' || assignment.status === 'revealed') {
    await repos.assignments.save(transition(assignment, 'completed', new Date().toISOString()))
  }
}

export async function getPartnerName(coupleId: string, userId: string): Promise<string | null> {
  const repos = getRepositories()
  const membership = await repos.couples.getById(coupleId, userId)
  if (!membership) return null
  const partnerId = partnerOf(membership.members, coupleId, userId)
  if (!partnerId) return null
  const profile = await repos.profiles.getById(partnerId)
  return profile?.displayName ?? null
}

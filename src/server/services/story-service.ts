import 'server-only'
import { getRepositories } from '@/server/repositories'
import { isRevealed } from '@/server/policies/assignment-policy'
import type { StoryDTO } from '@/types/dto'
import { daysBetween } from '@/lib/dates'

/** ふたりページ (spec §14): the couple's accumulated record. */
export async function getStory(coupleId: string, userId: string): Promise<StoryDTO | null> {
  const repos = getRepositories()
  const membership = await repos.couples.getById(coupleId, userId)
  if (!membership) return null

  const partnerMember = membership.members.find((m) => m.userId !== userId && m.active)
  const partnerProfile = partnerMember ? await repos.profiles.getById(partnerMember.userId) : null

  const [assignments, answers, agreements, progressList, timeline] = await Promise.all([
    repos.assignments.listForCouple(coupleId, userId),
    repos.answers.listRevealedForCouple(coupleId, userId),
    repos.agreements.list(coupleId, userId),
    repos.journeys.listProgress(coupleId, userId),
    repos.timeline.list(coupleId, userId),
  ])

  const revealed = assignments.filter((a) => isRevealed(a.status))
  const revealedIds = new Set(revealed.map((a) => a.id))
  const gratitudeAssignments = new Set(
    (
      await Promise.all(
        revealed.map(async (a) => {
          const q = await repos.questions.getById(a.questionId)
          return q?.category === 'gratitude' ? a.id : null
        }),
      )
    ).filter((id): id is string => id !== null),
  )

  const gratitudeTexts = answers
    .filter(
      (ans) =>
        gratitudeAssignments.has(ans.assignmentId) &&
        revealedIds.has(ans.assignmentId) &&
        ans.value.kind === 'text',
    )
    .map((ans) => (ans.value.kind === 'text' ? ans.value.text : ''))
    .filter(Boolean)
    .slice(-3)

  const sharedValues = answers
    .filter((ans) => revealedIds.has(ans.assignmentId) && ans.value.kind === 'text')
    .map((ans) => (ans.value.kind === 'text' ? ans.value.text.split(/[。\n]/)[0] : ''))
    .filter((s) => s.length > 3 && s.length <= 40)
    .slice(-5)

  return {
    couple: {
      coupleId,
      relationshipStage: membership.couple.relationshipStage,
      partner: partnerProfile
        ? { userId: partnerProfile.id, displayName: partnerProfile.displayName }
        : null,
      pairedAt: membership.couple.pairedAt,
      daysTogether: membership.couple.pairedAt ? daysBetween(membership.couple.pairedAt) : null,
    },
    stats: {
      conversationsCompleted: revealed.length,
      gratitudeShared: gratitudeTexts.length,
      agreementsMade: agreements.length,
      journeysCompleted: progressList.filter((p) => p.status === 'completed').length,
    },
    timeline: timeline.map((t) => ({ id: t.id, kind: t.kind, title: t.title, date: t.date })),
    recentGratitude: gratitudeTexts,
    sharedValues,
  }
}

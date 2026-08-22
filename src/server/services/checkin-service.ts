import 'server-only'
import { getRepositories } from '@/server/repositories'
import { weeklyCheckinQuestions } from '@/content/weekly-checkin'
import { isoWeekKey } from '@/lib/dates'
import { track } from '@/lib/analytics/track'
import type { WeeklyCheckinDTO } from '@/types/dto'
import { getPartnerName } from './daily-service'

/** Weekly check-in (spec §24): same both-submit-then-reveal discipline as daily. */

export async function getWeeklyCheckin(
  coupleId: string,
  userId: string,
): Promise<WeeklyCheckinDTO> {
  const repos = getRepositories()
  const weekKey = isoWeekKey()
  let checkin = await repos.checkins.getForWeek(coupleId, weekKey, userId)
  if (!checkin) {
    checkin = await repos.checkins.create({
      id: `wc_${crypto.randomUUID()}`,
      coupleId,
      weekKey,
      status: 'open',
      revealedAt: null,
      createdAt: new Date().toISOString(),
    })
  }
  const { mine, partner, partnerSubmitted } = await repos.checkins.getAnswers(checkin.id, userId)
  return {
    checkinId: checkin.id,
    weekKey,
    status: checkin.status,
    questions: weeklyCheckinQuestions,
    myAnswers: mine?.answers ?? null,
    mySubmitted: mine?.submitted ?? false,
    partnerSubmitted,
    partnerAnswers: partner?.answers ?? null,
    partnerName: await getPartnerName(coupleId, userId),
  }
}

export async function submitWeeklyCheckin(
  checkinId: string,
  userId: string,
  answers: Array<{ questionId: string; text: string }>,
): Promise<void> {
  const repos = getRepositories()
  const now = new Date().toISOString()
  await repos.checkins.saveAnswers({
    id: `wca_${crypto.randomUUID()}`,
    checkinId,
    userId,
    answers,
    submitted: true,
    submittedAt: now,
  })

  const { mine, partnerSubmitted } = await repos.checkins.getAnswers(checkinId, userId)
  if (!mine) return
  const checkinAfter = await findCheckin(checkinId, userId)
  if (!checkinAfter) return
  if (partnerSubmitted) {
    await repos.checkins.save({ ...checkinAfter, status: 'revealed', revealedAt: now })
    await track('weekly_checkin_completed', { checkinId })
  } else if (checkinAfter.status === 'open') {
    await repos.checkins.save({ ...checkinAfter, status: 'waiting_partner' })
  }
}

async function findCheckin(checkinId: string, userId: string) {
  const repos = getRepositories()
  // getForWeek requires the week key; walk from the answer's checkin id
  const weekKey = isoWeekKey()
  const membership = await repos.couples.getForUser(userId)
  if (!membership) return null
  const checkin = await repos.checkins.getForWeek(membership.couple.id, weekKey, userId)
  return checkin?.id === checkinId ? checkin : null
}

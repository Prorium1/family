import 'server-only'
import { getRepositories } from '@/server/repositories'
import type { Gender, LocaleCode, RelationshipStage } from '@/types/domain'
import type { NotificationPreference } from '@/types/entities'

/**
 * Settings, consent, export and deletion (spec §33 items 16–19).
 * None of this is ever gated by plan (spec §27).
 */

export async function completeOnboarding(
  userId: string,
  input: {
    displayName: string
    gender: Gender
    locale: LocaleCode
    timezone: string
    ageConfirmed: boolean
    termsAccepted: boolean
    aiConsent: boolean
    stage: RelationshipStage
  },
): Promise<void> {
  const repos = getRepositories()
  await repos.profiles.update(userId, {
    displayName: input.displayName,
    gender: input.gender,
    locale: input.locale,
    timezone: input.timezone,
    ageConfirmed: input.ageConfirmed,
  })
  const now = new Date().toISOString()
  await repos.consents.record({
    id: `co_${crypto.randomUUID()}`,
    userId,
    kind: 'terms',
    granted: input.termsAccepted,
    version: '1.0',
    recordedAt: now,
  })
  await repos.consents.record({
    id: `co_${crypto.randomUUID()}`,
    userId,
    kind: 'ai_processing',
    granted: input.aiConsent,
    version: '1.0',
    recordedAt: now,
  })
  // AI training consent is OFF by default and untouched here (spec §18).
  const membership = await repos.couples.getForUser(userId)
  if (membership) {
    await repos.couples.updateStage(membership.couple.id, userId, input.stage)
  }
}

/**
 * Has this person agreed to AI processing of what they write?
 *
 * Onboarding promises: 「同意しない場合も、AI以外のすべての機能を利用できます」.
 * Keeping that promise means asking here before any text reaches a model —
 * the consent record alone is not the guarantee, this check is.
 */
export async function hasAiProcessingConsent(userId: string): Promise<boolean> {
  const consents = await getRepositories().consents.list(userId)
  return [...consents].reverse().find((c) => c.kind === 'ai_processing')?.granted ?? false
}

/**
 * A daily insight is built from BOTH voices, so it needs both agreements.
 * If either partner has not agreed, the AI receives nothing at all — not
 * even the half that did agree, because half of a conversation is exactly
 * what this product refuses to interpret.
 */
export async function coupleAllowsAiProcessing(coupleId: string, viewerUserId: string): Promise<boolean> {
  const membership = await getRepositories().couples.getById(coupleId, viewerUserId)
  if (!membership) return false
  const answers = await Promise.all(
    membership.members.filter((m) => m.active).map((m) => hasAiProcessingConsent(m.userId)),
  )
  return answers.length > 0 && answers.every(Boolean)
}

export async function setAiTrainingConsent(userId: string, granted: boolean): Promise<void> {
  await getRepositories().consents.record({
    id: `co_${crypto.randomUUID()}`,
    userId,
    kind: 'ai_training',
    granted,
    version: '1.0',
    recordedAt: new Date().toISOString(),
  })
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreference> {
  return getRepositories().notificationPreferences.get(userId)
}

export async function saveNotificationPreferences(pref: NotificationPreference): Promise<void> {
  await getRepositories().notificationPreferences.save(pref)
}

/**
 * JSON export of everything the requesting user may see: their own data in
 * full, shared data only where the reveal rules already allow it. A partner's
 * unrevealed answer can not appear here — the repository refuses to return it.
 */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const repos = getRepositories()
  const profile = await repos.profiles.getById(userId)
  const membership = await repos.couples.getForUser(userId)
  const coupleId = membership?.couple.id ?? null

  const [ownAnswers, consents, dataRequests] = await Promise.all([
    repos.answers.listOwn(userId),
    repos.consents.list(userId),
    repos.dataRequests.list(userId),
  ])

  const shared = coupleId
    ? {
        couple: membership?.couple,
        revealedAnswers: await repos.answers.listRevealedForCouple(coupleId, userId),
        agreements: await repos.agreements.list(coupleId, userId),
        timeline: await repos.timeline.list(coupleId, userId),
        manual: await repos.manual.list(coupleId, userId),
      }
    : null

  await repos.dataRequests.create({
    id: `udr_${crypto.randomUUID()}`,
    userId,
    kind: 'export',
    status: 'completed',
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  })

  return {
    exportedAt: new Date().toISOString(),
    profile,
    ownAnswers,
    consents,
    dataRequests,
    shared,
  }
}

export async function requestDataDeletion(userId: string): Promise<void> {
  await getRepositories().dataRequests.create({
    id: `udr_${crypto.randomUUID()}`,
    userId,
    kind: 'deletion',
    status: 'pending',
    requestedAt: new Date().toISOString(),
    completedAt: null,
  })
}

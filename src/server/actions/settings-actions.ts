'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireOnboardedSession, requireSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { unpairCouple } from '@/server/services/pairing-service'
import {
  requestDataDeletion,
  saveNotificationPreferences,
  setAiTrainingConsent,
} from '@/server/services/settings-service'

export async function updateProfileAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  const displayName = z.string().trim().min(1).max(30).safeParse(formData.get('displayName'))
  if (displayName.success) {
    await getRepositories().profiles.update(session.userId, { displayName: displayName.data })
  }
  revalidatePath('/settings/profile')
}

export async function saveNotificationsAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  await saveNotificationPreferences({
    userId: session.userId,
    dailyQuestion: formData.get('dailyQuestion') === 'on',
    bothRevealed: formData.get('bothRevealed') === 'on',
    weeklyCheckin: formData.get('weeklyCheckin') === 'on',
    gratitudeReceived: formData.get('gratitudeReceived') === 'on',
    preferredTime: String(formData.get('preferredTime') ?? '20:00'),
    coupleTimeStart: String(formData.get('coupleTimeStart') ?? '') || null,
    coupleTimeEnd: String(formData.get('coupleTimeEnd') ?? '') || null,
  })
  revalidatePath('/settings/notifications')
}

export async function setAiTrainingConsentAction(formData: FormData): Promise<void> {
  const session = await requireSession()
  await setAiTrainingConsent(session.userId, formData.get('granted') === 'on')
  revalidatePath('/settings/privacy')
}

export async function unpairAction(formData: FormData): Promise<void> {
  const session = await requireOnboardedSession()
  const choice = formData.get('dataChoice') === 'delete_mine' ? 'delete_mine' : 'keep'
  await unpairCouple(session.userId, choice)
  redirect('/pair?unpaired=1')
}

export async function requestDeletionAction(): Promise<void> {
  const session = await requireSession()
  await requestDataDeletion(session.userId)
  revalidatePath('/settings/data')
}

'use server'

import { revalidatePath } from 'next/cache'
import { requireCoupleSession } from '@/lib/auth/session'
import { draftSchema } from '@/lib/validation/forms'
import { markTalked, saveDraft, submitAnswer } from '@/server/services/daily-service'
import { regenerateDailyInsight } from '@/server/services/insight-service'
import { syncJourneyProgress } from '@/server/services/journey-service'

export interface DailyActionState {
  error?: string
  savedAt?: string
}

export async function saveDraftAction(
  _prev: DailyActionState,
  formData: FormData,
): Promise<DailyActionState> {
  const session = await requireCoupleSession()
  const parsed = draftSchema.safeParse({
    assignmentId: formData.get('assignmentId'),
    value: JSON.parse(String(formData.get('value') ?? 'null')),
    visibility: formData.get('visibility') ?? 'shared',
  })
  if (!parsed.success) return { error: '入力内容を確認してください。' }
  try {
    await saveDraft(parsed.data.assignmentId, session.userId, parsed.data.value, parsed.data.visibility)
    return { savedAt: new Date().toISOString() }
  } catch {
    return { error: '保存できませんでした。' }
  }
}

export async function submitAnswerAction(
  _prev: DailyActionState,
  formData: FormData,
): Promise<DailyActionState> {
  const session = await requireCoupleSession()
  const assignmentId = String(formData.get('assignmentId') ?? '')
  const rawValue = formData.get('value')
  try {
    if (rawValue) {
      const parsed = draftSchema.safeParse({
        assignmentId,
        value: JSON.parse(String(rawValue)),
        visibility: formData.get('visibility') ?? 'shared',
      })
      if (!parsed.success) return { error: '入力内容を確認してください。' }
      await saveDraft(assignmentId, session.userId, parsed.data.value, parsed.data.visibility)
    }
    await submitAnswer(assignmentId, session.userId)
    await syncJourneyProgress(session.coupleId, session.userId)
    revalidatePath(`/today/${assignmentId}`)
    revalidatePath('/home')
    return { savedAt: new Date().toISOString() }
  } catch {
    return { error: '送信できませんでした。もう一度お試しください。' }
  }
}

export async function regenerateInsightAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const assignmentId = String(formData.get('assignmentId') ?? '')
  await regenerateDailyInsight(assignmentId, session.userId)
  revalidatePath(`/today/${assignmentId}`)
}

export async function markTalkedAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const assignmentId = String(formData.get('assignmentId') ?? '')
  await markTalked(assignmentId, session.userId)
  revalidatePath(`/today/${assignmentId}`)
  revalidatePath('/home')
}

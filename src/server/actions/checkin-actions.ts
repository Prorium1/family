'use server'

import { revalidatePath } from 'next/cache'
import { requireCoupleSession } from '@/lib/auth/session'
import { checkinAnswersSchema } from '@/lib/validation/forms'
import { submitWeeklyCheckin } from '@/server/services/checkin-service'

export interface CheckinActionState {
  error?: string
  done?: boolean
}

export async function submitCheckinAction(
  _prev: CheckinActionState,
  formData: FormData,
): Promise<CheckinActionState> {
  const session = await requireCoupleSession()
  const answers: Array<{ questionId: string; text: string }> = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('answer:') && typeof value === 'string' && value.trim()) {
      answers.push({ questionId: key.slice('answer:'.length), text: value })
    }
  }
  const parsed = checkinAnswersSchema.safeParse({
    checkinId: formData.get('checkinId'),
    answers,
  })
  if (!parsed.success) return { error: '少なくとも1つの質問に答えてください。' }
  await submitWeeklyCheckin(parsed.data.checkinId, session.userId, parsed.data.answers)
  revalidatePath('/weekly-checkin')
  return { done: true }
}

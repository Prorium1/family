'use server'

import { revalidatePath } from 'next/cache'
import { requireCoupleSession } from '@/lib/auth/session'
import { agreementSchema } from '@/lib/validation/forms'
import { createAgreement, reviseAgreement } from '@/server/services/agreement-service'

export interface AgreementActionState {
  error?: string
  createdId?: string
}

export async function createAgreementAction(
  _prev: AgreementActionState,
  formData: FormData,
): Promise<AgreementActionState> {
  const session = await requireCoupleSession()
  const parsed = agreementSchema.safeParse({
    category: formData.get('category'),
    title: formData.get('title'),
    background: formData.get('background') ?? '',
    decision: formData.get('decision'),
    startsOn: String(formData.get('startsOn') ?? '') || null,
    reviewOn: String(formData.get('reviewOn') ?? '') || null,
  })
  if (!parsed.success) return { error: 'タイトルと決めたことを入力してください。' }
  const id = await createAgreement(session.coupleId, session.userId, parsed.data)
  revalidatePath('/agreements')
  revalidatePath('/future')
  return { createdId: id }
}

export async function reviseAgreementAction(
  _prev: AgreementActionState,
  formData: FormData,
): Promise<AgreementActionState> {
  const session = await requireCoupleSession()
  const agreementId = String(formData.get('agreementId') ?? '')
  const parsed = agreementSchema
    .pick({ title: true, background: true, decision: true })
    .safeParse({
      title: formData.get('title'),
      background: formData.get('background') ?? '',
      decision: formData.get('decision'),
    })
  if (!parsed.success) return { error: '入力内容を確認してください。' }
  await reviseAgreement(agreementId, session.userId, {
    ...parsed.data,
    comment: String(formData.get('comment') ?? '') || null,
  })
  revalidatePath('/agreements')
  return {}
}

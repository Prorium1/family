'use server'

import { revalidatePath } from 'next/cache'
import { requireCoupleSession } from '@/lib/auth/session'
import { confirmManualItem, deleteManualItem } from '@/server/services/manual-service'

export async function confirmManualItemAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  await confirmManualItem(String(formData.get('itemId') ?? ''), session.coupleId, session.userId)
  revalidatePath('/manual')
}

export async function deleteManualItemAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  await deleteManualItem(String(formData.get('itemId') ?? ''), session.userId)
  revalidatePath('/manual')
}

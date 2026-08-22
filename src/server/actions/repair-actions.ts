'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireCoupleSession } from '@/lib/auth/session'
import { repairEntriesSchema } from '@/lib/validation/forms'
import {
  recordRepairAgreement,
  resolveRepairSession,
  saveRepairEntries,
  startRepairSession,
} from '@/server/services/repair-service'

export async function startRepairAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const mode = z.enum(['solo', 'together']).catch('solo').parse(formData.get('mode'))
  const topic = String(formData.get('topic') ?? '').trim() || null
  const sessionId = await startRepairSession(session.coupleId, session.userId, mode, topic)
  redirect(`/repair/${sessionId}`)
}

export interface RepairEntriesState {
  error?: string
  safetyPaused?: boolean
  saved?: boolean
}

export async function saveRepairEntriesAction(
  _prev: RepairEntriesState,
  formData: FormData,
): Promise<RepairEntriesState> {
  const session = await requireCoupleSession()
  const entries: Array<{ promptId: string; text: string }> = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('entry:') && typeof value === 'string') {
      entries.push({ promptId: key.slice('entry:'.length), text: value })
    }
  }
  const parsed = repairEntriesSchema.safeParse({
    sessionId: formData.get('sessionId'),
    entries,
    visibility: formData.get('visibility') ?? 'ai_summary',
    submit: formData.get('submit') === 'true',
  })
  if (!parsed.success) return { error: '入力内容を確認してください。' }
  try {
    const result = await saveRepairEntries(
      parsed.data.sessionId,
      session.userId,
      parsed.data.entries,
      parsed.data.visibility,
      parsed.data.submit,
    )
    revalidatePath(`/repair/${parsed.data.sessionId}`)
    return { saved: true, safetyPaused: result.safetyPaused }
  } catch {
    return { error: '保存できませんでした。' }
  }
}

export async function recordRepairAgreementAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const sessionId = String(formData.get('sessionId') ?? '')
  const text = String(formData.get('text') ?? '').trim()
  if (text) await recordRepairAgreement(sessionId, session.userId, text)
  revalidatePath(`/repair/${sessionId}`)
}

export async function resolveRepairAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const sessionId = String(formData.get('sessionId') ?? '')
  await resolveRepairSession(sessionId, session.userId)
  revalidatePath('/repair')
  redirect('/repair')
}

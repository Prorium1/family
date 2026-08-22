'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { RELATIONSHIP_STAGES } from '@/types/domain'
import { requireOnboardedSession } from '@/lib/auth/session'
import { inviteAcceptSchema } from '@/lib/validation/forms'
import {
  acceptInvitation,
  createInvitation,
  PairingError,
  revokeInvitation,
} from '@/server/services/pairing-service'

export interface PairingActionState {
  error?: string
  invite?: { inviteUrl: string; code: string; expiresAt: string }
}

export async function createInviteAction(
  _prev: PairingActionState,
  formData: FormData,
): Promise<PairingActionState> {
  const session = await requireOnboardedSession()
  const stage = z.enum(RELATIONSHIP_STAGES).catch('dating').parse(formData.get('stage'))
  try {
    const invite = await createInvitation(session.userId, stage)
    return { invite }
  } catch (error) {
    if (error instanceof PairingError && error.code === 'already_paired') {
      redirect('/home')
    }
    return { error: '招待の作成に失敗しました。もう一度お試しください。' }
  }
}

export async function revokeInviteAction(): Promise<void> {
  const session = await requireOnboardedSession()
  await revokeInvitation(session.userId)
  revalidatePath('/pair')
}

export async function acceptInviteAction(
  _prev: PairingActionState,
  formData: FormData,
): Promise<PairingActionState> {
  const session = await requireOnboardedSession()
  const parsed = inviteAcceptSchema.safeParse({ secret: formData.get('secret') })
  if (!parsed.success) return { error: 'コードを入力してください。' }
  try {
    await acceptInvitation(session.userId, parsed.data.secret)
  } catch (error) {
    if (error instanceof PairingError) {
      if (error.code === 'too_many_attempts') {
        return { error: '試行回数が上限に達しました。しばらくしてからお試しください。' }
      }
      if (error.code === 'already_paired') redirect('/home')
      if (error.code === 'self_accept') {
        return { error: '自分の招待コードは使えません。パートナーに共有してください。' }
      }
    }
    return { error: 'コードが確認できませんでした。もう一度お確かめください。' }
  }
  redirect('/home?paired=1')
}

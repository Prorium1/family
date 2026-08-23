'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { RELATIONSHIP_STAGES } from '@/types/domain'
import { requireOnboardedSession } from '@/lib/auth/session'
import { inviteAcceptSchema } from '@/lib/validation/forms'
import { looksLikeInviteSecret, normalizeInviteSecret } from '@/lib/pairing/invite-secret'
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
    // Build the link on the host the inviter is actually browsing, so it
    // works across preview/production domains without reconfiguration.
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    const invite = await createInvitation(
      session.userId,
      stage,
      host ? `${proto}://${host}` : undefined,
    )
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

/**
 * Make a fresh code, retiring the old one in the same step. Someone reaches
 * for this when the code has been seen by the wrong person, or read out
 * wrongly over the phone — so the previous secret must stop working, not
 * merely be replaced on screen.
 */
export async function refreshInviteAction(
  _prev: PairingActionState,
  formData: FormData,
): Promise<PairingActionState> {
  const session = await requireOnboardedSession()
  // Carry the stage the couple already chose across to the new code; a new
  // code is not a new answer to that question.
  const stage = await revokeInvitation(session.userId)
  const next = new FormData()
  next.set('stage', stage ?? String(formData.get('stage') ?? 'dating'))
  return createInviteAction({}, next)
}

export async function acceptInviteAction(
  _prev: PairingActionState,
  formData: FormData,
): Promise<PairingActionState> {
  const session = await requireOnboardedSession()
  // A scanned QR, a pasted link and a typed code all arrive here; they are
  // reduced to the one secret the server can check (src/lib/pairing).
  const raw = String(formData.get('secret') ?? '')
  if (!looksLikeInviteSecret(raw)) {
    return {
      error: raw.trim()
        ? '招待コードまたは招待リンクを確認してください。'
        : 'コードを入力してください。',
    }
  }
  const parsed = inviteAcceptSchema.safeParse({ secret: normalizeInviteSecret(raw) })
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

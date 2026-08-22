'use server'

import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { onboardingSchema } from '@/lib/validation/forms'
import { completeOnboarding } from '@/server/services/settings-service'
import { acceptInvitation } from '@/server/services/pairing-service'
import { clearInviteToken, readInviteToken } from '@/lib/auth/invite-cookie'
import { track } from '@/lib/analytics/track'

export interface OnboardingActionState {
  error?: string
}

/**
 * One submit finishes registration — and, for an invited partner, the
 * pairing too: the invite token stored by /join is redeemed right here, so
 * they land on /home already connected (spec §7 activation flow).
 */
export async function completeOnboardingAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await requireSession()
  const consented = formData.get('consent') === 'on'
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get('displayName'),
    gender: formData.get('gender'),
    locale: formData.get('locale') ?? 'ja',
    timezone: formData.get('timezone') || 'Asia/Tokyo',
    stage: formData.get('stage'),
    ageConfirmed: consented,
    termsAccepted: consented,
    aiConsent: formData.get('aiConsent') === 'on',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' }
  }
  await completeOnboarding(session.userId, parsed.data)
  await track('signup_completed', { locale: parsed.data.locale, stage: parsed.data.stage })

  if (session.coupleId) redirect('/home')

  // Invited partner: redeem the token from the /join link — no code entry.
  const inviteToken = await readInviteToken()
  if (inviteToken) {
    try {
      await acceptInvitation(session.userId, inviteToken)
      await clearInviteToken()
      redirect('/home?paired=1')
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error) throw error // redirect()
      await clearInviteToken()
      redirect('/pair?invite=expired')
    }
  }

  // Inviter: land on /pair with the invitation already being prepared.
  redirect(`/pair?auto=1&stage=${parsed.data.stage}`)
}

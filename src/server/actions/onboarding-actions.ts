'use server'

import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { onboardingSchema } from '@/lib/validation/forms'
import { completeOnboarding } from '@/server/services/settings-service'
import { track } from '@/lib/analytics/track'

export interface OnboardingActionState {
  error?: string
}

export async function completeOnboardingAction(
  _prev: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await requireSession()
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get('displayName'),
    locale: formData.get('locale') ?? 'ja',
    timezone: formData.get('timezone') || 'Asia/Tokyo',
    stage: formData.get('stage'),
    ageConfirmed: formData.get('ageConfirmed') === 'on',
    termsAccepted: formData.get('termsAccepted') === 'on',
    aiConsent: formData.get('aiConsent') === 'on',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください。' }
  }
  await completeOnboarding(session.userId, parsed.data)
  await track('signup_completed', { locale: parsed.data.locale, stage: parsed.data.stage })
  redirect(session.coupleId ? '/home' : '/pair')
}

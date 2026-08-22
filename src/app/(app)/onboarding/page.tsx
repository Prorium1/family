import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { PageTitle } from '@/components/shared/page-title'
import { OnboardingForm } from '@/features/auth/components/onboarding-form'

export const metadata = { title: 'はじめまして' }

export default async function OnboardingPage() {
  const session = await requireSession()
  if (session.onboarded) redirect(session.coupleId ? '/home' : '/pair')
  return (
    <div className="mx-auto max-w-md">
      <PageTitle title="はじめまして" subtitle="あなたのことを、少しだけ教えてください。" />
      <OnboardingForm initialName={session.displayName} />
    </div>
  )
}

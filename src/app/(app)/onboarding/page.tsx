import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { readInviteToken } from '@/lib/auth/invite-cookie'
import { peekInvitation } from '@/server/services/pairing-service'
import { PageTitle } from '@/components/shared/page-title'
import { OnboardingForm } from '@/features/auth/components/onboarding-form'

export const metadata = { title: 'はじめまして' }

export default async function OnboardingPage() {
  const session = await requireSession()
  if (session.onboarded) redirect(session.coupleId ? '/home' : '/pair')

  // An invited partner skips the stage question — the invitation carries it.
  const inviteToken = await readInviteToken()
  const invitation = inviteToken ? await peekInvitation(inviteToken) : null

  return (
    <div className="mx-auto max-w-md">
      <PageTitle
        title="はじめまして"
        subtitle={
          invitation
            ? 'あとひと息で、二人がつながります。'
            : 'あなたのことを、少しだけ教えてください。'
        }
      />
      <OnboardingForm
        initialName={session.displayName}
        invited={invitation !== null}
        inviterName={invitation?.inviterName}
      />
    </div>
  )
}

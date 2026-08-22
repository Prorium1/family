import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { GENDERS, type Gender } from '@/types/domain'
import { readInviteToken } from '@/lib/auth/invite-cookie'
import { peekInvitation } from '@/server/services/pairing-service'
import { PageTitle } from '@/components/shared/page-title'
import { OnboardingForm } from '@/features/auth/components/onboarding-form'

export const metadata = { title: 'はじめまして' }

export default async function OnboardingPage({ searchParams }: PageProps<'/onboarding'>) {
  const session = await requireSession()
  if (session.onboarded) redirect(session.coupleId ? '/home' : '/pair')

  // An invited partner skips the stage question — the invitation carries it.
  const inviteToken = await readInviteToken()
  const invitation = inviteToken ? await peekInvitation(inviteToken) : null

  // The entry button already asked 男性 / 女性 — carry that choice in so the
  // same question is never asked twice.
  const params = await searchParams
  const profile = await getRepositories().profiles.getById(session.userId)
  const asked = typeof params.gender === 'string' ? params.gender : ''
  const initialGender: Gender | null =
    (GENDERS as readonly string[]).includes(asked) ? (asked as Gender) : (profile?.gender ?? null)

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
        initialGender={initialGender}
        invited={invitation !== null}
        inviterName={invitation?.inviterName}
      />
    </div>
  )
}

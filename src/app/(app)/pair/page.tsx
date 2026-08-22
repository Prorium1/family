import { redirect } from 'next/navigation'
import { requireOnboardedSession } from '@/lib/auth/session'
import { PageTitle } from '@/components/shared/page-title'
import { InvitePanel } from '@/features/pairing/components/invite-panel'
import { AcceptPanel } from '@/features/pairing/components/accept-panel'

export const metadata = { title: 'ペアリング' }

export default async function PairPage({ searchParams }: PageProps<'/pair'>) {
  const session = await requireOnboardedSession()
  if (session.coupleId) redirect('/home')
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : undefined
  const unpaired = params.unpaired === '1'

  return (
    <div className="mx-auto max-w-md space-y-5">
      {unpaired ? (
        <p className="rounded-card bg-surface-muted px-4 py-3 text-sm text-text-muted">
          ペアを解除しました。これまでの記録の扱いは設定からいつでも確認できます。
        </p>
      ) : null}
      <PageTitle
        title="二人でつながる"
        subtitle="どちらかが招待を作り、もう一人がコードで参加します。"
      />
      <InvitePanel />
      <AcceptPanel initialToken={token} />
    </div>
  )
}

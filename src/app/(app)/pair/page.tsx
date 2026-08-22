import { redirect } from 'next/navigation'
import { requireOnboardedSession } from '@/lib/auth/session'
import { readInviteToken } from '@/lib/auth/invite-cookie'
import { RELATIONSHIP_STAGES, type RelationshipStage } from '@/types/domain'
import { PageTitle } from '@/components/shared/page-title'
import { AutoRefresh } from '@/components/shared/auto-refresh'
import { InvitePanel } from '@/features/pairing/components/invite-panel'
import { AcceptPanel } from '@/features/pairing/components/accept-panel'

export const metadata = { title: 'ペアリング' }

export default async function PairPage({ searchParams }: PageProps<'/pair'>) {
  const session = await requireOnboardedSession()
  if (session.coupleId) redirect('/home')
  const params = await searchParams
  const auto = params.auto === '1'
  const stageParam = typeof params.stage === 'string' ? params.stage : undefined
  const stage = RELATIONSHIP_STAGES.includes(stageParam as RelationshipStage)
    ? (stageParam as RelationshipStage)
    : 'dating'
  const unpaired = params.unpaired === '1'
  const inviteExpired = params.invite === 'expired'
  // A pending /join token can still be redeemed here with one tap.
  const cookieToken = await readInviteToken()
  const queryToken = typeof params.token === 'string' ? params.token : undefined

  return (
    <div className="mx-auto max-w-md space-y-5">
      {/* the moment the partner joins, this screen flips to /home by itself */}
      <AutoRefresh />
      {unpaired ? (
        <p className="rounded-card bg-surface-muted px-4 py-3 text-sm text-text-muted">
          ペアを解除しました。これまでの記録の扱いは設定からいつでも確認できます。
        </p>
      ) : null}
      {params.invite === 'self' ? (
        <p className="rounded-card bg-surface-muted px-4 py-3 text-sm text-text-muted" role="status">
          これはあなた自身が作成した招待リンクです。下のリンクやQRコードをパートナーに送ってください。
        </p>
      ) : null}
      {inviteExpired ? (
        <p className="rounded-card bg-warning-soft px-4 py-3 text-sm text-warning" role="status">
          招待リンクの有効期限が切れていました。新しいリンクを送ってもらうか、下の6桁コードで参加してください。
        </p>
      ) : null}
      <PageTitle
        title="二人でつながる"
        subtitle="リンクを送るか、QRコードを見せるだけ。相手は登録するだけで自動的につながります。"
      />
      <InvitePanel auto={auto} initialStage={stage} inviterName={session.displayName} />
      <AcceptPanel initialToken={cookieToken ?? queryToken} />
    </div>
  )
}

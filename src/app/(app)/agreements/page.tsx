import { requireCoupleSession } from '@/lib/auth/session'
import { listAgreements } from '@/server/services/agreement-service'
import type { FutureCategory } from '@/types/domain'
import { FUTURE_CATEGORIES } from '@/types/domain'
import { PageTitle } from '@/components/shared/page-title'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AgreementForm } from '@/features/agreements/components/agreement-form'

export const metadata = { title: '二人の約束' }

const categoryLabels: Record<string, string> = {
  marriage: '結婚',
  money: 'お金',
  family: '家族',
  work: '仕事',
  dream: '夢',
}

const statusLabels: Record<string, string> = {
  draft: '下書き',
  active: '継続中',
  under_review: '見直し中',
  archived: 'アーカイブ',
}

export default async function AgreementsPage({ searchParams }: PageProps<'/agreements'>) {
  const session = await requireCoupleSession()
  const params = await searchParams
  const rawCategory = typeof params.category === 'string' ? params.category : undefined
  const category = FUTURE_CATEGORIES.includes(rawCategory as FutureCategory)
    ? (rawCategory as FutureCategory)
    : undefined
  const agreements = await listAgreements(session.coupleId, session.userId)
  const filtered = category ? agreements.filter((a) => a.category === category) : agreements

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle
        title="二人の約束"
        subtitle="約束は固定された契約ではありません。定期的に見直しましょう。"
      />

      {filtered.length === 0 ? (
        <div className="mb-6">
          <EmptyState
            title="まだ約束はありません"
            body="話し合って決めたことを、二人の約束として残せます。"
          />
        </div>
      ) : (
        <ul className="mb-8 space-y-3">
          {filtered.map((a) => (
            <li key={a.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <div className="flex gap-1.5">
                      <Badge variant="outline">{categoryLabels[a.category] ?? a.category}</Badge>
                      <Badge variant={a.status === 'active' ? 'success' : 'default'}>
                        {statusLabels[a.status] ?? a.status}
                      </Badge>
                    </div>
                  </div>
                  {a.background ? <CardDescription>{a.background}</CardDescription> : null}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="whitespace-pre-wrap">{a.decision}</p>
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                    {a.startsOn ? (
                      <div>
                        <dt className="inline">開始日: </dt>
                        <dd className="inline">{a.startsOn}</dd>
                      </div>
                    ) : null}
                    {a.reviewOn ? (
                      <div>
                        <dt className="inline">見直し日: </dt>
                        <dd className="inline">{a.reviewOn}</dd>
                      </div>
                    ) : null}
                    {a.revisions.length > 0 ? (
                      <div>
                        <dt className="inline">改訂: </dt>
                        <dd className="inline">{a.revisions.length}回</dd>
                      </div>
                    ) : null}
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>新しい約束をつくる</CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementForm defaultCategory={category} />
        </CardContent>
      </Card>
    </div>
  )
}

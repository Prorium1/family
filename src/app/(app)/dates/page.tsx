import { requireCoupleSession } from '@/lib/auth/session'
import { getDatesView } from '@/server/services/dates-service'
import { removeCoupleDateAction } from '@/server/actions/life-actions'
import { DATE_KIND_LABELS } from '@/lib/ui/couple-life'
import { DateForm } from '@/features/life/components/date-form'
import { PageTitle } from '@/components/shared/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'

export const metadata = { title: 'ふたりの予定' }

function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/** 予定・記念日 (spec: 共有カレンダー・記念日・家族行事・命日・法事). */
export default async function DatesPage() {
  const session = await requireCoupleSession()
  const view = await getDatesView(session.coupleId, session.userId)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle
        title="ふたりの予定"
        subtitle="記念日も、家族の行事も、大切な人を想う日も。二人で同じ日を覚えておけます。"
      />

      {view.upcoming.length === 0 && view.past.length === 0 ? (
        <EmptyState title="最初の予定を、下から加えてみてください" />
      ) : null}

      {view.upcoming.length > 0 ? (
        <ol className="space-y-3">
          {view.upcoming.map((d) => (
            <li key={d.id} className="rounded-card border-border bg-surface shadow-card border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{DATE_KIND_LABELS[d.kind]}</Badge>
                    {d.repeatsYearly ? <span className="text-text-muted text-xs">毎年</span> : null}
                  </div>
                  <p className="mt-1.5 font-semibold">{d.title}</p>
                  <p className="text-text-muted text-sm">
                    {formatDate(d.next ?? d.date)}
                    {d.years ? ` ・ ${d.years}年` : ''}
                  </p>
                  {d.note ? <p className="text-text-muted mt-1 text-sm">{d.note}</p> : null}
                </div>
                <div className="shrink-0 text-right">
                  {d.daysUntil === 0 ? (
                    <p className="text-primary text-lg font-bold">今日</p>
                  ) : (
                    <p className="text-text-muted text-sm">
                      あと
                      <span className="text-primary mx-0.5 text-lg font-bold tabular-nums">
                        {d.daysUntil}
                      </span>
                      日
                    </p>
                  )}
                </div>
              </div>
              <form action={removeCoupleDateAction} className="mt-2 text-right">
                <input type="hidden" name="id" value={d.id} />
                <Button type="submit" variant="ghost" size="sm">
                  削除
                </Button>
              </form>
            </li>
          ))}
        </ol>
      ) : null}

      {view.past.length > 0 ? (
        <details className="rounded-card border-border bg-surface border px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">
            すぎた予定（{view.past.length}）
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {view.past.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="text-text-muted">{formatDate(d.date)}</span>{' '}
                  <span className="font-medium">{d.title}</span>
                </span>
                <form action={removeCoupleDateAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    削除
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>予定を加える</CardTitle>
          <CardDescription>
            加えた予定は二人ともに表示され、当日と前日にホームでお知らせします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateForm />
        </CardContent>
      </Card>
    </div>
  )
}

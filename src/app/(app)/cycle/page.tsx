import { requireCoupleSession } from '@/lib/auth/session'
import { getCycleView } from '@/server/services/cycle-service'
import { getPairStatus } from '@/server/services/pairing-service'
import {
  recordCycleStartAction,
  removeCycleStartAction,
  setCycleSharingAction,
} from '@/server/actions/life-actions'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'からだの周期' }

function formatDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

/**
 * からだの周期 (spec: 生理日共有) — health data, so the page itself restates
 * the rules the code enforces: encrypted, off by default, sharable and
 * revocable by the owner alone, and never a medical statement.
 */
export default async function CyclePage() {
  const session = await requireCoupleSession()
  const [view, pair] = await Promise.all([
    getCycleView(session.coupleId, session.userId),
    getPairStatus(session.userId),
  ])
  const partnerName = pair.couple?.partner?.displayName ?? 'パートナー'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle
        title="からだの周期"
        subtitle="記録するかどうか、相手に見せるかどうかは、いつでも本人だけが決められます。"
      />

      <p className="rounded-card bg-surface-muted text-text-muted flex items-start gap-2 px-4 py-3 text-xs">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
        記録した日付は暗号化して保存され、共有をオンにするまで、存在すら相手に伝わりません。運営も読めません。医療的な予測ではありません。
      </p>

      {/* ── 自分の記録 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-person-a">わたしの記録</CardTitle>
          <CardDescription>周期のはじまりの日を記録します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={recordCycleStartAction} className="flex items-end gap-2">
            <div className="grow space-y-1.5">
              <Label htmlFor="cycle-date">はじまりの日</Label>
              <Input id="cycle-date" name="date" type="date" required max={view.today} />
            </div>
            <Button type="submit" variant="secondary">
              記録する
            </Button>
          </form>

          {view.mine.prediction ? (
            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-card-sm bg-person-a-soft px-2 py-3">
                <dt className="text-text-muted text-xs">前回のはじまり</dt>
                <dd className="text-person-a mt-0.5 text-sm font-bold">
                  {formatDate(view.mine.prediction.lastStart)}
                </dd>
              </div>
              <div className="rounded-card-sm bg-person-a-soft px-2 py-3">
                <dt className="text-text-muted text-xs">次のはじまり（目安）</dt>
                <dd className="text-person-a mt-0.5 text-sm font-bold">
                  {view.mine.prediction.predictedNext
                    ? `${formatDate(view.mine.prediction.predictedNext)}ごろ`
                    : '記録が2回そろうと表示されます'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-text-muted text-sm">まだ記録がありません。</p>
          )}

          {view.mine.starts.length > 0 ? (
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                これまでの記録（{view.mine.starts.length}）
              </summary>
              <ul className="mt-2 space-y-1.5 text-sm">
                {view.mine.starts.map((start) => (
                  <li key={start} className="flex items-center justify-between gap-3">
                    <span>{formatDate(start)}</span>
                    <form action={removeCycleStartAction}>
                      <input type="hidden" name="date" value={start} />
                      <Button type="submit" variant="ghost" size="sm">
                        削除
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </CardContent>
      </Card>

      {/* ── 共有の設定 ── */}
      <Card>
        <CardHeader>
          <CardTitle>共有の設定</CardTitle>
          <CardDescription>
            オンにすると、{partnerName}
            さんに「前回」と「次の目安」だけが表示されます。日々の記録一覧は共有されません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setCycleSharingAction} className="flex items-center justify-between gap-3">
            <Label className="flex items-center gap-3 font-normal">
              <Checkbox name="shared" defaultChecked={view.mine.sharedWithPartner} />
              {partnerName}さんに共有する
            </Label>
            <Button type="submit" variant="outline" size="sm">
              変更を保存
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── 相手の共有 ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-person-b">{partnerName}さんから</CardTitle>
        </CardHeader>
        <CardContent>
          {view.partner?.prediction ? (
            <div className="space-y-2">
              <dl className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-card-sm bg-person-b-soft px-2 py-3">
                  <dt className="text-text-muted text-xs">前回のはじまり</dt>
                  <dd className="text-person-b mt-0.5 text-sm font-bold">
                    {formatDate(view.partner.prediction.lastStart)}
                  </dd>
                </div>
                <div className="rounded-card-sm bg-person-b-soft px-2 py-3">
                  <dt className="text-text-muted text-xs">次のはじまり（目安）</dt>
                  <dd className="text-person-b mt-0.5 text-sm font-bold">
                    {view.partner.prediction.predictedNext
                      ? `${formatDate(view.partner.prediction.predictedNext)}ごろ`
                      : 'まだ目安を出せません'}
                  </dd>
                </div>
              </dl>
              {view.partner.daysUntilPredicted !== null ? (
                <p className="text-text-muted text-sm">
                  目安まで あと{view.partner.daysUntilPredicted}
                  日。いつもよりやさしくできる日が、わかるだけで変わります。
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-text-muted text-sm">
              共有されていません。共有するかどうかは、本人だけが決められます。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

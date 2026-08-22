import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { PageTitle } from '@/components/shared/page-title'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = { title: '整える' }

const statusLabels: Record<string, { label: string; variant: 'default' | 'accent' | 'success' | 'warning' }> = {
  open: { label: '整理中', variant: 'default' },
  waiting_partner: { label: 'パートナー待ち', variant: 'default' },
  analyzing: { label: 'AIが整理中', variant: 'accent' },
  insight_ready: { label: 'メッセージ到着', variant: 'accent' },
  paused_for_safety: { label: '安全確認', variant: 'warning' },
  resolved: { label: '整いました', variant: 'success' },
  closed: { label: '終了', variant: 'default' },
}

export default async function RepairListPage() {
  const session = await requireCoupleSession()
  const sessions = await getRepositories().repair.listSessions(session.coupleId, session.userId)

  return (
    <div>
      <PageTitle title="整える" subtitle="気持ちを整理して、二人で戻るための場所" />
      <div className="mb-5">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/repair/new">気持ちを整理する</Link>
        </Button>
      </div>
      {sessions.length === 0 ? (
        <EmptyState
          title="まだ整えるセッションはありません"
          body="喧嘩やすれ違いを感じたとき、ここで気持ちを整理できます。一人でも、二人でも。"
        />
      ) : (
        <ul className="space-y-3">
          {[...sessions].reverse().map((s) => {
            const meta = statusLabels[s.status] ?? statusLabels.open
            return (
              <li key={s.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        {s.topic ?? '気持ちの整理'}
                      </CardTitle>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <CardDescription>
                      {new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium' }).format(
                        new Date(s.createdAt),
                      )}
                      ・{s.mode === 'solo' ? '一人で整理' : '二人で整理'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/repair/${s.id}`}>ひらく</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

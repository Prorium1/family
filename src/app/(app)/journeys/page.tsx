import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { listJourneys } from '@/server/services/journey-service'
import { PageTitle } from '@/components/shared/page-title'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

export const metadata = { title: '深める' }

export default async function JourneysPage() {
  const session = await requireCoupleSession()
  const journeys = await listJourneys(session.coupleId, session.userId)
  return (
    <div>
      <PageTitle title="深める" subtitle="テーマごとに、二人の対話を深めるプログラム" />
      <div className="mb-5">
        <Card>
          <CardHeader>
            <CardTitle>今週のチェックイン</CardTitle>
            <CardDescription>5つの質問で、今週の二人をふりかえる</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="soft" size="sm">
              <Link href="/weekly-checkin">ひらく</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        {journeys.map((journey) => {
          const percent =
            journey.totalSteps > 0 ? (journey.completedSteps / journey.totalSteps) * 100 : 0
          return (
            <Card key={journey.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{journey.title}</CardTitle>
                  <div className="flex gap-1.5">
                    {journey.premium ? <Badge variant="warning">プレミアム</Badge> : null}
                    {journey.status === 'completed' ? (
                      <Badge variant="success">完了</Badge>
                    ) : null}
                  </div>
                </div>
                <CardDescription>{journey.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Progress
                    value={percent}
                    aria-label={`${journey.completedSteps} / ${journey.totalSteps} ステップ完了`}
                  />
                  <span className="text-xs whitespace-nowrap text-text-muted">
                    {journey.completedSteps} / {journey.totalSteps}
                  </span>
                </div>
                <Button asChild variant={journey.status === 'in_progress' ? 'primary' : 'outline'} size="sm">
                  <Link href={`/journeys/${journey.slug}`}>
                    {journey.status === 'completed'
                      ? 'ふりかえる'
                      : journey.status === 'in_progress'
                        ? '続ける'
                        : 'はじめる'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

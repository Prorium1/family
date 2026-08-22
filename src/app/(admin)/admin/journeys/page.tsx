import { getStepsForJourney, journeys } from '@/content/journeys'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = { title: 'Journey管理' }

export default function AdminJourneysPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Journey</h1>
      <div className="space-y-3">
        {journeys.map((journey) => (
          <Card key={journey.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {journey.title}
                {journey.premium ? <Badge variant="warning">プレミアム</Badge> : null}
                {journey.active ? <Badge variant="success">有効</Badge> : <Badge>停止</Badge>}
              </CardTitle>
              <CardDescription>{journey.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-text-muted">
              {getStepsForJourney(journey.id).length}ステップ
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { getSafetyResources } from '@/content/safety-resources'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QuickExit } from './quick-exit'

/**
 * Shown when the safety checker pauses mediation (spec §4-5). No blame, no
 * urgency to reconcile, no automatic partner notification — resources first.
 */
export function SafetyPause() {
  const resources = getSafetyResources('JP')
  return (
    <div className="space-y-5" data-testid="safety-pause">
      <div className="rounded-card border border-warning/40 bg-warning-soft px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-bold text-warning">まず、あなたの安全を大切にしてください</h2>
          <QuickExit />
        </div>
        <p className="mt-2 text-sm leading-relaxed">
          いただいた内容から、通常の仲直りの前に、あなた自身の安全を確認したい状況だと感じました。無理に話し合いを続ける必要はありません。信頼できる人や、下記の相談窓口に頼ってください。
        </p>
        <p className="mt-2 text-sm font-medium">
          この内容がパートナーへ自動で通知されることはありません。
        </p>
      </div>
      <div className="space-y-3">
        {resources.map((r) => (
          <Card key={r.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {r.name}
                {r.urgent ? <Badge variant="danger">緊急</Badge> : null}
              </CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold tracking-wide">{r.contact}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

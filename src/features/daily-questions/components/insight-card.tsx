import { Sparkles } from 'lucide-react'
import type { DailyInsight } from '@/lib/validation/ai-insight'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/** Structured Daily Insight rendering (spec §17). scores are never shown (spec §4-1). */
export function InsightCard({ insight }: { insight: DailyInsight }) {
  return (
    <Card className="animate-gentle-rise border-accent/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          愛の通訳から、二人へのメッセージ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        <p className="font-medium">{insight.title}</p>
        <p>{insight.reflection}</p>

        {insight.sharedValues.length > 0 ? (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-text-muted">二人の言葉から</h3>
            <ul className="flex flex-wrap gap-1.5">
              {insight.sharedValues.map((value) => (
                <li key={value}>
                  <Badge variant="accent">{value}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {insight.meaningfulDifferences.length > 0 ? (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold text-text-muted">
              違いは、知り合う入口
            </h3>
            <ul className="space-y-2">
              {insight.meaningfulDifferences.map((diff) => (
                <li key={diff.topic} className="rounded-card-sm bg-surface-muted px-3 py-2">
                  {diff.neutralExplanation}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-card-sm border border-border px-4 py-3">
          <h3 className="text-xs font-semibold text-text-muted">二人で話してみませんか</h3>
          <p className="mt-1 font-medium">{insight.conversationQuestion}</p>
        </div>

        <div className="rounded-card-sm bg-accent-soft px-4 py-3 text-accent-foreground">
          <h3 className="text-xs font-semibold">
            今日できる小さなこと（約{insight.microAction.estimatedMinutes}分）
          </h3>
          <p className="mt-1 font-medium">{insight.microAction.title}</p>
          <p className="mt-0.5 text-xs">{insight.microAction.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

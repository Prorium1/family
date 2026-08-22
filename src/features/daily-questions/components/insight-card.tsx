import { Sparkles, Check } from 'lucide-react'
import type { DailyInsight } from '@/lib/validation/ai-insight'
import { saveWeEntryAction } from '@/server/actions/we-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

/**
 * Structured Daily Insight rendering (spec §17). Scores are never shown
 * (spec §4-1). The card ends where the product actually differs: a draft of
 * the couple's own third answer, which they edit and keep as NEW WE
 * (docs/BRAND.md §0.2) — nothing is stored until one of them decides.
 */
export function InsightCard({
  insight,
  assignmentId,
  questionText,
  savedSourceIds = [],
}: {
  insight: DailyInsight
  assignmentId: string
  questionText: string
  savedSourceIds?: string[]
}) {
  const answerSaved = savedSourceIds.includes(assignmentId)

  return (
    <Card className="animate-gentle-rise border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
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
                  <Badge variant="together">{value}</Badge>
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
              {insight.meaningfulDifferences.map((diff, index) => {
                const sourceId = `${assignmentId}:d${index}`
                const saved = savedSourceIds.includes(sourceId)
                return (
                  <li key={diff.topic} className="rounded-card-sm bg-surface-muted px-3 py-2">
                    <p>{diff.neutralExplanation}</p>
                    {saved ? (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-primary">
                        <Check className="size-3.5" aria-hidden="true" />
                        「知ったこと」に残しました
                      </p>
                    ) : (
                      <form action={saveWeEntryAction} className="mt-1.5">
                        <input type="hidden" name="kind" value="discovery" />
                        <input type="hidden" name="title" value={diff.topic} />
                        <input type="hidden" name="body" value={diff.neutralExplanation} />
                        <input type="hidden" name="sourceType" value="daily" />
                        <input type="hidden" name="sourceId" value={sourceId} />
                        <Button type="submit" variant="ghost" size="sm">
                          知ったこととして残す
                        </Button>
                      </form>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        <div className="rounded-card-sm border border-border px-4 py-3">
          <h3 className="text-xs font-semibold text-text-muted">二人で話してみませんか</h3>
          <p className="mt-1 font-medium">{insight.conversationQuestion}</p>
        </div>

        {insight.newWe ? (
          <section className="bg-wash rounded-card px-4 py-4">
            <h3 className="text-blend text-sm font-bold">二人だけの答えの下書き</h3>
            <p className="mt-0.5 text-xs text-text-muted">
              どちらかに合わせる案ではありません。二人の言葉に直してから残せます。
            </p>

            {insight.newWe.keeps.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs">
                {insight.newWe.keeps.map((keep) => (
                  <li key={keep} className="rounded-card-sm bg-surface/70 px-3 py-1.5">
                    {keep}
                  </li>
                ))}
              </ul>
            ) : null}

            {answerSaved ? (
              <p className="mt-3 flex items-center gap-1 text-sm text-primary">
                <Check className="size-4" aria-hidden="true" />
                この答えは「私たち」に残っています
              </p>
            ) : (
              <form action={saveWeEntryAction} className="mt-3 space-y-2">
                <input type="hidden" name="kind" value="answer" />
                <input type="hidden" name="title" value={questionText.slice(0, 110)} />
                <input type="hidden" name="sourceType" value="daily" />
                <input type="hidden" name="sourceId" value={assignmentId} />
                <label htmlFor="new-we-draft" className="sr-only">
                  二人の答え
                </label>
                <Textarea
                  id="new-we-draft"
                  name="body"
                  rows={4}
                  maxLength={2000}
                  defaultValue={insight.newWe.draft}
                />
                <Button type="submit" className="w-full">
                  これを私たちの答えにする
                </Button>
              </form>
            )}

            {insight.newWe.openQuestion ? (
              <p className="mt-3 text-xs text-text-muted">
                これから話すこと: {insight.newWe.openQuestion}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="rounded-card-sm bg-together-soft px-4 py-3 text-primary">
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

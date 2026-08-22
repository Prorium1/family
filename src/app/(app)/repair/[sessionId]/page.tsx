import { notFound } from 'next/navigation'
import { requireCoupleSession } from '@/lib/auth/session'
import { getRepairSession } from '@/server/services/repair-service'
import { repairPrompts } from '@/content/repair-questions'
import { repairFallbackGuide } from '@/content/conversation-guide'
import {
  recordRepairAgreementAction,
  resolveRepairAction,
} from '@/server/actions/repair-actions'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { RepairEntryForm } from '@/features/repair/components/repair-entry-form'
import { SafetyPause } from '@/features/repair/components/safety-pause'
import { QuickExit } from '@/features/repair/components/quick-exit'
import { Sparkles } from 'lucide-react'

export const metadata = { title: '気持ちの整理' }

export default async function RepairSessionPage({ params }: PageProps<'/repair/[sessionId]'>) {
  const session = await requireCoupleSession()
  const { sessionId } = await params
  const repair = await getRepairSession(sessionId, session.userId)
  if (!repair) notFound()

  if (repair.status === 'paused_for_safety') {
    return (
      <div className="mx-auto max-w-xl">
        <SafetyPause />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageTitle
          title={repair.topic ?? '気持ちの整理'}
          subtitle={repair.mode === 'solo' ? '一人で整理しています' : '二人で整理しています'}
        />
        <QuickExit />
      </div>

      {!repair.mySubmitted ? (
        <RepairEntryForm
          sessionId={repair.sessionId}
          prompts={repairPrompts}
          initialEntries={repair.myEntries}
          disabled={false}
        />
      ) : repair.insightStatus === 'ready' && repair.insight ? (
        <div className="animate-gentle-rise space-y-5">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
                愛の通訳からのメッセージ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>{repair.insight.neutralSummary}</p>
              {repair.insight.emotions.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted">見えてきた気持ち</h3>
                  <p className="mt-1">{repair.insight.emotions.join('、')}</p>
                </div>
              ) : null}
              {repair.insight.underlyingNeeds.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted">その奥にあるニーズ</h3>
                  <p className="mt-1">{repair.insight.underlyingNeeds.join('、')}</p>
                </div>
              ) : null}
              {repair.insight.sharedGoal ? (
                <div className="rounded-card-sm bg-together-soft px-4 py-3 text-primary">
                  <h3 className="text-xs font-semibold">二人の共通の願い</h3>
                  <p className="mt-1 font-medium">{repair.insight.sharedGoal}</p>
                </div>
              ) : null}
              {repair.insight.misunderstandingPattern ? (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted">すれ違いの構造</h3>
                  <p className="mt-1">{repair.insight.misunderstandingPattern}</p>
                </div>
              ) : null}
              {repair.insight.conversationSteps.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted">話し合いの順番</h3>
                  <ol className="mt-1 list-decimal space-y-1 pl-5">
                    {repair.insight.conversationSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {repair.insight.suggestedPhrases.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted">伝わりやすい言い方の例</h3>
                  <ul className="mt-1 space-y-1">
                    {repair.insight.suggestedPhrases.map((phrase) => (
                      <li key={phrase} className="rounded-card-sm bg-surface-muted px-3 py-2">
                        {phrase}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {repair.insight.microAction ? (
                <p className="rounded-card-sm border border-border px-4 py-3 font-medium">
                  今日できる小さなこと: {repair.insight.microAction}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">二人が合意したことだけを記録します</CardTitle>
              <CardDescription>
                話し合って決めたことがあれば、ここに残せます。合意していないことは保存されません。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {repair.agreements.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {repair.agreements.map((a) => (
                    <li key={a.id} className="rounded-card-sm bg-surface-muted px-3 py-2">
                      {a.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <form action={recordRepairAgreementAction} className="space-y-2">
                <input type="hidden" name="sessionId" value={repair.sessionId} />
                <Label htmlFor="agreement-text">合意した内容</Label>
                <Textarea id="agreement-text" name="text" className="min-h-20" maxLength={1000} />
                <Button type="submit" variant="outline" size="sm">
                  記録する
                </Button>
              </form>
              <form action={resolveRepairAction}>
                <input type="hidden" name="sessionId" value={repair.sessionId} />
                <Button type="submit" variant="soft" className="w-full">
                  整いました
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : repair.insightStatus === 'generating' || repair.status === 'analyzing' ? (
        <div className="space-y-3 rounded-card border border-border bg-surface p-5" role="status">
          <p className="text-sm text-text-muted">AIが二人の気持ちを整理しています…</p>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : repair.insightStatus === 'failed' ? (
        <Card>
          <CardHeader>
            <CardTitle>メッセージを作成できませんでした</CardTitle>
            <CardDescription>下のガイドを使って、二人のペースで話してみてください。</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="mb-2 text-sm font-semibold">{repairFallbackGuide.title}</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
              {repairFallbackGuide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-card bg-surface-muted px-5 py-4 text-sm">
          <p className="font-medium">あなたの整理は届きました。</p>
          <p className="mt-0.5 text-text-muted">
            パートナーの整理を待っています。そろったら、AIが中立的にまとめます。
          </p>
        </div>
      )}
    </div>
  )
}

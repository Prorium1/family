import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireCoupleSession } from '@/lib/auth/session'
import { getTodayView } from '@/server/services/daily-service'
import { listWeEntries } from '@/server/services/we-service'
import { track } from '@/lib/analytics/track'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnswerForm } from '@/features/daily-questions/components/answer-form'
import { RevealPanel } from '@/features/daily-questions/components/reveal-panel'
import { InsightCard } from '@/features/daily-questions/components/insight-card'
import { InsightSkeleton } from '@/features/daily-questions/components/insight-skeleton'
import { InsightFallback } from '@/features/daily-questions/components/insight-fallback'
import { markTalkedAction } from '@/server/actions/daily-actions'
import { AutoRefresh } from '@/components/shared/auto-refresh'

export const metadata = { title: '今日の質問' }

/**
 * The answer flow (spec §10): draft → submit → wait → simultaneous reveal →
 * AI insight (skeleton / card / fallback) → completed. Whatever state the
 * assignment is in, this page renders it; the partner's answer physically
 * isn't in the payload until reveal.
 */
export default async function TodayPage({ params }: PageProps<'/today/[assignmentId]'>) {
  const session = await requireCoupleSession()
  const { assignmentId } = await params
  const view = await getTodayView(assignmentId, session.userId)
  if (!view) notFound()

  const revealed = view.partnerAnswer !== null
  if (view.insightStatus === 'ready') {
    await track('ai_insight_viewed', { assignmentId })
  }

  // What this conversation has already contributed to NEW WE, so a saved
  // draft reads as "ours" instead of offering to save it twice.
  const savedSourceIds = revealed
    ? (await listWeEntries(session.coupleId, session.userId))
        .filter((entry) => entry.sourceType === 'daily' && entry.sourceId?.startsWith(assignmentId))
        .map((entry) => entry.sourceId as string)
    : []

  return (
    <div className="space-y-6">
      {/* while waiting for the partner, the reveal arrives on its own */}
      <AutoRefresh enabled={view.myAnswer.submitted && !revealed} />
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">今日の質問</Badge>
          <Badge variant="outline">
            目安 {view.question.estimatedMinutes}分
          </Badge>
        </div>
        <h1 className="text-xl leading-relaxed font-bold">「{view.question.text}」</h1>
        {view.question.helper ? (
          <p className="mt-1.5 text-sm text-text-muted">{view.question.helper}</p>
        ) : null}
      </div>

      {!revealed ? (
        <>
          <AnswerForm
            assignmentId={view.assignmentId}
            format={view.question.format}
            options={view.question.options}
            initialValue={view.myAnswer.value}
            initialVisibility={view.myAnswer.visibility}
            submitted={view.myAnswer.submitted}
          />
          {view.myAnswer.submitted ? (
            <div className="rounded-card bg-surface-muted px-5 py-4 text-sm">
              <p className="font-medium">あなたの回答は届きました。</p>
              <p className="mt-0.5 text-text-muted">
                {view.partnerSubmitted
                  ? 'まもなく二人の答えが同時に公開されます…'
                  : 'パートナーの回答を待っています。そろった瞬間に、この画面に同時公開されます。'}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <RevealPanel mine={view.myRevealedAnswer} partner={view.partnerAnswer!} />

          {view.insightStatus === 'ready' && view.insight ? (
            <InsightCard
              insight={view.insight}
              assignmentId={view.assignmentId}
              questionText={view.question.text}
              savedSourceIds={savedSourceIds}
            />
          ) : view.insightStatus === 'generating' ? (
            <InsightSkeleton />
          ) : view.insightStatus === 'failed' ? (
            <InsightFallback assignmentId={view.assignmentId} />
          ) : null}

          {view.status !== 'completed' ? (
            <form action={markTalkedAction} className="flex justify-center">
              <input type="hidden" name="assignmentId" value={view.assignmentId} />
              <Button type="submit" variant="soft">
                二人で話しました
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-text-muted">
              今日の会話が、二人の記録に加わりました。
            </p>
          )}
        </>
      )}

      <div className="flex justify-center">
        <Button asChild variant="link">
          <Link href="/home">ホームへ戻る</Link>
        </Button>
      </div>
    </div>
  )
}

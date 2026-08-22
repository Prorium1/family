import { requireCoupleSession } from '@/lib/auth/session'
import { getWeeklyCheckin } from '@/server/services/checkin-service'
import { PageTitle } from '@/components/shared/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckinForm } from '@/features/weekly-checkin/components/checkin-form'

export const metadata = { title: '今週のチェックイン' }

/** Weekly check-in (spec §24): both answer, then reveal together. */
export default async function WeeklyCheckinPage() {
  const session = await requireCoupleSession()
  const checkin = await getWeeklyCheckin(session.coupleId, session.userId)
  const revealed = checkin.partnerAnswers !== null

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="今週のチェックイン" subtitle={`${checkin.weekKey} ・ 5つの質問で今週をふりかえる`} />

      {!checkin.mySubmitted ? (
        <CheckinForm
          checkinId={checkin.checkinId}
          questions={checkin.questions}
          initialAnswers={checkin.myAnswers}
        />
      ) : !revealed ? (
        <div className="rounded-card bg-surface-muted px-5 py-4 text-sm">
          <p className="font-medium">今週の回答を送信しました。</p>
          <p className="mt-0.5 text-text-muted">
            パートナーの回答を待っています。そろったら同時に公開されます。
          </p>
        </div>
      ) : (
        <div className="animate-gentle-rise space-y-4">
          <p className="rounded-card bg-accent-soft px-4 py-3 text-center text-sm font-semibold text-accent-foreground">
            今週のふたりの答えがそろいました
          </p>
          {checkin.questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-sm">{question.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-text-muted">
                    {checkin.partnerName ?? 'パートナー'}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">
                    {checkin.partnerAnswers?.find((a) => a.questionId === question.id)?.text ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted">あなた</p>
                  <p className="mt-0.5 whitespace-pre-wrap">
                    {checkin.myAnswers?.find((a) => a.questionId === question.id)?.text ?? '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { getMessages, fill } from '@/lib/i18n'
import { ensureTodayAssignment, getTodayView } from '@/server/services/daily-service'
import { getPairStatus } from '@/server/services/pairing-service'
import { listJourneys } from '@/server/services/journey-service'
import { listAgreements } from '@/server/services/agreement-service'
import { getWeeklyCheckin } from '@/server/services/checkin-service'
import { getNextDate } from '@/server/services/dates-service'
import { getSignalBoard } from '@/server/services/signals-service'
import { NextDateCard } from '@/features/life/components/next-date-card'
import { SignalCard } from '@/features/life/components/signal-card'
import { track } from '@/lib/analytics/track'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeartHandshake, Sparkles } from 'lucide-react'
import { AutoRefresh } from '@/components/shared/auto-refresh'

export const metadata = { title: '今日のふたり' }

/** Home — "今日のふたり" (spec §8): one glance, one next step. */
export default async function HomePage({ searchParams }: PageProps<'/home'>) {
  const session = await requireCoupleSession()
  const t = getMessages()
  const params = await searchParams
  const justPaired = params.paired === '1'

  const [pairStatus, weekly, journeys, agreements, nextDate, signals] = await Promise.all([
    getPairStatus(session.userId),
    getWeeklyCheckin(session.coupleId, session.userId),
    listJourneys(session.coupleId, session.userId),
    listAgreements(session.coupleId, session.userId),
    getNextDate(session.coupleId, session.userId),
    getSignalBoard(session.coupleId, session.userId),
  ])
  const assignment = await ensureTodayAssignment(session.coupleId, session.userId)
  const today = await getTodayView(assignment.id, session.userId)
  await track('daily_question_viewed', { assignmentId: assignment.id })

  const stage = pairStatus.couple?.relationshipStage
  const stageLabel = stage ? t.stages[stage] : ''
  const dateLabel = new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

  const mySubmitted = today?.myAnswer.submitted ?? false
  const revealed = today?.partnerAnswer !== null && today !== null
  const recommendedJourney = journeys.find((j) => j.status !== 'completed')
  const latestAgreement = agreements.at(-1)

  return (
    <div className="space-y-5">
      <AutoRefresh enabled={mySubmitted && !revealed} />
      {justPaired ? (
        <div className="animate-gentle-rise bg-wash rounded-card text-primary px-5 py-4 text-sm">
          <p className="font-semibold">{t.pairing.pairedTitle}</p>
          <p className="mt-0.5">{t.pairing.pairedBody}</p>
        </div>
      ) : null}

      <div>
        <p className="text-text-muted text-sm">
          {dateLabel}
          {stageLabel ? ` ・ ${stageLabel}` : ''}
        </p>
        <h1 className="mt-1 text-xl font-bold">
          {fill(t.home.greeting, { name: session.displayName })}
        </h1>
      </div>

      {nextDate && nextDate.daysUntil !== null && nextDate.daysUntil <= 30 ? (
        <NextDateCard next={nextDate} />
      ) : null}

      <Card className="animate-gentle-rise">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-primary">{t.home.title}</CardTitle>
            <Badge variant="outline">
              {t.home.estimated} {today?.question.estimatedMinutes ?? 3}
              {t.common.minutes}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed font-medium">「{today?.question.text}」</p>

          <dl className="flex gap-5 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="text-text-muted">{t.home.myStatus}:</dt>
              <dd>
                {mySubmitted ? (
                  <Badge variant="personA">{t.home.statusAnswered}</Badge>
                ) : (
                  <Badge>{t.home.statusNotAnswered}</Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-text-muted">{t.home.partnerStatus}:</dt>
              <dd>
                {today?.partnerSubmitted ? (
                  <Badge variant="personB">{t.home.statusAnswered}</Badge>
                ) : (
                  <Badge>{t.home.statusNotAnswered}</Badge>
                )}
              </dd>
            </div>
          </dl>

          {mySubmitted && !revealed ? (
            <p className="rounded-card-sm bg-surface-muted text-text-muted px-4 py-3 text-sm">
              {t.home.waitingBody}
            </p>
          ) : null}
          {revealed ? (
            <p className="bg-wash text-blend rounded-card-sm px-4 py-3 text-sm font-semibold">
              {t.home.revealedTitle}
            </p>
          ) : null}

          <Button asChild className="w-full">
            <Link href={`/today/${today?.assignmentId}`}>
              {revealed ? t.home.viewCta : mySubmitted ? t.home.viewCta : t.home.answerCta}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <SignalCard
        board={signals}
        partnerName={pairStatus.couple?.partner?.displayName ?? 'パートナー'}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.home.weeklyCard}</CardTitle>
            <CardDescription>
              {weekly.mySubmitted ? t.weekly.waiting : t.weekly.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="soft" size="sm">
              <Link href="/weekly-checkin">
                {weekly.mySubmitted ? t.home.viewCta : t.home.answerCta}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {recommendedJourney ? (
          <Card>
            <CardHeader>
              <CardTitle>{t.home.journeyCard}</CardTitle>
              <CardDescription>{recommendedJourney.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="soft" size="sm">
                <Link href={`/journeys/${recommendedJourney.slug}`}>
                  {recommendedJourney.status === 'in_progress'
                    ? t.journeys.continue
                    : t.journeys.start}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {latestAgreement ? (
          <Card>
            <CardHeader>
              <CardTitle>{t.home.agreementCard}</CardTitle>
              <CardDescription>{latestAgreement.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="soft" size="sm">
                <Link href="/agreements">{t.home.viewCta}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="text-primary size-4" aria-hidden="true" />
              {t.home.repairCard}
            </CardTitle>
            <CardDescription>{t.repair.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="soft" size="sm">
              <Link href="/repair/new">{t.home.repairCardCta}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {today?.insight ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Sparkles className="size-4" aria-hidden="true" />
              {t.home.aiLead}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{today.insight.reflection}</p>
            <Button asChild variant="link" className="mt-2">
              <Link href={`/today/${today.assignmentId}`}>{t.home.viewCta}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

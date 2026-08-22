import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireCoupleSession } from '@/lib/auth/session'
import { getJourneyDetail } from '@/server/services/journey-service'
import { startStepAction } from '@/server/actions/journey-actions'
import { PageTitle } from '@/components/shared/page-title'
import { Button } from '@/components/ui/button'
import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export async function generateMetadata({ params }: PageProps<'/journeys/[slug]'>) {
  const { slug } = await params
  return { title: `Journey: ${slug}` }
}

export default async function JourneyDetailPage({ params }: PageProps<'/journeys/[slug]'>) {
  const session = await requireCoupleSession()
  const { slug } = await params
  const journey = await getJourneyDetail(slug, session.coupleId, session.userId)
  if (!journey) notFound()

  return (
    <div>
      <PageTitle title={journey.title} subtitle={journey.description} />
      {journey.status === 'completed' ? (
        <p className="animate-gentle-rise mb-5 rounded-card bg-together-soft px-5 py-4 text-sm font-medium text-primary">
          Journeyを完了しました。二人で積み重ねた対話は、ふたりページに記録されています。
        </p>
      ) : null}
      <ol className="space-y-2.5">
        {journey.steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              'flex items-center gap-3 rounded-card border bg-surface px-4 py-3',
              step.current ? 'border-primary' : 'border-border',
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                step.completed
                  ? 'bg-success-soft text-success'
                  : step.current
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-muted text-text-muted',
              )}
              aria-hidden="true"
            >
              {step.completed ? <Check className="size-4" /> : step.order}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="truncate text-xs text-text-muted">{step.questionText}</p>
            </div>
            {step.completed && step.assignmentId ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/today/${step.assignmentId}`}>見る</Link>
              </Button>
            ) : step.assignmentId ? (
              <Button asChild variant="soft" size="sm">
                <Link href={`/today/${step.assignmentId}`}>続き</Link>
              </Button>
            ) : step.current ? (
              <form action={startStepAction}>
                <input type="hidden" name="slug" value={journey.slug} />
                <input type="hidden" name="stepId" value={step.id} />
                <Button type="submit" size="sm">
                  話す
                </Button>
              </form>
            ) : (
              <Circle className="size-4 text-border" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

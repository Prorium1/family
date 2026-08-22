import 'server-only'
import { getRepositories } from '@/server/repositories'
import type { JourneyDetailDTO, JourneyListItemDTO } from '@/types/dto'
import type { QuestionAssignment } from '@/types/entities'
import { track } from '@/lib/analytics/track'
import { localDateKey } from '@/lib/dates'
import { isRevealed } from '@/server/policies/assignment-policy'

export async function listJourneys(coupleId: string, userId: string): Promise<JourneyListItemDTO[]> {
  const repos = getRepositories()
  const [journeys, progressList] = await Promise.all([
    repos.journeys.listActive(),
    repos.journeys.listProgress(coupleId, userId),
  ])
  return Promise.all(
    journeys.map(async (journey) => {
      const steps = await repos.journeys.stepsFor(journey.id)
      const progress = progressList.find((p) => p.journeyId === journey.id)
      return {
        id: journey.id,
        slug: journey.slug,
        title: journey.title,
        description: journey.description,
        premium: journey.premium,
        totalSteps: steps.length,
        completedSteps: progress?.completedStepIds.length ?? 0,
        status: progress?.status ?? 'not_started',
      }
    }),
  )
}

export async function getJourneyDetail(
  slug: string,
  coupleId: string,
  userId: string,
): Promise<JourneyDetailDTO | null> {
  const repos = getRepositories()
  const journey = await repos.journeys.getBySlug(slug)
  if (!journey) return null
  const steps = await repos.journeys.stepsFor(journey.id)
  const progress = await repos.journeys.getProgress(coupleId, journey.id, userId)
  const completed = new Set(progress?.completedStepIds ?? [])
  const firstIncomplete = steps.find((s) => !completed.has(s.id))

  const stepDtos = await Promise.all(
    steps.map(async (step) => {
      const question = await repos.questions.getById(step.questionId)
      const assignment = await repos.assignments.findByStep(coupleId, step.id, userId)
      return {
        id: step.id,
        order: step.order,
        title: step.title,
        questionText: question?.text ?? '',
        completed: completed.has(step.id),
        assignmentId: assignment?.id ?? null,
        current: step.id === firstIncomplete?.id,
      }
    }),
  )

  return {
    id: journey.id,
    slug: journey.slug,
    title: journey.title,
    description: journey.description,
    premium: journey.premium,
    totalSteps: steps.length,
    completedSteps: completed.size,
    status: progress?.status ?? 'not_started',
    steps: stepDtos,
  }
}

/** Start (or continue) a journey: create the assignment for its next step. */
export async function startJourneyStep(
  slug: string,
  stepId: string,
  coupleId: string,
  userId: string,
): Promise<QuestionAssignment> {
  const repos = getRepositories()
  const journey = await repos.journeys.getBySlug(slug)
  if (!journey) throw new Error('journey not found')
  const steps = await repos.journeys.stepsFor(journey.id)
  const step = steps.find((s) => s.id === stepId)
  if (!step) throw new Error('step not found')

  let progress = await repos.journeys.getProgress(coupleId, journey.id, userId)
  if (!progress) {
    progress = await repos.journeys.saveProgress(
      {
        id: `jp_${crypto.randomUUID()}`,
        coupleId,
        journeyId: journey.id,
        status: 'in_progress',
        completedStepIds: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
      userId,
    )
    await track('journey_started', { journeyId: journey.id })
  }

  const existing = await repos.assignments.findByStep(coupleId, step.id, userId)
  if (existing) return existing
  const profile = await repos.profiles.getById(userId)
  const now = new Date().toISOString()
  return repos.assignments.create({
    id: `as_${crypto.randomUUID()}`,
    coupleId,
    questionId: step.questionId,
    source: 'journey',
    journeyStepId: step.id,
    assignedDate: localDateKey(profile?.timezone ?? 'Asia/Tokyo'),
    status: 'assigned',
    statusHistory: [{ status: 'assigned', at: now }],
    revealedAt: null,
    insightError: null,
    createdAt: now,
  })
}

/** Called after a journey assignment reveals: mark the step complete. */
export async function syncJourneyProgress(coupleId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  const assignments = await repos.assignments.listForCouple(coupleId, userId)
  const journeyAssignments = assignments.filter(
    (a) => a.source === 'journey' && a.journeyStepId && isRevealed(a.status),
  )
  if (journeyAssignments.length === 0) return

  for (const journey of await repos.journeys.listActive()) {
    const steps = await repos.journeys.stepsFor(journey.id)
    const stepIds = new Set(steps.map((s) => s.id))
    const completedSteps = journeyAssignments
      .filter((a) => a.journeyStepId && stepIds.has(a.journeyStepId))
      .map((a) => a.journeyStepId as string)
    if (completedSteps.length === 0) continue

    const progress = await repos.journeys.getProgress(coupleId, journey.id, userId)
    if (!progress) continue
    const merged = [...new Set([...progress.completedStepIds, ...completedSteps])]
    const nowCompleted = merged.length === steps.length
    if (
      merged.length !== progress.completedStepIds.length ||
      (nowCompleted && progress.status !== 'completed')
    ) {
      await repos.journeys.saveProgress(
        {
          ...progress,
          completedStepIds: merged,
          status: nowCompleted ? 'completed' : 'in_progress',
          completedAt: nowCompleted ? new Date().toISOString() : progress.completedAt,
        },
        userId,
      )
      for (const stepId of completedSteps) {
        if (!progress.completedStepIds.includes(stepId)) {
          await track('journey_step_completed', { journeyId: journey.id, stepId })
        }
      }
      if (nowCompleted && progress.status !== 'completed') {
        await repos.timeline.add({
          id: `tl_${crypto.randomUUID()}`,
          coupleId,
          kind: 'journey_completed',
          title: `「${journey.title}」を完了`,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        })
      }
    }
  }
}

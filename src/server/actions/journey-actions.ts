'use server'

import { redirect } from 'next/navigation'
import { requireCoupleSession } from '@/lib/auth/session'
import { startJourneyStep } from '@/server/services/journey-service'

export async function startStepAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const slug = String(formData.get('slug') ?? '')
  const stepId = String(formData.get('stepId') ?? '')
  const assignment = await startJourneyStep(slug, stepId, session.coupleId, session.userId)
  redirect(`/today/${assignment.id}?from=journey`)
}

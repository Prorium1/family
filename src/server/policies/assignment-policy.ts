import type { AssignmentStatus } from '@/types/domain'
import type { Answer, QuestionAssignment } from '@/types/entities'

/**
 * The §10 state machine as pure functions. Both drivers (demo & Supabase)
 * route every status change through here, so an illegal transition is a
 * thrown error rather than silent corruption — and the reveal rule lives in
 * exactly one place.
 */

const TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  assigned: ['draft', 'submitted'],
  draft: ['draft', 'submitted'],
  submitted: ['waiting_partner', 'ready_to_reveal'],
  waiting_partner: ['ready_to_reveal'],
  ready_to_reveal: ['revealed'],
  revealed: ['insight_generating', 'completed'],
  insight_generating: ['insight_ready', 'revealed'], // failure returns to revealed
  insight_ready: ['completed', 'insight_generating'], // regeneration allowed
  completed: ['insight_generating'], // regeneration allowed after completion too
}

export class IllegalTransitionError extends Error {
  constructor(from: AssignmentStatus, to: AssignmentStatus) {
    super(`Illegal assignment transition: ${from} → ${to}`)
    this.name = 'IllegalTransitionError'
  }
}

export function canTransition(from: AssignmentStatus, to: AssignmentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function assertTransition(from: AssignmentStatus, to: AssignmentStatus): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to)
}

export function transition(
  assignment: QuestionAssignment,
  to: AssignmentStatus,
  at: string,
): QuestionAssignment {
  assertTransition(assignment.status, to)
  return {
    ...assignment,
    status: to,
    statusHistory: [...assignment.statusHistory, { status: to, at }],
    revealedAt: to === 'revealed' ? at : assignment.revealedAt,
  }
}

/** Statuses at (or after) which partner answers become mutually visible. */
const REVEALED_STATUSES: AssignmentStatus[] = [
  'revealed',
  'insight_generating',
  'insight_ready',
  'completed',
]

export function isRevealed(status: AssignmentStatus): boolean {
  return REVEALED_STATUSES.includes(status)
}

/**
 * The reveal rule (spec §4-3, §10): a viewer sees their own answer always,
 * and the partner's answer only once the assignment is revealed.
 */
export function canViewAnswer(
  assignment: QuestionAssignment,
  answer: Answer,
  viewerUserId: string,
): boolean {
  if (answer.userId === viewerUserId) return true
  return isRevealed(assignment.status)
}

/** Answers may be edited only before the simultaneous reveal (spec §4-3). */
export function canEditAnswer(assignment: QuestionAssignment): boolean {
  return !isRevealed(assignment.status)
}

/**
 * Status to apply after a submission: first submitter waits, second submitter
 * flips the assignment to ready_to_reveal (the service then reveals both in
 * the same operation).
 */
export function statusAfterSubmit(bothSubmitted: boolean): AssignmentStatus {
  return bothSubmitted ? 'ready_to_reveal' : 'waiting_partner'
}

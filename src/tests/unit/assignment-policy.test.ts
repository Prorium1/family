import { describe, expect, it } from 'vitest'
import {
  ASSIGNMENT_STATUSES,
  type AssignmentStatus,
} from '@/types/domain'
import {
  canEditAnswer,
  canTransition,
  canViewAnswer,
  isRevealed,
  statusAfterSubmit,
  transition,
} from '@/server/policies/assignment-policy'
import type { Answer, QuestionAssignment } from '@/types/entities'

function makeAssignment(status: AssignmentStatus): QuestionAssignment {
  return {
    id: 'as-1',
    coupleId: 'couple-1',
    questionId: 'daily-01',
    source: 'daily',
    journeyStepId: null,
    assignedDate: '2026-08-22',
    status,
    statusHistory: [],
    revealedAt: null,
    insightError: null,
    createdAt: '2026-08-22T00:00:00Z',
  }
}

function makeAnswer(userId: string): Answer {
  return {
    id: `ans-${userId}`,
    assignmentId: 'as-1',
    coupleId: 'couple-1',
    userId,
    value: { kind: 'text', text: '秘密の回答' },
    visibility: 'shared',
    submitted: true,
    submittedAt: '2026-08-22T01:00:00Z',
    createdAt: '2026-08-22T00:30:00Z',
    updatedAt: '2026-08-22T01:00:00Z',
  }
}

describe('assignment state machine (spec §10)', () => {
  it('allows the canonical happy path in order', () => {
    const path: AssignmentStatus[] = [
      'draft',
      'submitted',
      'waiting_partner',
      'ready_to_reveal',
      'revealed',
      'insight_generating',
      'insight_ready',
      'completed',
    ]
    let assignment = makeAssignment('assigned')
    for (const next of path) {
      assignment = transition(assignment, next, '2026-08-22T02:00:00Z')
      expect(assignment.status).toBe(next)
    }
    expect(assignment.statusHistory.map((h) => h.status)).toEqual(path)
  })

  it('rejects every skip straight to revealed', () => {
    for (const from of ['assigned', 'draft', 'submitted', 'waiting_partner'] as const) {
      expect(canTransition(from, 'revealed'), `${from} → revealed`).toBe(false)
    }
  })

  it('rejects moving backwards from revealed', () => {
    for (const to of ['assigned', 'draft', 'submitted', 'waiting_partner'] as const) {
      expect(canTransition('revealed', to)).toBe(false)
    }
  })

  it('throws on an illegal transition', () => {
    expect(() => transition(makeAssignment('assigned'), 'insight_ready', 'now')).toThrow(
      /Illegal assignment transition/,
    )
  })

  it('allows insight failure to fall back to revealed and be retried', () => {
    expect(canTransition('insight_generating', 'revealed')).toBe(true)
    expect(canTransition('revealed', 'insight_generating')).toBe(true)
    expect(canTransition('insight_ready', 'insight_generating')).toBe(true)
  })

  it('stamps revealedAt exactly when reaching revealed', () => {
    let a = makeAssignment('ready_to_reveal')
    a = transition(a, 'revealed', '2026-08-22T09:00:00Z')
    expect(a.revealedAt).toBe('2026-08-22T09:00:00Z')
  })

  it('covers every status in the transition table', () => {
    for (const status of ASSIGNMENT_STATUSES) {
      // canTransition must be defined (true or false) for all statuses
      expect(typeof canTransition(status, 'completed')).toBe('boolean')
    }
  })
})

describe('reveal rule (spec §4-3)', () => {
  const me = 'user-a'
  const partner = 'user-b'

  it('always lets me see my own answer', () => {
    for (const status of ASSIGNMENT_STATUSES) {
      expect(canViewAnswer(makeAssignment(status), makeAnswer(me), me)).toBe(true)
    }
  })

  it("hides the partner's answer until revealed — in every pre-reveal state", () => {
    for (const status of [
      'assigned',
      'draft',
      'submitted',
      'waiting_partner',
      'ready_to_reveal',
    ] as const) {
      expect(canViewAnswer(makeAssignment(status), makeAnswer(partner), me), status).toBe(false)
    }
  })

  it("shows the partner's answer from revealed onwards", () => {
    for (const status of ['revealed', 'insight_generating', 'insight_ready', 'completed'] as const) {
      expect(canViewAnswer(makeAssignment(status), makeAnswer(partner), me), status).toBe(true)
      expect(isRevealed(status)).toBe(true)
    }
  })

  it('locks edits after reveal, allows them before', () => {
    expect(canEditAnswer(makeAssignment('waiting_partner'))).toBe(true)
    expect(canEditAnswer(makeAssignment('revealed'))).toBe(false)
  })

  it('second submitter triggers ready_to_reveal', () => {
    expect(statusAfterSubmit(false)).toBe('waiting_partner')
    expect(statusAfterSubmit(true)).toBe('ready_to_reveal')
  })
})

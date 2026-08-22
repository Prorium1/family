import 'server-only'
import type { Repositories } from '../repository-types'
import { canViewAnswer, isRevealed } from '@/server/policies/assignment-policy'
import { isActiveMember } from '@/server/policies/couple-policy'
import { getDemoStore, mutateDemoStore } from './store'

/**
 * Daily-question aggregates. The reveal rule is applied INSIDE this driver:
 * a partner's unrevealed answer never leaves this module, so no service or
 * page can leak it even by mistake.
 */

export const demoAssignments: Repositories['assignments'] = {
  async getById(assignmentId, viewerUserId) {
    const store = getDemoStore()
    const assignment = store.assignments.find((a) => a.id === assignmentId)
    if (!assignment) return null
    if (!isActiveMember(store.coupleMembers, assignment.coupleId, viewerUserId)) return null
    return { ...assignment, statusHistory: [...assignment.statusHistory] }
  },
  async getTodayForCouple(coupleId, viewerUserId, date) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return null
    const assignment = store.assignments.find(
      (a) => a.coupleId === coupleId && a.source === 'daily' && a.assignedDate === date,
    )
    return assignment ? { ...assignment, statusHistory: [...assignment.statusHistory] } : null
  },
  async findByStep(coupleId, journeyStepId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return null
    const assignment = store.assignments.find(
      (a) => a.coupleId === coupleId && a.journeyStepId === journeyStepId,
    )
    return assignment ? { ...assignment, statusHistory: [...assignment.statusHistory] } : null
  },
  async listForCouple(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.assignments
      .filter((a) => a.coupleId === coupleId)
      .map((a) => ({ ...a, statusHistory: [...a.statusHistory] }))
  },
  async create(assignment) {
    return mutateDemoStore((store) => {
      store.assignments.push({ ...assignment })
      return { ...assignment }
    })
  },
  async save(assignment) {
    return mutateDemoStore((store) => {
      const index = store.assignments.findIndex((a) => a.id === assignment.id)
      if (index === -1) throw new Error('assignment not found')
      store.assignments[index] = { ...assignment }
      return { ...assignment }
    })
  },
}

export const demoAnswers: Repositories['answers'] = {
  async getForAssignment(assignmentId, viewerUserId) {
    const store = getDemoStore()
    const assignment = store.assignments.find((a) => a.id === assignmentId)
    if (!assignment || !isActiveMember(store.coupleMembers, assignment.coupleId, viewerUserId)) {
      return { mine: null, partner: null, partnerSubmitted: false }
    }
    const answers = store.answers.filter((ans) => ans.assignmentId === assignmentId)
    const mine = answers.find((ans) => ans.userId === viewerUserId) ?? null
    const partnerRaw = answers.find((ans) => ans.userId !== viewerUserId) ?? null
    const partnerVisible =
      partnerRaw && canViewAnswer(assignment, partnerRaw, viewerUserId) ? partnerRaw : null
    return {
      mine: mine ? { ...mine } : null,
      // Pre-reveal the partner's row is dropped entirely — not nulled fields,
      // simply absent from the result (spec §10, §23).
      partner: partnerVisible ? { ...partnerVisible } : null,
      partnerSubmitted: partnerRaw?.submitted ?? false,
    }
  },
  async saveDraft(answer) {
    return mutateDemoStore((store) => {
      const assignment = store.assignments.find((a) => a.id === answer.assignmentId)
      if (!assignment) throw new Error('assignment not found')
      if (!isActiveMember(store.coupleMembers, assignment.coupleId, answer.userId)) {
        throw new Error('not a couple member')
      }
      if (isRevealed(assignment.status)) throw new Error('answers are locked after reveal')
      const index = store.answers.findIndex(
        (a) => a.assignmentId === answer.assignmentId && a.userId === answer.userId,
      )
      if (index === -1) store.answers.push({ ...answer })
      else store.answers[index] = { ...answer }
      return { ...answer }
    })
  },
  async submit(answerId, viewerUserId, at) {
    mutateDemoStore((store) => {
      const answer = store.answers.find((a) => a.id === answerId && a.userId === viewerUserId)
      if (!answer) throw new Error('answer not found')
      answer.submitted = true
      answer.submittedAt = at
      answer.updatedAt = at
    })
  },
  async listRevisions(answerId, viewerUserId) {
    const store = getDemoStore()
    const answer = store.answers.find((a) => a.id === answerId)
    // Revision history is personal — only the author reads it (spec §4-3)
    if (!answer || answer.userId !== viewerUserId) return []
    return store.answerRevisions.filter((r) => r.answerId === answerId).map((r) => ({ ...r }))
  },
  async addRevision(revision) {
    mutateDemoStore((store) => {
      store.answerRevisions.push({ ...revision })
    })
  },
  async listRevealedForCouple(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    const revealedAssignments = new Set(
      store.assignments
        .filter((a) => a.coupleId === coupleId && isRevealed(a.status))
        .map((a) => a.id),
    )
    return store.answers
      .filter(
        (ans) =>
          ans.coupleId === coupleId &&
          (ans.userId === viewerUserId || revealedAssignments.has(ans.assignmentId)),
      )
      .map((a) => ({ ...a }))
  },
  async listOwn(userId) {
    return getDemoStore()
      .answers.filter((a) => a.userId === userId)
      .map((a) => ({ ...a }))
  },
}

export const demoInsights: Repositories['insights'] = {
  async findCurrent(assignmentId) {
    const found = getDemoStore().insights.find((i) => i.assignmentId === assignmentId && i.isCurrent)
    return found ? { ...found } : null
  },
  async findByInputHash(assignmentId, inputHash) {
    const found = getDemoStore().insights.find(
      (i) => i.assignmentId === assignmentId && i.inputHash === inputHash,
    )
    return found ? { ...found } : null
  },
  async create(record) {
    return mutateDemoStore((store) => {
      if (record.isCurrent) {
        for (const other of store.insights) {
          if (other.assignmentId === record.assignmentId) other.isCurrent = false
        }
      }
      store.insights.push({ ...record })
      return { ...record }
    })
  },
  async save(record) {
    return mutateDemoStore((store) => {
      const index = store.insights.findIndex((i) => i.id === record.id)
      if (index === -1) throw new Error('insight not found')
      if (record.isCurrent) {
        for (const other of store.insights) {
          if (other.assignmentId === record.assignmentId && other.id !== record.id) {
            other.isCurrent = false
          }
        }
      }
      store.insights[index] = { ...record }
      return { ...record }
    })
  },
}

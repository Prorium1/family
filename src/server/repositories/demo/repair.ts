import 'server-only'
import type { Repositories } from '../repository-types'
import { isActiveMember } from '@/server/policies/couple-policy'
import { aiReadableText, redactEntryForPartner } from '@/server/policies/visibility-policy'
import { getDemoStore, mutateDemoStore } from './store'

/**
 * Repair Mode aggregates. Partner-facing reads pass through visibility
 * redaction here in the driver — raw text at `private`/`ai_only`/`ai_summary`
 * physically cannot cross this boundary toward the partner (spec §12).
 */
export const demoRepair: Repositories['repair'] = {
  async getSession(sessionId, viewerUserId) {
    const store = getDemoStore()
    const session = store.repairSessions.find((s) => s.id === sessionId)
    if (!session) return null
    if (!isActiveMember(store.coupleMembers, session.coupleId, viewerUserId)) return null
    // Solo sessions stay entirely invisible to the partner; so do sessions
    // paused for safety — the partner receives no signal at all (spec §4-5).
    const hiddenFromPartner = session.mode === 'solo' || session.status === 'paused_for_safety'
    if (hiddenFromPartner && session.initiatorUserId !== viewerUserId) return null
    return { ...session, safetyCategories: [...session.safetyCategories] }
  },
  async listSessions(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.repairSessions
      .filter(
        (s) =>
          s.coupleId === coupleId &&
          (s.initiatorUserId === viewerUserId ||
            (s.mode === 'together' && s.status !== 'paused_for_safety')),
      )
      .map((s) => ({ ...s, safetyCategories: [...s.safetyCategories] }))
  },
  async createSession(session) {
    return mutateDemoStore((store) => {
      store.repairSessions.push({ ...session })
      return { ...session }
    })
  },
  async saveSession(session) {
    return mutateDemoStore((store) => {
      const index = store.repairSessions.findIndex((s) => s.id === session.id)
      if (index === -1) throw new Error('repair session not found')
      store.repairSessions[index] = { ...session }
      return { ...session }
    })
  },
  async listOwnEntries(sessionId, viewerUserId) {
    return getDemoStore()
      .repairEntries.filter((e) => e.sessionId === sessionId && e.userId === viewerUserId)
      .map((e) => ({ ...e, sharedExcerpts: [...e.sharedExcerpts] }))
  },
  async listPartnerEntriesRedacted(sessionId, viewerUserId) {
    const store = getDemoStore()
    const session = store.repairSessions.find((s) => s.id === sessionId)
    if (!session || !isActiveMember(store.coupleMembers, session.coupleId, viewerUserId)) return []
    return store.repairEntries
      .filter((e) => e.sessionId === sessionId && e.userId !== viewerUserId && e.submitted)
      .map(redactEntryForPartner)
      .filter((r): r is NonNullable<typeof r> => r !== null)
  },
  async listAiReadableEntries(sessionId) {
    return getDemoStore()
      .repairEntries.filter((e) => e.sessionId === sessionId && e.submitted)
      .flatMap((e) => {
        const text = aiReadableText(e)
        return text === null ? [] : [{ userId: e.userId, promptId: e.promptId, text }]
      })
  },
  async hasPartnerSubmitted(sessionId, viewerUserId) {
    return getDemoStore().repairEntries.some(
      (e) => e.sessionId === sessionId && e.userId !== viewerUserId && e.submitted,
    )
  },
  async saveEntry(entry) {
    return mutateDemoStore((store) => {
      const session = store.repairSessions.find((s) => s.id === entry.sessionId)
      if (!session) throw new Error('repair session not found')
      if (!isActiveMember(store.coupleMembers, session.coupleId, entry.userId)) {
        throw new Error('not a couple member')
      }
      const index = store.repairEntries.findIndex(
        (e) =>
          e.sessionId === entry.sessionId &&
          e.userId === entry.userId &&
          e.promptId === entry.promptId,
      )
      if (index === -1) store.repairEntries.push({ ...entry })
      else store.repairEntries[index] = { ...entry }
      return { ...entry }
    })
  },
  async findInsight(sessionId, inputHash) {
    const found = getDemoStore().repairInsights.find(
      (i) => i.sessionId === sessionId && i.inputHash === inputHash,
    )
    return found ? { ...found } : null
  },
  async findCurrentInsight(sessionId) {
    const found = getDemoStore().repairInsights.find((i) => i.sessionId === sessionId && i.isCurrent)
    return found ? { ...found } : null
  },
  async saveInsight(record) {
    return mutateDemoStore((store) => {
      const index = store.repairInsights.findIndex((i) => i.id === record.id)
      if (record.isCurrent) {
        for (const other of store.repairInsights) {
          if (other.sessionId === record.sessionId && other.id !== record.id) {
            other.isCurrent = false
          }
        }
      }
      if (index === -1) store.repairInsights.push({ ...record })
      else store.repairInsights[index] = { ...record }
      return { ...record }
    })
  },
  async listAgreements(sessionId, viewerUserId) {
    const store = getDemoStore()
    const session = store.repairSessions.find((s) => s.id === sessionId)
    if (!session || !isActiveMember(store.coupleMembers, session.coupleId, viewerUserId)) return []
    return store.repairAgreements
      .filter((a) => a.sessionId === sessionId)
      .map((a) => ({ ...a, agreedByUserIds: [...a.agreedByUserIds] }))
  },
  async saveAgreement(agreement) {
    return mutateDemoStore((store) => {
      const index = store.repairAgreements.findIndex((a) => a.id === agreement.id)
      if (index === -1) store.repairAgreements.push({ ...agreement })
      else store.repairAgreements[index] = { ...agreement }
      return { ...agreement }
    })
  },
}

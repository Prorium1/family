import 'server-only'
import type { Repositories } from '../repository-types'
import { isActiveMember } from '@/server/policies/couple-policy'
import { getDemoStore, mutateDemoStore } from './store'

/** Agreements, timeline, manual, settings and metadata-only logs. */

export const demoAgreements: Repositories['agreements'] = {
  async list(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.agreements.filter((a) => a.coupleId === coupleId).map((a) => ({ ...a }))
  },
  async getById(agreementId, viewerUserId) {
    const store = getDemoStore()
    const agreement = store.agreements.find((a) => a.id === agreementId)
    if (!agreement || !isActiveMember(store.coupleMembers, agreement.coupleId, viewerUserId)) {
      return null
    }
    return { ...agreement }
  },
  async create(agreement) {
    return mutateDemoStore((store) => {
      if (!isActiveMember(store.coupleMembers, agreement.coupleId, agreement.createdByUserId)) {
        throw new Error('not a couple member')
      }
      store.agreements.push({ ...agreement })
      return { ...agreement }
    })
  },
  async save(agreement, revision) {
    return mutateDemoStore((store) => {
      const index = store.agreements.findIndex((a) => a.id === agreement.id)
      if (index === -1) throw new Error('agreement not found')
      store.agreements[index] = { ...agreement }
      store.agreementRevisions.push({ ...revision })
      return { ...agreement }
    })
  },
  async listRevisions(agreementId, viewerUserId) {
    const store = getDemoStore()
    const agreement = store.agreements.find((a) => a.id === agreementId)
    if (!agreement || !isActiveMember(store.coupleMembers, agreement.coupleId, viewerUserId)) {
      return []
    }
    return store.agreementRevisions.filter((r) => r.agreementId === agreementId).map((r) => ({ ...r }))
  },
}

export const demoTimeline: Repositories['timeline'] = {
  async list(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.timeline
      .filter((e) => e.coupleId === coupleId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ ...e }))
  },
  async add(event) {
    return mutateDemoStore((store) => {
      store.timeline.push({ ...event })
      return { ...event }
    })
  },
}

export const demoManual: Repositories['manual'] = {
  async list(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.manualItems
      .filter((i) => i.coupleId === coupleId)
      .map((i) => ({ ...i, sourceIds: [...i.sourceIds], confirmedByUserIds: [...i.confirmedByUserIds] }))
  },
  async save(item, viewerUserId) {
    return mutateDemoStore((store) => {
      if (!isActiveMember(store.coupleMembers, item.coupleId, viewerUserId)) {
        throw new Error('not a couple member')
      }
      const index = store.manualItems.findIndex((i) => i.id === item.id)
      if (index === -1) store.manualItems.push({ ...item })
      else store.manualItems[index] = { ...item }
      return { ...item }
    })
  },
  async remove(itemId, viewerUserId) {
    mutateDemoStore((store) => {
      const item = store.manualItems.find((i) => i.id === itemId)
      if (!item) return
      // AI memory is user-controllable (spec §15, §18): any member may delete
      if (!isActiveMember(store.coupleMembers, item.coupleId, viewerUserId)) {
        throw new Error('not a couple member')
      }
      store.manualItems = store.manualItems.filter((i) => i.id !== itemId)
    })
  },
}

export const demoNotificationPreferences: Repositories['notificationPreferences'] = {
  async get(userId) {
    const found = getDemoStore().notificationPreferences.find((p) => p.userId === userId)
    return (
      found ?? {
        userId,
        dailyQuestion: true,
        bothRevealed: true,
        weeklyCheckin: true,
        gratitudeReceived: true,
        preferredTime: '20:00',
        coupleTimeStart: null,
        coupleTimeEnd: null,
      }
    )
  },
  async save(pref) {
    return mutateDemoStore((store) => {
      const index = store.notificationPreferences.findIndex((p) => p.userId === pref.userId)
      if (index === -1) store.notificationPreferences.push({ ...pref })
      else store.notificationPreferences[index] = { ...pref }
      return { ...pref }
    })
  },
}

export const demoConsents: Repositories['consents'] = {
  async list(userId) {
    return getDemoStore()
      .consents.filter((c) => c.userId === userId)
      .map((c) => ({ ...c }))
  },
  async record(consent) {
    mutateDemoStore((store) => {
      store.consents.push({ ...consent })
    })
  },
}

export const demoDataRequests: Repositories['dataRequests'] = {
  async create(request) {
    return mutateDemoStore((store) => {
      store.dataRequests.push({ ...request })
      return { ...request }
    })
  },
  async list(userId) {
    return getDemoStore()
      .dataRequests.filter((r) => r.userId === userId)
      .map((r) => ({ ...r }))
  },
}

export const demoSafetyEvents: Repositories['safetyEvents'] = {
  async record(event) {
    mutateDemoStore((store) => {
      store.safetyEvents.push({ ...event })
    })
  },
}

export const demoAiLogs: Repositories['aiLogs'] = {
  async record(log) {
    mutateDemoStore((store) => {
      store.aiLogs.push({ ...log })
    })
  },
}

export const demoAnalytics: Repositories['analytics'] = {
  async record(event) {
    mutateDemoStore((store) => {
      store.analyticsEvents.push({ ...event })
    })
  },
}

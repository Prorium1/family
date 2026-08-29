import 'server-only'
import type { Repositories } from '../repository-types'
import { isActiveMember } from '@/server/policies/couple-policy'
import { getDemoStore, mutateDemoStore } from './store'

/** ふたりの予定・メモ・ひとことサイン・からだの周期 (couple life). */

export const demoCoupleDates: Repositories['coupleDates'] = {
  async list(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.coupleDates
      .filter((d) => d.coupleId === coupleId)
      .map((d) => ({ ...d }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
  async create(date) {
    return mutateDemoStore((store) => {
      if (
        !date.createdByUserId ||
        !isActiveMember(store.coupleMembers, date.coupleId, date.createdByUserId)
      ) {
        throw new Error('not a couple member')
      }
      store.coupleDates.push({ ...date })
      return { ...date }
    })
  },
  async remove(id, viewerUserId) {
    mutateDemoStore((store) => {
      const index = store.coupleDates.findIndex((d) => d.id === id)
      if (index === -1) return
      if (!isActiveMember(store.coupleMembers, store.coupleDates[index].coupleId, viewerUserId)) {
        throw new Error('not a couple member')
      }
      store.coupleDates.splice(index, 1)
    })
  },
}

export const demoCoupleNotes: Repositories['coupleNotes'] = {
  async list(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.coupleNotes
      .filter((n) => n.coupleId === coupleId)
      .map((n) => ({ ...n }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async getById(id, viewerUserId) {
    const store = getDemoStore()
    const note = store.coupleNotes.find((n) => n.id === id)
    if (!note || !isActiveMember(store.coupleMembers, note.coupleId, viewerUserId)) return null
    return { ...note }
  },
  async create(note) {
    return mutateDemoStore((store) => {
      if (
        !note.createdByUserId ||
        !isActiveMember(store.coupleMembers, note.coupleId, note.createdByUserId)
      ) {
        throw new Error('not a couple member')
      }
      store.coupleNotes.push({ ...note })
      return { ...note }
    })
  },
  async save(note, viewerUserId) {
    return mutateDemoStore((store) => {
      const index = store.coupleNotes.findIndex((n) => n.id === note.id)
      if (index === -1) throw new Error('note not found')
      if (!isActiveMember(store.coupleMembers, store.coupleNotes[index].coupleId, viewerUserId)) {
        throw new Error('not a couple member')
      }
      store.coupleNotes[index] = { ...note }
      return { ...note }
    })
  },
  async remove(id, viewerUserId) {
    mutateDemoStore((store) => {
      const index = store.coupleNotes.findIndex((n) => n.id === id)
      if (index === -1) return
      if (!isActiveMember(store.coupleMembers, store.coupleNotes[index].coupleId, viewerUserId)) {
        throw new Error('not a couple member')
      }
      store.coupleNotes.splice(index, 1)
    })
  },
}

export const demoSignals: Repositories['signals'] = {
  async listRecent(coupleId, viewerUserId, sinceIso) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    // reverse first: two taps can land in the same millisecond, and the
    // stable sort must then prefer the later insertion, not the earlier one
    return store.coupleSignals
      .filter((s) => s.coupleId === coupleId && s.createdAt >= sinceIso)
      .map((s) => ({ ...s }))
      .reverse()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async add(signal) {
    return mutateDemoStore((store) => {
      if (!isActiveMember(store.coupleMembers, signal.coupleId, signal.userId)) {
        throw new Error('not a couple member')
      }
      store.coupleSignals.push({ ...signal })
      return { ...signal }
    })
  },
}

export const demoCycles: Repositories['cycles'] = {
  async getOwn(userId) {
    const found = getDemoStore().cycleRecords.find((r) => r.userId === userId)
    return found ? { ...found, payload: { starts: [...found.payload.starts] } } : null
  },
  async getSharedByPartner(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return null
    const partner = store.coupleMembers.find(
      (m) => m.coupleId === coupleId && m.active && m.userId !== viewerUserId,
    )
    if (!partner) return null
    const record = store.cycleRecords.find((r) => r.userId === partner.userId)
    // The sharing gate lives HERE: an unshared record never leaves the driver.
    if (!record || !record.sharedWithPartner) return null
    return { ...record, payload: { starts: [...record.payload.starts] } }
  },
  async save(record) {
    return mutateDemoStore((store) => {
      if (!isActiveMember(store.coupleMembers, record.coupleId, record.userId)) {
        throw new Error('not a couple member')
      }
      const index = store.cycleRecords.findIndex((r) => r.userId === record.userId)
      const copy = { ...record, payload: { starts: [...record.payload.starts] } }
      if (index === -1) store.cycleRecords.push(copy)
      else store.cycleRecords[index] = copy
      return { ...copy, payload: { starts: [...copy.payload.starts] } }
    })
  },
}

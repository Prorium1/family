import 'server-only'
import type { Repositories } from '../repository-types'
import { isActiveMember } from '@/server/policies/couple-policy'
import { journeys as journeyContent, journeySteps } from '@/content/journeys'
import { getDemoStore, mutateDemoStore } from './store'

/** Journey + weekly check-in aggregates. */

export const demoJourneys: Repositories['journeys'] = {
  async listActive() {
    return journeyContent.filter((j) => j.active).sort((a, b) => a.order - b.order)
  },
  async getBySlug(slug) {
    return journeyContent.find((j) => j.slug === slug && j.active) ?? null
  },
  async stepsFor(journeyId) {
    return journeySteps.filter((s) => s.journeyId === journeyId).sort((a, b) => a.order - b.order)
  },
  async getProgress(coupleId, journeyId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return null
    const progress = store.journeyProgress.find(
      (p) => p.coupleId === coupleId && p.journeyId === journeyId,
    )
    return progress ? { ...progress, completedStepIds: [...progress.completedStepIds] } : null
  },
  async listProgress(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return []
    return store.journeyProgress
      .filter((p) => p.coupleId === coupleId)
      .map((p) => ({ ...p, completedStepIds: [...p.completedStepIds] }))
  },
  async saveProgress(progress, viewerUserId) {
    return mutateDemoStore((store) => {
      if (!isActiveMember(store.coupleMembers, progress.coupleId, viewerUserId)) {
        throw new Error('not a couple member')
      }
      const index = store.journeyProgress.findIndex((p) => p.id === progress.id)
      if (index === -1) store.journeyProgress.push({ ...progress })
      else store.journeyProgress[index] = { ...progress }
      return { ...progress }
    })
  },
}

export const demoCheckins: Repositories['checkins'] = {
  async getForWeek(coupleId, weekKey, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return null
    const checkin = store.checkins.find((c) => c.coupleId === coupleId && c.weekKey === weekKey)
    return checkin ? { ...checkin } : null
  },
  async create(checkin) {
    return mutateDemoStore((store) => {
      store.checkins.push({ ...checkin })
      return { ...checkin }
    })
  },
  async save(checkin) {
    return mutateDemoStore((store) => {
      const index = store.checkins.findIndex((c) => c.id === checkin.id)
      if (index === -1) throw new Error('checkin not found')
      store.checkins[index] = { ...checkin }
      return { ...checkin }
    })
  },
  async getAnswers(checkinId, viewerUserId) {
    const store = getDemoStore()
    const checkin = store.checkins.find((c) => c.id === checkinId)
    if (!checkin || !isActiveMember(store.coupleMembers, checkin.coupleId, viewerUserId)) {
      return { mine: null, partner: null, partnerSubmitted: false }
    }
    const answers = store.checkinAnswers.filter((a) => a.checkinId === checkinId)
    const mine = answers.find((a) => a.userId === viewerUserId) ?? null
    const partnerRaw = answers.find((a) => a.userId !== viewerUserId) ?? null
    const revealed = checkin.status === 'revealed' || checkin.status === 'completed'
    return {
      mine: mine ? { ...mine, answers: [...mine.answers] } : null,
      partner:
        partnerRaw && revealed ? { ...partnerRaw, answers: [...partnerRaw.answers] } : null,
      partnerSubmitted: partnerRaw?.submitted ?? false,
    }
  },
  async saveAnswers(answer) {
    return mutateDemoStore((store) => {
      const checkin = store.checkins.find((c) => c.id === answer.checkinId)
      if (!checkin) throw new Error('checkin not found')
      if (!isActiveMember(store.coupleMembers, checkin.coupleId, answer.userId)) {
        throw new Error('not a couple member')
      }
      const index = store.checkinAnswers.findIndex(
        (a) => a.checkinId === answer.checkinId && a.userId === answer.userId,
      )
      if (index === -1) store.checkinAnswers.push({ ...answer })
      else store.checkinAnswers[index] = { ...answer }
      return { ...answer }
    })
  },
}

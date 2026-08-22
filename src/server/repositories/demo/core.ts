import 'server-only'
import type { Repositories } from '../repository-types'
import type {
  Couple,
  CoupleInvitation,
  CoupleMember,
  Profile,
} from '@/types/entities'
import type { RelationshipStage } from '@/types/domain'
import {
  assertActiveMember,
  isActiveMember,
} from '@/server/policies/couple-policy'
import { allQuestions, getQuestionById } from '@/content/questions'
import { getDemoStore, mutateDemoStore, newId, nowIso } from './store'

export const demoProfiles: Repositories['profiles'] = {
  async getById(id) {
    return getDemoStore().profiles.find((p) => p.id === id) ?? null
  },
  async ensure(id, defaults) {
    return mutateDemoStore((store) => {
      const existing = store.profiles.find((p) => p.id === id)
      if (existing) return { ...existing }
      const profile: Profile = {
        id,
        displayName: defaults.displayName,
        email: defaults.email,
        locale: 'ja',
        timezone: 'Asia/Tokyo',
        ageConfirmed: false,
        isAdmin: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      store.profiles.push(profile)
      return { ...profile }
    })
  },
  async update(id, patch) {
    return mutateDemoStore((store) => {
      const profile = store.profiles.find((p) => p.id === id)
      if (!profile) throw new Error('profile not found')
      Object.assign(profile, patch, { updatedAt: nowIso() })
      return { ...profile } satisfies Profile
    })
  },
}

export const demoCouples: Repositories['couples'] = {
  async getForUser(userId) {
    const store = getDemoStore()
    const membership = store.coupleMembers.find((m) => m.userId === userId && m.active)
    if (!membership) return null
    const couple = store.couples.find((c) => c.id === membership.coupleId)
    if (!couple || couple.status !== 'active') return null
    return {
      couple: { ...couple },
      members: store.coupleMembers.filter((m) => m.coupleId === couple.id).map((m) => ({ ...m })),
    }
  },
  async getById(coupleId, viewerUserId) {
    const store = getDemoStore()
    if (!isActiveMember(store.coupleMembers, coupleId, viewerUserId)) return null
    const couple = store.couples.find((c) => c.id === coupleId)
    if (!couple) return null
    return {
      couple: { ...couple },
      members: store.coupleMembers.filter((m) => m.coupleId === coupleId).map((m) => ({ ...m })),
    }
  },
  async create({ stage, userIds }) {
    return mutateDemoStore((store) => {
      for (const userId of userIds) {
        if (store.coupleMembers.some((m) => m.userId === userId && m.active)) {
          throw new Error('user already in an active couple')
        }
      }
      const couple: Couple = {
        id: newId('couple'),
        status: 'active',
        relationshipStage: stage,
        anniversary: null,
        pairedAt: nowIso(),
        unpairedAt: null,
        createdAt: nowIso(),
      }
      store.couples.push(couple)
      for (const userId of userIds) {
        const member: CoupleMember = {
          coupleId: couple.id,
          userId,
          role: 'member',
          active: true,
          joinedAt: nowIso(),
          leftAt: null,
        }
        store.coupleMembers.push(member)
      }
      return { ...couple }
    })
  },
  async updateStage(coupleId, viewerUserId, stage: RelationshipStage) {
    mutateDemoStore((store) => {
      assertActiveMember(store.coupleMembers, coupleId, viewerUserId)
      const couple = store.couples.find((c) => c.id === coupleId)
      if (couple) couple.relationshipStage = stage
    })
  },
  async unpair(coupleId, requestedByUserId) {
    mutateDemoStore((store) => {
      assertActiveMember(store.coupleMembers, coupleId, requestedByUserId)
      const couple = store.couples.find((c) => c.id === coupleId)
      if (!couple) return
      couple.status = 'unpaired'
      couple.unpairedAt = nowIso()
      for (const member of store.coupleMembers.filter((m) => m.coupleId === coupleId)) {
        member.active = false
        member.leftAt = nowIso()
      }
      // Invitations from either member die with the pair (spec §37)
      for (const invitation of store.invitations) {
        if (
          store.coupleMembers.some(
            (m) => m.coupleId === coupleId && m.userId === invitation.inviterUserId,
          ) &&
          !invitation.usedAt
        ) {
          invitation.revokedAt = nowIso()
        }
      }
    })
  },
}

function invitationIsActive(invitation: CoupleInvitation): boolean {
  return (
    !invitation.usedAt &&
    !invitation.revokedAt &&
    new Date(invitation.expiresAt).getTime() > Date.now()
  )
}

export const demoInvitations: Repositories['invitations'] = {
  async create(invitation) {
    return mutateDemoStore((store) => {
      store.invitations.push({ ...invitation })
      return { ...invitation }
    })
  },
  async getActiveForInviter(inviterUserId) {
    const found = getDemoStore().invitations.find(
      (i) => i.inviterUserId === inviterUserId && invitationIsActive(i),
    )
    return found ? { ...found } : null
  },
  async findByTokenHash(tokenHash) {
    const found = getDemoStore().invitations.find(
      (i) => i.tokenHash === tokenHash && invitationIsActive(i),
    )
    return found ? { ...found } : null
  },
  async findByCodeHash(codeHash) {
    const found = getDemoStore().invitations.find(
      (i) => i.codeHash === codeHash && invitationIsActive(i),
    )
    return found ? { ...found } : null
  },
  async peekBySecretHash(secretHash) {
    const store = getDemoStore()
    const invitation = store.invitations.find(
      (i) =>
        (i.tokenHash === secretHash || i.codeHash === secretHash) &&
        invitationIsActive(i) &&
        i.attemptCount < 5,
    )
    if (!invitation) return null
    const inviter = store.profiles.find((p) => p.id === invitation.inviterUserId)
    if (!inviter) return null
    return { inviterName: inviter.displayName, stage: invitation.relationshipStage }
  },
  async listActive() {
    return getDemoStore().invitations.filter(invitationIsActive).map((i) => ({ ...i }))
  },
  async recordFailedAttempt(invitationId) {
    return mutateDemoStore((store) => {
      const invitation = store.invitations.find((i) => i.id === invitationId)
      if (!invitation) return 0
      invitation.attemptCount += 1
      return invitation.attemptCount
    })
  },
  async markUsed(invitationId, usedByUserId) {
    mutateDemoStore((store) => {
      const invitation = store.invitations.find((i) => i.id === invitationId)
      if (!invitation) throw new Error('invitation not found')
      invitation.usedAt = nowIso()
      invitation.usedByUserId = usedByUserId
    })
  },
  async revoke(invitationId, inviterUserId) {
    mutateDemoStore((store) => {
      const invitation = store.invitations.find(
        (i) => i.id === invitationId && i.inviterUserId === inviterUserId,
      )
      if (invitation) invitation.revokedAt = nowIso()
    })
  },
}

export const demoQuestions: Repositories['questions'] = {
  async getById(id) {
    return getQuestionById(id) ?? null
  },
  async listActive() {
    return allQuestions.filter((q) => q.active)
  },
}

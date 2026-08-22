import 'server-only'
import { getRepositories } from '@/server/repositories'
import {
  generateInvitationSecrets,
  hashInvitationSecret,
  invitationExpiryFromNow,
  MAX_INVITATION_ATTEMPTS,
} from '@/lib/security/invitation-token'
import { publicEnv } from '@/config/env'
import { track } from '@/lib/analytics/track'
import type { RelationshipStage } from '@/types/domain'
import type { PairStatusDTO } from '@/types/dto'
import { daysBetween } from '@/lib/dates'

export class PairingError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid_code' | 'too_many_attempts' | 'already_paired' | 'self_accept',
  ) {
    super(message)
    this.name = 'PairingError'
  }
}

/**
 * Invitation lifecycle (spec §7): hashed token + 6-digit code, 48h TTL,
 * single-use, revocable, rate-limited redemption.
 *
 * The raw secrets exist only in the return value of `createInvitation` —
 * they are shown to the inviter once and never persisted.
 */
export async function createInvitation(
  inviterUserId: string,
  stage: RelationshipStage,
): Promise<{ inviteUrl: string; code: string; expiresAt: string }> {
  const repos = getRepositories()
  if (await repos.couples.getForUser(inviterUserId)) {
    throw new PairingError('already in a couple', 'already_paired')
  }
  const existing = await repos.invitations.getActiveForInviter(inviterUserId)
  if (existing) await repos.invitations.revoke(existing.id, inviterUserId)

  const { rawToken, code, tokenHash, codeHash } = generateInvitationSecrets()
  const expiresAt = invitationExpiryFromNow()
  await repos.invitations.create({
    id: `inv_${crypto.randomUUID()}`,
    inviterUserId,
    tokenHash,
    codeHash,
    relationshipStage: stage,
    expiresAt,
    usedAt: null,
    usedByUserId: null,
    revokedAt: null,
    attemptCount: 0,
    createdAt: new Date().toISOString(),
  })
  await track('partner_invite_created', { stage })
  return {
    inviteUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/pair?token=${rawToken}`,
    code,
    expiresAt,
  }
}

export async function revokeInvitation(inviterUserId: string): Promise<void> {
  const repos = getRepositories()
  const invitation = await repos.invitations.getActiveForInviter(inviterUserId)
  if (invitation) await repos.invitations.revoke(invitation.id, inviterUserId)
}

/**
 * Accept by 6-digit code or by link token. Brute force is bounded per
 * invitation: after MAX_INVITATION_ATTEMPTS failures the invitation locks.
 */
export async function acceptInvitation(
  accepterUserId: string,
  secret: string,
): Promise<{ coupleId: string }> {
  const repos = getRepositories()
  if (await repos.couples.getForUser(accepterUserId)) {
    throw new PairingError('already in a couple', 'already_paired')
  }

  const secretHash = hashInvitationSecret(secret.trim())
  const invitation =
    (await repos.invitations.findByCodeHash(secretHash)) ??
    (await repos.invitations.findByTokenHash(secretHash))

  if (!invitation) {
    // Count the failure against every live invitation this could target —
    // in practice codes are redeemed via the inviter's link/code pair, so we
    // record against active invitations to bound guessing.
    for (const active of await repos.invitations.listActive()) {
      const attempts = await repos.invitations.recordFailedAttempt(active.id)
      if (attempts >= MAX_INVITATION_ATTEMPTS) {
        await repos.invitations.revoke(active.id, active.inviterUserId)
      }
    }
    throw new PairingError('code not found', 'invalid_code')
  }
  if (invitation.attemptCount >= MAX_INVITATION_ATTEMPTS) {
    throw new PairingError('locked', 'too_many_attempts')
  }
  if (invitation.inviterUserId === accepterUserId) {
    throw new PairingError('cannot accept own invitation', 'self_accept')
  }

  await repos.invitations.markUsed(invitation.id, accepterUserId)
  const couple = await repos.couples.create({
    stage: invitation.relationshipStage,
    userIds: [invitation.inviterUserId, accepterUserId],
  })
  await repos.timeline.add({
    id: `tl_${crypto.randomUUID()}`,
    coupleId: couple.id,
    kind: 'paired',
    title: '二人がアプリでつながった日',
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  })
  await track('partner_invite_accepted', {})
  await track('couple_pairing_completed', { coupleId: couple.id })
  return { coupleId: couple.id }
}

export async function getPairStatus(userId: string): Promise<PairStatusDTO> {
  const repos = getRepositories()
  const membership = await repos.couples.getForUser(userId)
  if (membership) {
    const partnerMember = membership.members.find((m) => m.userId !== userId && m.active)
    const partnerProfile = partnerMember
      ? await repos.profiles.getById(partnerMember.userId)
      : null
    return {
      paired: true,
      couple: {
        coupleId: membership.couple.id,
        relationshipStage: membership.couple.relationshipStage,
        partner: partnerProfile
          ? { userId: partnerProfile.id, displayName: partnerProfile.displayName }
          : null,
        pairedAt: membership.couple.pairedAt,
        daysTogether: membership.couple.pairedAt ? daysBetween(membership.couple.pairedAt) : null,
      },
      pendingInvitation: null,
    }
  }
  return { paired: false, couple: null, pendingInvitation: null }
}

export async function unpairCouple(
  userId: string,
  dataChoice: 'keep' | 'delete_mine',
): Promise<void> {
  const repos = getRepositories()
  const membership = await repos.couples.getForUser(userId)
  if (!membership) return
  await repos.couples.unpair(membership.couple.id, userId)
  if (dataChoice === 'delete_mine') {
    await repos.dataRequests.create({
      id: `udr_${crypto.randomUUID()}`,
      userId,
      kind: 'deletion',
      status: 'pending',
      requestedAt: new Date().toISOString(),
      completedAt: null,
    })
  }
}

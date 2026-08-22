import type { Couple, CoupleMember } from '@/types/entities'

export class NotACoupleMemberError extends Error {
  constructor() {
    super('User is not an active member of this couple')
    this.name = 'NotACoupleMemberError'
  }
}

/**
 * Every couple-scoped repository read/write funnels through this check.
 * Unpairing marks memberships inactive, which closes this gate everywhere at
 * once (spec §23: access to new data ends at unpair).
 */
export function isActiveMember(members: CoupleMember[], coupleId: string, userId: string): boolean {
  return members.some((m) => m.coupleId === coupleId && m.userId === userId && m.active)
}

export function assertActiveMember(
  members: CoupleMember[],
  coupleId: string,
  userId: string,
): void {
  if (!isActiveMember(members, coupleId, userId)) throw new NotACoupleMemberError()
}

export function partnerOf(
  members: CoupleMember[],
  coupleId: string,
  userId: string,
): string | null {
  const partner = members.find((m) => m.coupleId === coupleId && m.userId !== userId && m.active)
  return partner?.userId ?? null
}

export function coupleIsActive(couple: Couple): boolean {
  return couple.status === 'active'
}

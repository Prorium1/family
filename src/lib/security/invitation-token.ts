import 'server-only'
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { serverEnv } from '@/config/server-env'

/**
 * Invitation credentials (spec §7): a long link token and a 6-digit code.
 * Only peppered HMAC hashes are persisted, so neither the DB alone nor a
 * leaked backup can redeem an invitation.
 */

export const INVITATION_TTL_HOURS = 48
export const MAX_INVITATION_ATTEMPTS = 5

export function generateInvitationSecrets(): {
  rawToken: string
  code: string
  tokenHash: string
  codeHash: string
} {
  const rawToken = randomBytes(32).toString('base64url')
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  return {
    rawToken,
    code,
    tokenHash: hashInvitationSecret(rawToken),
    codeHash: hashInvitationSecret(code),
  }
}

export function hashInvitationSecret(secret: string): string {
  return createHmac('sha256', serverEnv.INVITATION_TOKEN_PEPPER).update(secret).digest('hex')
}

export function secretMatchesHash(secret: string, hash: string): boolean {
  const candidate = Buffer.from(hashInvitationSecret(secret), 'hex')
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function invitationExpiryFromNow(now = new Date()): string {
  return new Date(now.getTime() + INVITATION_TTL_HOURS * 3600_000).toISOString()
}

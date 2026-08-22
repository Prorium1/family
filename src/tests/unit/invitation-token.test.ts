import { describe, expect, it } from 'vitest'
import {
  generateInvitationSecrets,
  hashInvitationSecret,
  invitationExpiryFromNow,
  secretMatchesHash,
} from '@/lib/security/invitation-token'

describe('invitation tokens (spec §7)', () => {
  it('never exposes raw secrets via the stored hashes', () => {
    const { rawToken, code, tokenHash, codeHash } = generateInvitationSecrets()
    expect(tokenHash).not.toContain(rawToken)
    expect(codeHash).not.toContain(code)
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces a 6-digit code', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateInvitationSecrets().code).toMatch(/^\d{6}$/)
    }
  })

  it('verifies matching secrets and rejects wrong ones', () => {
    const { rawToken, code, tokenHash, codeHash } = generateInvitationSecrets()
    expect(secretMatchesHash(rawToken, tokenHash)).toBe(true)
    expect(secretMatchesHash(code, codeHash)).toBe(true)
    expect(secretMatchesHash('000000', codeHash)).toBe(code === '000000')
    expect(secretMatchesHash('wrong-token', tokenHash)).toBe(false)
  })

  it('is deterministic for the same secret (peppered HMAC)', () => {
    expect(hashInvitationSecret('123456')).toBe(hashInvitationSecret('123456'))
    expect(hashInvitationSecret('123456')).not.toBe(hashInvitationSecret('123457'))
  })

  it('sets a 48h expiry', () => {
    const now = new Date('2026-08-22T00:00:00Z')
    expect(invitationExpiryFromNow(now)).toBe('2026-08-24T00:00:00.000Z')
  })
})

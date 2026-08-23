import { describe, expect, it } from 'vitest'
import {
  formatInviteCode,
  looksLikeInviteSecret,
  normalizeInviteSecret,
} from '@/lib/pairing/invite-secret'

/**
 * Whatever the partner is holding — a scanned QR, a pasted link, a code read
 * out over the phone — has to land in the same place (spec §7).
 */
describe('normalizeInviteSecret', () => {
  it('takes the token out of an invite link', () => {
    expect(normalizeInviteSecret('https://futari.app/join/AbC-123_xyz')).toBe('AbC-123_xyz')
  })

  it('ignores a trailing query, hash or slash on that link', () => {
    for (const suffix of ['?utm=line', '#top', '/', '?a=1#b']) {
      expect(normalizeInviteSecret(`https://futari.app/join/tok123${suffix}`)).toBe('tok123')
    }
  })

  it('accepts a link that carries the token as a query parameter', () => {
    expect(normalizeInviteSecret('https://futari.app/pair?token=tok123&x=1')).toBe('tok123')
  })

  it('accepts the code however a person writes it', () => {
    for (const written of ['123456', '123 456', '123-456', '123・456', ' 123456 ', '123　456']) {
      expect(normalizeInviteSecret(written), written).toBe('123456')
    }
  })

  it('accepts full-width digits, which a Japanese keyboard produces by itself', () => {
    expect(normalizeInviteSecret('１２３４５６')).toBe('123456')
    expect(normalizeInviteSecret('１２３・４５６')).toBe('123456')
  })

  it('passes a raw token through untouched', () => {
    const token = 'x'.repeat(43)
    expect(normalizeInviteSecret(token)).toBe(token)
  })

  it('never invents a secret out of nothing', () => {
    for (const empty of ['', '   ', '\n']) expect(normalizeInviteSecret(empty)).toBe('')
  })

  it('does not silently turn a wrong-length number into a code', () => {
    expect(normalizeInviteSecret('12345')).toBe('12345')
    expect(normalizeInviteSecret('1234567')).toBe('1234567')
  })
})

describe('looksLikeInviteSecret', () => {
  it('accepts what the server can actually check', () => {
    expect(looksLikeInviteSecret('123456')).toBe(true)
    expect(looksLikeInviteSecret('https://futari.app/join/AbC-123_xyz')).toBe(true)
  })

  it('rejects what would only produce a failed attempt', () => {
    for (const bad of ['', '123', 'x'.repeat(80)]) {
      expect(looksLikeInviteSecret(bad), bad).toBe(false)
    }
  })

  it('refuses a stray URL, so a mistyped paste never costs a real invitation', () => {
    // a wrong secret counts against every live invitation; enough failures
    // revoke them, so junk must be caught on the sender's own screen
    for (const bad of [
      'https://example.com/',
      'https://futari.app/',
      'ttps//join',
      '見て → http://a',
    ]) {
      expect(looksLikeInviteSecret(bad), bad).toBe(false)
    }
  })
})

describe('formatInviteCode', () => {
  it('groups a 6-digit code in threes, and leaves anything else alone', () => {
    expect(formatInviteCode('123456')).toBe('123・456')
    expect(formatInviteCode('abc')).toBe('abc')
  })
})

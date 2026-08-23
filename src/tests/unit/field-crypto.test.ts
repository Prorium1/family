import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

/**
 * What two people write is encrypted before it reaches the database
 * (docs/SECURITY.md §11). These tests hold the properties that make that
 * worth anything: the stored form reveals nothing, it cannot be moved
 * between columns, it survives a key rotation, and a missing key fails
 * loudly instead of quietly returning something wrong.
 */

const KEY_A = Buffer.alloc(32, 1).toString('base64')
const KEY_B = Buffer.alloc(32, 2).toString('base64')

async function crypto(current: string, previous = '') {
  vi.resetModules()
  vi.doMock('@/config/server-env', () => ({
    serverEnv: { DATA_ENCRYPTION_KEY: current, DATA_ENCRYPTION_KEY_PREVIOUS: previous },
  }))
  return import('@/lib/security/field-crypto')
}

const SECRET = '本当は、あの日ずっと不安だった。'

beforeEach(() => vi.resetModules())
afterEach(() => vi.doUnmock('@/config/server-env'))

describe('a sealed field gives nothing away', () => {
  it('round-trips exactly', async () => {
    const { sealText, openText } = await crypto(KEY_A)
    const sealed = sealText(SECRET, 'answers.value')
    expect(openText(sealed, 'answers.value')).toBe(SECRET)
  })

  it('stores no fragment of the original text', async () => {
    const { sealText } = await crypto(KEY_A)
    const sealed = sealText(SECRET, 'answers.value')
    expect(sealed).not.toContain('不安')
    expect(sealed).not.toContain(SECRET)
    for (const char of [...SECRET]) expect(sealed.includes(char.repeat(3))).toBe(false)
  })

  it('looks different every time, so equal answers are not visibly equal', async () => {
    const { sealText } = await crypto(KEY_A)
    expect(sealText(SECRET, 'answers.value')).not.toBe(sealText(SECRET, 'answers.value'))
  })

  it('refuses a value moved from another column', async () => {
    const { sealText, openText } = await crypto(KEY_A)
    const sealed = sealText(SECRET, 'repair_entries.text')
    expect(() => openText(sealed, 'answers.value')).toThrow(/unable to decrypt/)
  })

  it('refuses a value that was tampered with', async () => {
    const { sealText, openText } = await crypto(KEY_A)
    const sealed = sealText(SECRET, 'answers.value')
    const [v, iv, tag, body] = sealed.split('.')
    const flipped = [v, iv, tag, Buffer.from('別の言葉').toString('base64url')].join('.')
    expect(() => openText(flipped, 'answers.value')).toThrow(/unable to decrypt/)
    expect(body).toBeTruthy()
  })

  it('refuses to read with the wrong key rather than returning nonsense', async () => {
    const { sealText } = await crypto(KEY_A)
    const sealed = sealText(SECRET, 'answers.value')
    const other = await crypto(KEY_B)
    expect(() => other.openText(sealed, 'answers.value')).toThrow(/unable to decrypt/)
  })
})

describe('operations that must keep working', () => {
  it('reads rows written under the previous key during a rotation', async () => {
    const { sealText } = await crypto(KEY_A)
    const old = sealText(SECRET, 'answers.value')
    const rotated = await crypto(KEY_B, KEY_A)
    expect(rotated.openText(old, 'answers.value')).toBe(SECRET)
    // …and new writes use the new key
    expect(rotated.openText(rotated.sealText(SECRET, 'answers.value'), 'answers.value')).toBe(SECRET)
  })

  it('reads plaintext written before encryption was switched on', async () => {
    const { openText, openJson } = await crypto(KEY_A)
    expect(openText('むかしの平文', 'answers.value')).toBe('むかしの平文')
    expect(openJson({ kind: 'text', text: 'plain' }, 'answers.value')).toEqual({
      kind: 'text',
      text: 'plain',
    })
  })

  it('passes values through untouched when no key is configured (demo mode)', async () => {
    const { sealText, encryptionEnabled } = await crypto('')
    expect(encryptionEnabled()).toBe(false)
    expect(sealText(SECRET, 'answers.value')).toBe(SECRET)
  })

  it('seals structured answers, not just strings', async () => {
    const { sealJson, openJson } = await crypto(KEY_A)
    const value = { kind: 'text', text: SECRET }
    const sealed = sealJson(value, 'answers.value')
    expect(String(sealed)).not.toContain('不安')
    expect(openJson(sealed, 'answers.value')).toEqual(value)
  })
})

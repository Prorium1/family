import { describe, expect, it } from 'vitest'
import { ja } from '@/lib/i18n/messages/ja'
import { en } from '@/lib/i18n/messages/en'
import { fill, getMessages } from '@/lib/i18n'

function collectStrings(obj: object, path = ''): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string'
      ? ([[`${path}${key}`, value]] as Array<[string, string]>)
      : collectStrings(value as object, `${path}${key}.`),
  )
}

describe('i18n catalogs', () => {
  it('has no empty strings in either catalog', () => {
    for (const [path, value] of [...collectStrings(ja), ...collectStrings(en)]) {
      expect(value.trim().length, path).toBeGreaterThan(0)
    }
  })

  it('en mirrors every ja key', () => {
    const jaKeys = collectStrings(ja).map(([k]) => k)
    const enKeys = new Set(collectStrings(en).map(([k]) => k))
    for (const key of jaKeys) expect(enKeys.has(key), key).toBe(true)
  })

  it('never uses guilt-driven streak language (spec §20, §24)', () => {
    for (const [path, value] of collectStrings(ja)) {
      expect(value, path).not.toMatch(/連続記録|途切れ/)
    }
  })

  it('fill interpolates placeholders', () => {
    expect(fill('こんにちは、{name}さん', { name: '陽菜' })).toBe('こんにちは、陽菜さん')
    expect(getMessages('en').nav.today).toBe('Today')
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Guard: the service worker may only ever cache the app shell (spec §21).
 * If someone adds caching for dynamic/intimate routes, this test fails.
 */
describe('service worker privacy contract', () => {
  const source = readFileSync('public/sw.js', 'utf8')

  it('never lists intimate routes as cacheable', () => {
    for (const path of ['/today', '/repair', '/weekly-checkin', '/manual', '/story', '/home']) {
      expect(source).not.toMatch(new RegExp(`cache.*['"\`]${path}`, 'i'))
    }
  })

  it('keeps /api network-only and navigations uncached', () => {
    expect(source).toContain("url.pathname.startsWith('/api/')")
    expect(source).toMatch(/mode === 'navigate'/)
    // the navigate branch must not contain a cache.put
    const navigateBranch = source.slice(source.indexOf("mode === 'navigate'"), source.indexOf('Cache-first'))
    expect(navigateBranch).not.toContain('cache.put')
  })

  it('restricts cache-first to hashed static assets and icons', () => {
    expect(source).toContain("url.pathname.startsWith('/_next/static/')")
    expect(source).toContain("url.pathname.startsWith('/icons/')")
  })
})

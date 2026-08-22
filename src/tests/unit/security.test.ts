import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { rateLimit, resetRateLimits } from '@/lib/security/rate-limit'

/**
 * The privacy page makes promises to two people who are about to write down
 * something they have not said out loud. These tests hold the promises that
 * live outside the request path — headers, limits, and the claims the page
 * itself makes (docs/SECURITY.md).
 */

describe('response headers lock the page down (docs/SECURITY.md §7)', () => {
  const config = readFileSync('next.config.ts', 'utf8')

  it('allows no third-party script, style, font or frame', () => {
    expect(config).toContain("default-src 'self'")
    expect(config).toContain("frame-ancestors 'none'")
    expect(config).toContain("object-src 'none'")
    // the only host the browser may talk to is the database
    const connect = config.match(/"connect-src[^"]+"/)![0]
    expect(connect).toContain("'self'")
    expect(connect).toContain('supabase.co')
    expect(connect).not.toMatch(/google|segment|amplitude|facebook|analytics/i)
  })

  it('keeps an invitation token out of other origins and out of caches', () => {
    expect(config).toContain('Referrer-Policy')
    expect(config).toContain('strict-origin-when-cross-origin')
    expect(config).toMatch(/\/join\/:token/)
    expect(config).toContain('no-store')
  })

  it('turns off the sensors this product never needs', () => {
    const policy = config.match(/'Permissions-Policy', value: '([^']+)'/)![1]
    for (const sensor of ['camera=()', 'microphone=()', 'geolocation=()']) {
      expect(policy).toContain(sensor)
    }
  })

  it('demands HTTPS and hides the framework', () => {
    expect(config).toContain('Strict-Transport-Security')
    expect(config).toMatch(/max-age=31536000/)
    expect(config).toContain('poweredByHeader: false')
  })
})

describe('cookies (docs/SECURITY.md §7)', () => {
  it('are httpOnly, lax and secure in production', () => {
    for (const file of ['src/lib/auth/invite-cookie.ts', 'src/app/api/demo/login/route.ts']) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).toContain('httpOnly: true')
      expect(source, file).toContain("sameSite: 'lax'")
      expect(source, file).toMatch(/secure: process\.env\.NODE_ENV === 'production'/)
    }
  })
})

describe('login links cannot be used to flood an inbox (§8)', () => {
  beforeEach(() => resetRateLimits())

  it('stops after the limit and says how long to wait', () => {
    const key = 'magic:addr:someone@example.com'
    const opts = { limit: 5, windowMs: 60_000 }
    for (let i = 0; i < 5; i++) expect(rateLimit(key, opts).allowed).toBe(true)
    const blocked = rateLimit(key, opts)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('counts each address separately, so one person cannot lock out another', () => {
    const opts = { limit: 2, windowMs: 60_000 }
    rateLimit('magic:addr:a@example.com', opts)
    rateLimit('magic:addr:a@example.com', opts)
    expect(rateLimit('magic:addr:a@example.com', opts).allowed).toBe(false)
    expect(rateLimit('magic:addr:b@example.com', opts).allowed).toBe(true)
  })

  it('forgets everything once the window passes — nothing is retained', () => {
    const opts = { limit: 1, windowMs: 1 }
    expect(rateLimit('magic:ip:1.2.3.4', opts).allowed).toBe(true)
    const later = Date.now() + 5
    while (Date.now() < later) {
      /* wait out the window */
    }
    expect(rateLimit('magic:ip:1.2.3.4', opts).allowed).toBe(true)
  })
})

describe('the privacy page only claims what the code does (§1–§9)', () => {
  const page = readFileSync('src/app/(public)/privacy/page.tsx', 'utf8')
  const security = readFileSync('docs/SECURITY.md', 'utf8')

  it('names where the data lives and who processes it', () => {
    for (const claim of ['東京', 'Supabase', 'Vercel', 'TLS']) {
      expect(page, `privacy page must state: ${claim}`).toContain(claim)
    }
  })

  it('states the AI rule the code actually enforces', () => {
    expect(page).toContain('二人ともが同意しているときだけ')
    expect(page).toContain('AIに送信されません')
    expect(security).toContain('coupleAllowsAiProcessing')
  })

  it('promises export and deletion, and that they stay free', () => {
    expect(page).toContain('エクスポート')
    expect(page).toContain('削除')
    expect(page).toContain('有料になることはありません')
  })

  it('is dated, so a reader can tell whether it is current', () => {
    expect(page).toMatch(/LAST_UPDATED = '20\d\d年\d+月\d+日'/)
  })
})

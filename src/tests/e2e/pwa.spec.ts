import { expect, test } from '@playwright/test'

test.describe('PWA (spec §21)', () => {
  test('manifest, service worker and offline page are served', async ({ request }) => {
    const manifest = await request.get('/manifest.webmanifest')
    expect(manifest.ok()).toBeTruthy()
    const body = await manifest.json()
    expect(body.display).toBe('standalone')
    expect(body.icons.length).toBeGreaterThanOrEqual(3)

    const sw = await request.get('/sw.js')
    expect(sw.ok()).toBeTruthy()
    const swText = await sw.text()
    expect(swText).toContain('mode === \'navigate\'')

    const offline = await request.get('/offline')
    expect(offline.ok()).toBeTruthy()
  })
})

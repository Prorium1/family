import { expect, test } from '@playwright/test'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { loginAs, onboardIfNeeded, resetDemo } from './helpers'

/**
 * The question every couple will ask on day one: *if my partner scans this
 * with their camera, do we actually end up connected?*
 *
 * So this spec does not trust the markup. It photographs the QR code as a
 * real camera would see it, decodes the pixels, and then pairs a second
 * device using only what the decoder read.
 */
test.describe('QRコードの読み取りから、二人がつながるまで', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('the rendered QR decodes to the invite link, and that link pairs a second device', async ({
    page,
    browser,
    baseURL,
  }) => {
    // One person registers; the invitation appears without being asked for
    await loginAs(page, 'a', '/onboarding')
    await onboardIfNeeded(page, { name: 'ゆき', gender: '女性' })
    await page.waitForURL(/\/pair/)
    const qr = page.getByRole('img', { name: '招待用QRコード' })
    await qr.waitFor()

    // Photograph it, as a phone camera would
    const shot = await qr.screenshot({ scale: 'device' })
    const png = PNG.sync.read(shot)
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)

    expect(decoded, 'the QR code must be readable as an image').not.toBeNull()
    const scanned = decoded!.data
    expect(scanned).toContain('/join/')

    // It must be the very link the screen shows — not a stale or partial one
    const shown = (await page.locator('[data-testid="invite-url"]').textContent())?.trim()
    expect(scanned).toBe(shown)

    // Now the partner's phone: a device with no session, opening only the
    // string the camera read.
    const partnerContext = await browser.newContext()
    const partnerPage = await partnerContext.newPage()
    await partnerPage.goto(scanned.replace(baseURL ?? '', baseURL ?? ''))
    await partnerPage.waitForURL(/\/welcome/)
    await expect(partnerPage.getByText('ゆきさんから', { exact: false })).toBeVisible()

    await partnerPage.getByRole('link', { name: '男性として参加する' }).click()
    await partnerPage.waitForURL(/\/onboarding/)
    await onboardIfNeeded(partnerPage, { name: 'かい', gender: '男性' })
    await partnerPage.waitForURL(/\/home\?paired=1/)
    await expect(partnerPage.getByText('二人がつながりました')).toBeVisible()

    // …and the first phone finds out on its own, without being reloaded
    await page.waitForURL(/\/home/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: '今日のふたり' })).toBeVisible()
    await partnerContext.close()
  })

  test('the code under the QR is the same invitation, for when a camera fails', async ({
    page,
  }) => {
    await loginAs(page, 'a', '/onboarding')
    await onboardIfNeeded(page, { name: 'ゆき', gender: '女性' })
    await page.waitForURL(/\/pair/)
    // read aloud in threes on screen — and accepted exactly as it is written
    const code = (await page.locator('[data-testid="invite-code"]').textContent())?.trim() ?? ''
    expect(code).toMatch(/^\d{3}・\d{3}$/)

    await loginAs(page, 'b', '/onboarding')
    await onboardIfNeeded(page, { name: 'かい', gender: '男性' })
    await page.waitForURL(/\/pair/)
    await page.getByLabel('相手のコード / 招待リンク').fill(code)
    await page.getByRole('button', { name: '二人をつなぐ' }).click()
    await page.waitForURL(/\/home/)
    await expect(page.getByRole('heading', { name: '今日のふたり' })).toBeVisible()
  })
})

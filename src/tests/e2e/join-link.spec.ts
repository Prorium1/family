import { expect, test } from '@playwright/test'
import { loginAs, onboardIfNeeded, resetDemo } from './helpers'

/**
 * The frictionless activation path: the inviter finishes onboarding and the
 * invite already exists; the partner taps the link, registers, and is paired
 * automatically — no code entry anywhere.
 */
test.describe('招待リンクからのスムーズ参加 (spec §7 activation)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('inviter gets link+QR with zero extra taps; partner taps link → registers → auto-paired', async ({
    page,
  }) => {
    // A: onboarding ends with the invitation already on screen
    await loginAs(page, 'a', '/onboarding')
    await onboardIfNeeded(page, { name: 'ゆき', gender: '女性' })
    await page.waitForURL(/\/pair\?auto=1/)
    await page.locator('[data-testid="invite-url"]').waitFor()
    const inviteUrl = (await page.locator('[data-testid="invite-url"]').textContent())?.trim() ?? ''
    expect(inviteUrl).toMatch(/\/join\//)
    // QR code rendered for side-by-side pairing
    await expect(page.getByRole('img', { name: '招待用QRコード' })).toBeVisible()
    // share affordance present
    await expect(page.getByRole('button', { name: /招待を送る/ })).toBeVisible()

    // B: tap the link on their own phone — a device with no session
    await page.context().clearCookies()
    await page.goto(inviteUrl)
    await page.waitForURL(/\/welcome/)
    await expect(page.getByText('ゆきさんから', { exact: false })).toBeVisible()

    // the partner picks how they want to be described — same-gender couples
    // take exactly the same path as anyone else
    await page.getByRole('link', { name: '女性として参加する' }).click()
    await page.waitForURL(/\/onboarding/)
    await expect(page.getByText('自動でゆきさんとつながります', { exact: false })).toBeVisible()
    await expect(page.getByLabel('今の二人の関係')).toHaveCount(0)
    await onboardIfNeeded(page, { name: 'あお', gender: '女性' })

    // …and they are already a couple, no code ever typed
    await page.waitForURL(/\/home\?paired=1/)
    await expect(page.getByText('二人がつながりました')).toBeVisible()
    await expect(page.getByRole('heading', { name: '今日のふたり' })).toBeVisible()
  })

  test('an expired or bogus link fails gently with a recovery path', async ({ page }) => {
    await page.goto('/join/this-token-does-not-exist')
    await page.waitForURL(/\/welcome\?invalid=1/)
    await expect(page.getByText('この招待リンクは使えなくなっています')).toBeVisible()
    await expect(page.getByRole('link', { name: '自分から招待をつくる' })).toBeVisible()
  })

  test("the inviter's waiting screen flips to home by itself once the partner joins", async ({
    page,
    browser,
  }) => {
    await loginAs(page, 'a', '/onboarding')
    await onboardIfNeeded(page, { name: 'ひかる', gender: '男性' })
    await page.locator('[data-testid="invite-url"]').waitFor()
    const inviteUrl = (await page.locator('[data-testid="invite-url"]').textContent())?.trim() ?? ''

    // partner joins from a separate browser context (their own phone)
    const partnerContext = await browser.newContext()
    const partnerPage = await partnerContext.newPage()
    await partnerPage.goto(inviteUrl)
    await partnerPage.getByRole('link', { name: '男性として参加する' }).click()
    await onboardIfNeeded(partnerPage, { name: 'かい', gender: '男性' })
    await partnerPage.waitForURL(/\/home\?paired=1/)
    await partnerContext.close()

    // A never reloads anything: the 4s poll notices and moves them to /home
    await page.waitForURL(/\/home/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: '今日のふたり' })).toBeVisible()
  })
})

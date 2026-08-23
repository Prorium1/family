import { expect, test } from '@playwright/test'
import {
  ensureInviteVisible,
  loginAs,
  onboardIfNeeded,
  openTodayQuestion,
  pairCoupleViaUi,
  resetDemo,
} from './helpers'

test.describe('ペアリング (spec §37-1)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('A registers → invites → B joins → both land in the same couple; a third party is locked out', async ({
    page,
  }) => {
    await pairCoupleViaUi(page)

    // B is paired: home shows the paired celebration and today's question
    await expect(page.getByText('二人がつながりました')).toBeVisible()
    await expect(page.getByRole('heading', { name: '今日のふたり' })).toBeVisible()

    // A sees the same paired home
    await loginAs(page, 'a', '/home')
    await expect(page.getByRole('heading', { name: '今日のふたり' })).toBeVisible()
    const todayUrl = await openTodayQuestion(page)

    // Third party C: no couple → deep link to the couple's assignment
    // bounces to the pairing screen with no couple data (spec §37-1-6)
    await loginAs(page, 'c', '/onboarding')
    await onboardIfNeeded(page)
    await page.goto(todayUrl)
    await page.waitForURL(/\/pair/)
    await expect(page.getByRole('button', { name: '招待コードを作成' })).toBeVisible()
  })

  test('a wrong invite code is rejected with a gentle error', async ({ page }) => {
    await loginAs(page, 'a', '/onboarding')
    await onboardIfNeeded(page)
    await ensureInviteVisible(page)

    await loginAs(page, 'b', '/onboarding')
    await onboardIfNeeded(page)
    await page.getByLabel('相手のコード / 招待リンク').fill('000000')
    await page.getByRole('button', { name: '二人をつなぐ' }).click()
    await expect(page.getByText('コードが確認できませんでした', { exact: false })).toBeVisible()
  })
})

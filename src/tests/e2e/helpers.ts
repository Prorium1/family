import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const SELECTORS = {
  inviteCode: '[data-testid="invite-code"]',
}

/** Rebuild the demo world so every spec starts from the same state. */
export async function resetDemo(request: APIRequestContext): Promise<void> {
  const response = await request.post('/api/demo/reset')
  expect(response.ok()).toBeTruthy()
}

export async function loginAs(page: Page, key: 'a' | 'b' | 'c', next = '/home'): Promise<void> {
  await page.goto(`/api/demo/login?user=${key}&next=${encodeURIComponent(next)}`)
}

/**
 * Complete the onboarding form when it is shown. An already-onboarded user
 * is redirected away by the server — in that case the form never appears and
 * this helper simply returns.
 */
export async function onboardIfNeeded(page: Page): Promise<void> {
  const ageCheckbox = page.getByRole('checkbox', { name: '私は18歳以上です' })
  const appeared = await ageCheckbox
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false)
  if (!appeared) return
  await ageCheckbox.click()
  await page.getByRole('checkbox', { name: /利用規約/ }).click()
  await page.getByRole('button', { name: 'はじめる' }).click()
  await page.waitForURL(/\/(pair|home)/)
}

/**
 * Full UI pairing dance: A onboards and creates an invite, B onboards and
 * redeems the 6-digit code. Returns the invite code used.
 */
export async function pairCoupleViaUi(page: Page): Promise<string> {
  await loginAs(page, 'a', '/onboarding')
  await onboardIfNeeded(page)
  await page.waitForURL(/\/pair/)
  await page.getByRole('button', { name: '招待リンクとコードを作成' }).click()
  const code = (await page.locator(SELECTORS.inviteCode).textContent())?.trim() ?? ''
  expect(code).toMatch(/^\d{6}$/)

  await loginAs(page, 'b', '/onboarding')
  await onboardIfNeeded(page)
  await page.waitForURL(/\/pair/)
  await page.getByLabel('招待コード').fill(code)
  await page.getByRole('button', { name: '参加する' }).click()
  await page.waitForURL(/\/home/)
  return code
}

/** Open today's question from home and return the assignment URL. */
export async function openTodayQuestion(page: Page): Promise<string> {
  await page.goto('/home')
  await page
    .getByRole('link', { name: /回答する|続きを書く|見る/ })
    .first()
    .click()
  await page.waitForURL(/\/today\//)
  return page.url()
}

/**
 * Open the first step of the 恋人として深く知る journey — a guaranteed
 * free-text question — so specs can assert on exact answer text regardless
 * of which (possibly non-text) daily question the date hash picked.
 */
export async function openKnowDeeperStep(page: Page): Promise<string> {
  await page.goto('/journeys/know-deeper')
  const continueLink = page.getByRole('link', { name: '続き' }).first()
  if (await continueLink.isVisible().catch(() => false)) {
    await continueLink.click()
  } else {
    await page.getByRole('button', { name: '話す' }).first().click()
  }
  await page.waitForURL(/\/today\//)
  return page.url()
}

/** Fill the free-text answer on the current /today page and submit it. */
export async function submitTextAnswer(page: Page, text: string): Promise<void> {
  await page.getByLabel('あなたの答え').fill(text)
  await page.getByRole('button', { name: '送信する' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: '送信する' }).click()
  await expect(page.getByText('あなたの回答は届きました。')).toBeVisible()
}

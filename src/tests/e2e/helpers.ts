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
 * Complete the onboarding form when it is shown: a name, how you want to be
 * described, one consent, one tap. Demo accounts start blank — nobody is
 * handed a ready-made persona — so the name is always typed here. An
 * already-onboarded user is redirected away by the server, in which case the
 * form never appears and this helper simply returns.
 */
export async function onboardIfNeeded(
  page: Page,
  { name = '1人目', gender = 'その他' }: { name?: string; gender?: string } = {},
): Promise<void> {
  const consent = page.getByRole('checkbox', { name: /18歳以上/ })
  const appeared = await consent
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false)
  if (!appeared) return
  await page.getByLabel('表示名').fill(name)
  await page.getByText(gender, { exact: true }).click()
  await consent.click()
  await page.getByRole('button', { name: /はじめる/ }).click()
  await page.waitForURL(/\/(pair|home)/)
}

/**
 * Full UI pairing dance: A onboards and creates an invite, B onboards and
 * redeems the 6-digit code. Returns the invite code used.
 */
/**
 * Fresh onboarding lands on /pair?auto=1 where the invite self-creates; a
 * revisit shows the manual button instead (secrets are shown only once).
 * Handle both so specs can call this at any point in a session.
 */
export async function ensureInviteVisible(page: Page): Promise<void> {
  const code = page.locator(SELECTORS.inviteCode)
  const already = await code
    .waitFor({ timeout: 4000 })
    .then(() => true)
    .catch(() => false)
  if (already) return
  const createButton = page.getByRole('button', { name: '招待コードを作成' })
  if (await createButton.isVisible().catch(() => false)) await createButton.click()
  await code.waitFor()
}

export async function pairCoupleViaUi(page: Page): Promise<string> {
  await loginAs(page, 'a', '/onboarding')
  await onboardIfNeeded(page, { name: '1人目', gender: '男性' })
  await page.waitForURL(/\/pair/)
  await ensureInviteVisible(page)
  // shown grouped in threes (123・456); typed back exactly as displayed, so
  // this also proves the screen's own formatting is accepted
  const shown = (await page.locator(SELECTORS.inviteCode).textContent())?.trim() ?? ''
  expect(shown).toMatch(/^\d{3}・\d{3}$/)

  await loginAs(page, 'b', '/onboarding')
  await onboardIfNeeded(page, { name: '2人目', gender: '男性' })
  await page.waitForURL(/\/pair/)
  await page.getByLabel('相手のコード / 招待リンク').fill(shown)
  await page.getByRole('button', { name: '二人をつなぐ' }).click()
  await page.waitForURL(/\/home/)
  return shown.replace('・', '')
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

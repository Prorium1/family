import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { loginAs, onboardIfNeeded, openTodayQuestion, pairCoupleViaUi, resetDemo } from './helpers'

async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([])
}

test.describe('アクセシビリティ (spec §36, WCAG 2.2 AA)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('public pages have no serious violations', async ({ page }) => {
    // Entry animations honor prefers-reduced-motion; scanning mid-fade would
    // make axe compute blended colors, so scan the reduced-motion rendering.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const path of ['/', '/login', '/safety', '/pricing']) {
      await page.goto(path)
      await expectNoSeriousViolations(page)
    }
  })

  test('core authed flow has no serious violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loginAs(page, 'a', '/onboarding')
    await expectNoSeriousViolations(page)
    await onboardIfNeeded(page)
    await expectNoSeriousViolations(page) // /pair

    await pairCoupleViaUi(page)
    await page.goto('/home')
    await expectNoSeriousViolations(page)

    await openTodayQuestion(page)
    await expectNoSeriousViolations(page)

    await page.goto('/repair/new')
    await expectNoSeriousViolations(page)

    for (const path of ['/dates', '/notes', '/cycle']) {
      await page.goto(path)
      await expectNoSeriousViolations(page)
    }

    await page.goto('/settings/privacy')
    await expectNoSeriousViolations(page)
  })
})

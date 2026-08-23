import { expect, test } from '@playwright/test'
import { loginAs, pairCoupleViaUi, resetDemo } from './helpers'

test.describe('ペア解除 (spec §37-4)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('one side unpairs; the other loses access to new shared data', async ({ page }) => {
    await pairCoupleViaUi(page)

    await loginAs(page, 'a', '/settings/couple')
    await page.getByRole('button', { name: 'ペアを解除する' }).click()
    await page.waitForURL(/\/pair\?unpaired=1/)
    await expect(page.getByText('ペアを解除しました', { exact: false })).toBeVisible()

    // B is back to unpaired state — home redirects to /pair
    await loginAs(page, 'b', '/home')
    await page.waitForURL(/\/pair/)
    await expect(page.getByRole('button', { name: '招待コードを作成' })).toBeVisible()
  })
})

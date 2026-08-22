import { expect, test } from '@playwright/test'
import { loginAs, pairCoupleViaUi, resetDemo } from './helpers'

const RAW_A = '週末の予定を直前で変えられて、とても悲しかったんだ_原文テスト'

test.describe('Repair Mode (spec §37-3)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test("A's raw text is never auto-shared; AI produces a neutral summary", async ({ page }) => {
    await pairCoupleViaUi(page)

    // A starts a together-session and answers with default visibility (AI要約のみ)
    await loginAs(page, 'a', '/repair/new')
    await page.getByLabel('何について整理しますか', { exact: false }).fill('週末の予定')
    await page.getByRole('button', { name: '二人で整理する' }).click()
    await page.waitForURL(/\/repair\/rs_/)
    const sessionUrl = page.url()
    await page.getByLabel('何が起きましたか？').fill(RAW_A)
    await page.getByLabel('そのとき、何を感じましたか？').fill('寂しさと、後回しにされた感じ')
    await page.getByRole('button', { name: '整理を送信する' }).click()
    await expect(page.getByText('あなたの整理は届きました。')).toBeVisible()

    // B opens the same session: A's raw text is nowhere (§37-3-2)
    await loginAs(page, 'b', '/repair')
    await page.getByRole('link', { name: 'ひらく' }).first().click()
    await page.waitForURL(/\/repair\/rs_/)
    expect(await page.content()).not.toContain(RAW_A)

    // B answers → neutral AI summary appears (§37-3-4), raw text still absent
    await page.getByLabel('何が起きましたか？').fill('自分は急な仕事で余裕がなかった')
    await page.getByLabel('そのとき、何を感じましたか？').fill('焦っていた')
    await page.getByRole('button', { name: '整理を送信する' }).click()
    await expect(page.getByText('愛の通訳からのメッセージ')).toBeVisible()
    await expect(page.getByText('話し合いの順番')).toBeVisible()
    expect(await page.content()).not.toContain(RAW_A)

    // the session URL guard: A still sees their own entries
    await loginAs(page, 'a', '/repair')
    await page.goto(sessionUrl)
    await expect(page.getByText('愛の通訳からのメッセージ')).toBeVisible()
  })

  test('high-risk input pauses mediation, shows resources, never notifies the partner (§37-3-5..7)', async ({
    page,
  }) => {
    await pairCoupleViaUi(page)

    await loginAs(page, 'a', '/repair/new')
    await page.getByRole('button', { name: '二人で整理する' }).click()
    await page.waitForURL(/\/repair\/rs_/)
    await page.getByLabel('何が起きましたか？').fill('昨日、彼に殴られました。怖いです。')
    await page.getByRole('button', { name: '整理を送信する' }).click()

    // Safety pause screen with resources and quick exit
    await expect(page.locator('[data-testid="safety-pause"]')).toBeVisible()
    await expect(page.getByText('まず、あなたの安全を大切にしてください')).toBeVisible()
    await expect(page.getByText('DV相談', { exact: false }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'すぐに閉じる' })).toBeVisible()
    await expect(
      page.getByText('この内容がパートナーへ自動で通知されることはありません。'),
    ).toBeVisible()

    // The partner receives NO signal: the session is absent from B's list
    await loginAs(page, 'b', '/repair')
    await expect(page.getByText('まだ整えるセッションはありません')).toBeVisible()
  })
})

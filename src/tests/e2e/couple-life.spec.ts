import { expect, test } from '@playwright/test'
import { loginAs, pairCoupleViaUi, resetDemo } from './helpers'

/**
 * The couple-life layer (Coupply-parity): 予定, メモ, ひとことサイン, 周期 —
 * each exercised across BOTH accounts, because every one of these features
 * is a promise about what the other person sees (or must not see).
 */
test.describe('ふたりの予定・メモ・サイン・周期', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('a date one adds counts down on both homes; a memorial keeps its tone', async ({ page }) => {
    await pairCoupleViaUi(page) // ends logged in as B
    await page.goto('/dates')

    // B adds the anniversary
    await page.getByLabel('日付').fill('2020-01-15')
    await page.getByLabel('名前').fill('付き合いはじめた日')
    await page.getByRole('button', { name: '予定に加える' }).click()
    const entry = page.locator('li', { hasText: '付き合いはじめた日' })
    await expect(entry).toBeVisible()
    await expect(entry.getByText(/あと|今日/)).toBeVisible()

    // A sees the same date without doing anything
    await loginAs(page, 'a', '/dates')
    await expect(page.getByText('付き合いはじめた日')).toBeVisible()
  })

  test('a memo travels both ways: B writes, A reads and edits, B sees the edit', async ({
    page,
  }) => {
    await pairCoupleViaUi(page)
    await page.goto('/notes')

    await page.getByLabel('タイトル').fill('週末の買いもの')
    await page.getByLabel('本文').fill('コーヒー豆')
    await page.getByRole('button', { name: 'メモをつくる' }).click()
    await expect(page.getByText('週末の買いもの')).toBeVisible()

    // A opens the same note and adds a line
    await loginAs(page, 'a', '/notes')
    await page.getByText('週末の買いもの').click()
    const body = page.locator('textarea[name="body"]').first()
    await body.fill('コーヒー豆と、はちみつ')
    await page.getByRole('button', { name: '保存する' }).click()

    // ...and B reads the merged note
    await loginAs(page, 'b', '/notes')
    await expect(page.getByText('コーヒー豆と、はちみつ').first()).toBeVisible()
  })

  test('a one-tap sign appears on the partner home — and carries no location', async ({ page }) => {
    await pairCoupleViaUi(page) // logged in as B, on /home
    await page.goto('/home')
    await page.getByRole('button', { name: 'ただいま' }).click()
    await expect(page.getByText(/あなたの最新/)).toBeVisible()

    await loginAs(page, 'a', '/home')
    await expect(page.getByText('「ただいま」')).toBeVisible()
    // the promise is printed right on the card
    await expect(page.getByText('位置情報は使いません。')).toBeVisible()
  })

  test('cycle records stay invisible to the partner until shared, then show only the estimate', async ({
    page,
  }) => {
    await pairCoupleViaUi(page) // logged in as B
    await page.goto('/cycle')

    // B records two starts 28 days apart
    await page.getByLabel('はじまりの日').fill('2026-01-01')
    await page.getByRole('button', { name: '記録する' }).click()
    await page.getByLabel('はじまりの日').fill('2026-01-29')
    await page.getByRole('button', { name: '記録する' }).click()
    await expect(page.getByText(/次のはじまり/).first()).toBeVisible()

    // A sees nothing — not even that records exist
    await loginAs(page, 'a', '/cycle')
    await expect(page.getByText('共有されていません', { exact: false })).toBeVisible()

    // B turns sharing on
    await loginAs(page, 'b', '/cycle')
    await page.getByRole('checkbox', { name: /さんに共有する/ }).click()
    await page.getByRole('button', { name: '変更を保存' }).click()

    // now A sees the estimate — with ごろ, never a verdict
    await loginAs(page, 'a', '/cycle')
    await expect(page.getByText(/ごろ/).first()).toBeVisible()
  })
})

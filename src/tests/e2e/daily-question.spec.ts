import { expect, test } from '@playwright/test'
import {
  loginAs,
  openKnowDeeperStep,
  pairCoupleViaUi,
  resetDemo,
  submitTextAnswer,
} from './helpers'

const SECRET_A = 'テスト回答A_朝のコーヒーの湯気が好きだった'
const SECRET_B = 'テスト回答B_駅で待っていてくれた後ろ姿'

test.describe('今日の質問 (spec §37-2)', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('the daily question is the same for both members', async ({ page }) => {
    await pairCoupleViaUi(page)
    await loginAs(page, 'b', '/home')
    const questionB = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
    await page.goto('/home')
    const cardTextB = await page.locator('main').innerText()
    await loginAs(page, 'a', '/home')
    const cardTextA = await page.locator('main').innerText()
    // extract the quoted question line 「…」 from both home screens
    const q = (s: string) => s.match(/「[^」]+」/)?.[0] ?? ''
    expect(q(cardTextA)).not.toBe('')
    expect(q(cardTextA)).toBe(q(cardTextB))
    expect(questionB).toBeTruthy()
  })

  test('answers hide until both submit, then reveal simultaneously with an AI insight', async ({
    page,
  }) => {
    await pairCoupleViaUi(page)

    // A answers a known free-text question (journey step 1)
    await loginAs(page, 'a', '/home')
    const stepUrl = await openKnowDeeperStep(page)
    await submitTextAnswer(page, SECRET_A)

    // B: A's answer text is NOWHERE in the DOM before B submits (§37-2-3)
    await loginAs(page, 'b', '/home')
    await page.goto(stepUrl)
    expect(await page.content()).not.toContain(SECRET_A)

    // B answers → simultaneous reveal (§37-2-5)
    await submitTextAnswer(page, SECRET_B).catch(async () => {
      // if reveal already happened during submit, the waiting note is skipped
    })
    await page.goto(stepUrl)
    await expect(page.getByText('二人の答えがそろいました')).toBeVisible()
    await expect(page.getByText(SECRET_A).first()).toBeVisible()
    await expect(page.getByText(SECRET_B).first()).toBeVisible()

    // AI insight (mock) is structured and visible (§37-2-6)
    await expect(page.getByText('愛の通訳から、二人へのメッセージ')).toBeVisible()
    await expect(page.getByText('今日できる小さなこと', { exact: false })).toBeVisible()

    // A sees the same reveal
    await loginAs(page, 'a', '/home')
    await page.goto(stepUrl)
    await expect(page.getByText(SECRET_B).first()).toBeVisible()
  })

  test('AI failure still reveals both answers with a retry path (§37-2-7, spec §30)', async ({
    page,
  }) => {
    await pairCoupleViaUi(page)

    await loginAs(page, 'a', '/home')
    const stepUrl = await openKnowDeeperStep(page)
    await submitTextAnswer(page, `[[force-ai-error]] ${SECRET_A}`)

    await loginAs(page, 'b', '/home')
    await page.goto(stepUrl)
    await submitTextAnswer(page, SECRET_B).catch(() => {})
    await page.goto(stepUrl)

    // Reveal is untouched by the AI failure
    await expect(page.getByText('二人の答えがそろいました')).toBeVisible()
    await expect(page.getByText(SECRET_B).first()).toBeVisible()
    // Gentle failure state + regeneration + static conversation guide
    await expect(page.getByText('AIからのメッセージを作成できませんでした')).toBeVisible()
    await expect(page.getByRole('button', { name: 'メッセージを再生成する' })).toBeVisible()
    await expect(page.getByText('ふたりで話すヒント')).toBeVisible()
  })

  test("pre-reveal, the partner's text is absent from B's data export too", async ({ page }) => {
    await pairCoupleViaUi(page)
    await loginAs(page, 'a', '/home')
    await openKnowDeeperStep(page)
    await submitTextAnswer(page, SECRET_A)

    await loginAs(page, 'b', '/home')
    const exportResponse = await page.request.get('/api/export')
    expect(exportResponse.ok()).toBeTruthy()
    expect(await exportResponse.text()).not.toContain(SECRET_A)
  })
})

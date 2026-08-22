import { expect, test } from '@playwright/test'
import {
  loginAs,
  openKnowDeeperStep,
  pairCoupleViaUi,
  resetDemo,
  submitTextAnswer,
} from './helpers'

/**
 * YOU + ME → WE (docs/BRAND.md §0): the reveal is not the end. The AI drafts
 * a third answer that belongs to neither of them, one of them edits it into
 * their own words, and it lands in 私たち — the couple's own record, in place
 * of any compatibility score.
 */
test.describe('NEW WE — 二人だけの答え', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('the third answer is drafted, edited by the couple, and kept as 私たち', async ({ page }) => {
    await pairCoupleViaUi(page)

    await loginAs(page, 'a', '/home')
    const stepUrl = await openKnowDeeperStep(page)
    await submitTextAnswer(page, '一人で静かに過ごす時間がほしい。')

    await loginAs(page, 'b', '/home')
    await page.goto(stepUrl)
    await submitTextAnswer(page, '二人でどこかに出かけたい。').catch(() => {})
    await page.goto(stepUrl)

    // the AI proposes — it never decides
    await expect(page.getByText('二人だけの答えの下書き')).toBeVisible()
    const draft = page.getByLabel('二人の答え')
    await expect(draft).toBeVisible()
    expect((await draft.inputValue()).length).toBeGreaterThan(0)

    // the couple rewrites it in their own words, then keeps it
    await draft.fill('午前はそれぞれの時間、午後は二人で出かける。まず今週だけ試す。')
    await page.getByRole('button', { name: 'これを私たちの答えにする' }).click()
    await expect(page.getByText('この答えは「私たち」に残っています')).toBeVisible()

    // it is theirs: the partner sees the same entry on 私たち
    await loginAs(page, 'a', '/we')
    await expect(page.getByRole('heading', { name: '私たち' })).toBeVisible()
    await expect(page.getByText('午前はそれぞれの時間、午後は二人で出かける。')).toBeVisible()
    await expect(page.getByText('YOU + ME → WE')).toBeVisible()

    // NEW WE counts what they made — never a score out of anything
    await expect(page.getByText(/相性|点$/)).toHaveCount(0)
  })

  test('a difference can be kept as something newly learned about each other', async ({ page }) => {
    await pairCoupleViaUi(page)

    await loginAs(page, 'a', '/home')
    const stepUrl = await openKnowDeeperStep(page)
    await submitTextAnswer(page, '将来は静かな街に住みたい。')
    await loginAs(page, 'b', '/home')
    await page.goto(stepUrl)
    await submitTextAnswer(page, '将来は賑やかな街に住みたい。').catch(() => {})
    await page.goto(stepUrl)

    await page.getByRole('button', { name: '知ったこととして残す' }).first().click()
    await expect(page.getByText('「知ったこと」に残しました')).toBeVisible()

    await page.goto('/we')
    await expect(page.getByText('知ったこと').first()).toBeVisible()
  })
})

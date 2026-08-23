import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'

/**
 * The mark on screen must be the designer's mark — not an approximation of
 * it. The component draws from src/config/mark-geometry.json; this renders
 * that component and the untouched master file side by side at the same
 * size and compares every pixel (docs/BRAND.md §1).
 */
const geometry = JSON.parse(readFileSync('src/config/mark-geometry.json', 'utf8'))

/** The brand tokens, so a standalone page can resolve var(--brand-*). */
const tokens = (() => {
  const css = readFileSync('src/app/globals.css', 'utf8')
  // the dark block is located by its brace, so the @custom-variant line at
  // the top of the file — which also mentions [data-theme='dark'] — is skipped
  const root = css.slice(css.indexOf(':root {'), css.indexOf("[data-theme='dark'] {"))
  return [...root.matchAll(/(--brand-[a-z-]+:\s*#[0-9a-f]{6});/g)].map((m) => m[1]).join(';')
})()

const shell = (body: string) =>
  `<!doctype html><style>:root{${tokens}}html,body{margin:0;background:#fff}` +
  `svg{display:block;width:500px;height:auto}</style>${body}`

test.describe('ブランドマーク', () => {
  test('renders pixel-for-pixel as the master logo file', async ({ page }) => {
    await page.goto('/')
    const rendered = await page.evaluate(() => {
      const svg = [...document.querySelectorAll('svg')].find((s) => s.clientHeight > 40)
      if (!svg) throw new Error('the hero mark was not found')
      return svg.outerHTML
    })

    // the untouched original, re-framed to the component's viewBox
    const { x, y, width, height } = geometry.viewBox
    const master = readFileSync('docs/brand/logo-master.svg', 'utf8')
      .replace('viewBox="0 0 2048 2048"', `viewBox="${x} ${y} ${width} ${height}"`)
      .replace('width="2048" height="2048"', 'width="500"')

    await page.setContent(shell(rendered))
    const ours = PNG.sync.read(await page.locator('svg').screenshot())
    await page.setContent(shell(master))
    const theirs = PNG.sync.read(await page.locator('svg').screenshot())

    expect(ours.width).toBe(theirs.width)
    expect(ours.height).toBe(theirs.height)

    let differing = 0
    for (let i = 0; i < ours.data.length; i += 4) {
      const delta = Math.max(
        Math.abs(ours.data[i] - theirs.data[i]),
        Math.abs(ours.data[i + 1] - theirs.data[i + 1]),
        Math.abs(ours.data[i + 2] - theirs.data[i + 2]),
      )
      if (delta > 8) differing++
    }
    const total = ours.width * ours.height
    expect(
      differing / total,
      `${differing} of ${total} pixels differ from docs/brand/logo-master.svg`,
    ).toBeLessThan(0.001)
  })
})

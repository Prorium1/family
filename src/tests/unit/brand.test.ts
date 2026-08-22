import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Executable brand rulebook (docs/BRAND.md).
 *
 * The design tokens are derived from the logo's measured pixels, so this
 * suite pins them: change a value in globals.css without updating the
 * rulebook and these tests fail. It also proves every rendered pairing
 * clears WCAG AA in both themes — the a11y e2e run then confirms it in a
 * real browser.
 */

const css = readFileSync('src/app/globals.css', 'utf8')

/** Collect every file under the given roots, recursively. */
function walk(roots: string[]): string[] {
  const out: string[] = []
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) visit(full)
      else out.push(full)
    }
  }
  roots.forEach(visit)
  return out
}

// ── color math ──────────────────────────────────────────────────────
function parseHex(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function relativeLuminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = parseHex(hex).map(channel) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

function rgbToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = parseHex(hex).map((v) => v / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = 60 * (((g - b) / d) % 6)
  else if (max === g) h = 60 * ((b - r) / d + 2)
  else h = 60 * ((r - g) / d + 4)
  if (h < 0) h += 360
  return { h, s: s * 100, l: l * 100 }
}

/**
 * Read a token out of a specific theme block of globals.css. The dark block
 * is located by its declaration brace so the `@custom-variant` line at the
 * top of the file — which also mentions [data-theme='dark'] — is skipped.
 */
const LIGHT_START = css.indexOf(':root {')
const DARK_START = css.indexOf("[data-theme='dark'] {")
const THEME_END = css.indexOf('@theme inline')

function token(name: string, theme: 'light' | 'dark' = 'light'): string {
  const block =
    theme === 'light' ? css.slice(LIGHT_START, DARK_START) : css.slice(DARK_START, THEME_END)
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))
  if (!match) throw new Error(`token --${name} not found in ${theme} theme`)
  return match[1].toLowerCase()
}

// ── 1. The logo is the source of truth ──────────────────────────────
describe('brand identity is the logo, measured (docs/BRAND.md §1)', () => {
  it('pins the three colors sampled from the mark', () => {
    expect(token('brand-blue')).toBe('#67aefd')
    expect(token('brand-purple')).toBe('#d5b2e2')
    expect(token('brand-pink')).toBe('#fd7fa2')
  })

  it('keeps the identity colors identical in dark mode — the mark never changes', () => {
    for (const name of ['brand-blue', 'brand-purple', 'brand-pink']) {
      expect(token(name, 'dark')).toBe(token(name))
    }
  })

  it('places the overlap hue between the two people, as the mark does', () => {
    const blue = rgbToHsl(token('brand-blue')).h
    const pink = rgbToHsl(token('brand-pink')).h
    const purple = rgbToHsl(token('brand-purple')).h
    expect(blue).toBeGreaterThan(200)
    expect(blue).toBeLessThan(225)
    expect(pink).toBeGreaterThan(330)
    expect(pink).toBeLessThan(355)
    // the blend must genuinely sit between the two, near their midpoint
    expect(purple).toBeGreaterThan(blue)
    expect(purple).toBeLessThan(pink)
    expect(Math.abs(purple - (blue + pink) / 2)).toBeLessThan(15)
  })

  it('keeps every interactive color on the same hue line as the mark', () => {
    const between = (hex: string, lo: number, hi: number) => {
      const { h } = rgbToHsl(hex)
      expect(h, `${hex} hue ${h.toFixed(0)}°`).toBeGreaterThan(lo)
      expect(h, `${hex} hue ${h.toFixed(0)}°`).toBeLessThan(hi)
    }
    between(token('person-a'), 195, 230) // one person: blue side
    between(token('primary'), 260, 305) // together: the blend
    between(token('person-b'), 330, 360) // the other: pink side
  })
})

// ── 2. Contrast: every pairing the UI actually renders ──────────────
const PAIRINGS: Array<[fg: string, bg: string, min: number]> = [
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surface-muted', 4.5],
  ['text', 'person-a-soft', 4.5],
  ['text', 'person-b-soft', 4.5],
  ['text', 'together-soft', 4.5],
  ['primary', 'together-soft', 4.5],
  ['person-a', 'background', 4.5],
  ['person-b', 'background', 4.5],
  ['text-muted', 'background', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-muted', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'background', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['primary-foreground', 'primary-strong', 4.5],
  // Primary buttons are filled with the logo gradient itself, so the ink
  // must stay readable at every stop of it — see docs/BRAND.md §4.
  ['on-blend', 'brand-blue', 4.5],
  ['on-blend', 'brand-purple', 4.5],
  ['on-blend', 'brand-pink', 4.5],
  ['person-a', 'surface', 4.5],
  ['person-a', 'person-a-soft', 4.5],
  ['person-b', 'surface', 4.5],
  ['person-b', 'person-b-soft', 4.5],
  ['success', 'success-soft', 4.5],
  ['success', 'surface', 4.5],
  ['warning', 'warning-soft', 4.5],
  ['warning', 'surface', 4.5],
  ['danger', 'danger-soft', 4.5],
  ['danger', 'surface', 4.5],
  // non-text UI — WCAG 1.4.11
  ['input', 'surface', 3.0],
  ['ring', 'surface', 3.0],
  ['ring', 'background', 3.0],
]

describe.each(['light', 'dark'] as const)('WCAG AA in %s theme (§2, §7)', (theme) => {
  it.each(PAIRINGS)('%s on %s clears %s:1', (fg, bg, min) => {
    const ratio = contrastRatio(token(fg, theme), token(bg, theme))
    expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min)
  })
})

// ── 3. The identity colors must never become text ───────────────────
describe('identity colors stay decorative on light backgrounds (§2 層1)', () => {
  it('documents that they cannot pass as text — hence the separate ramp', () => {
    for (const name of ['brand-blue', 'brand-purple', 'brand-pink']) {
      expect(contrastRatio(token(name), token('surface'))).toBeLessThan(4.5)
    }
  })

  it('provides an accessible counterpart on the same hue for each', () => {
    expect(contrastRatio(token('person-a'), token('surface'))).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(token('person-b'), token('surface'))).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(token('primary'), token('surface'))).toBeGreaterThanOrEqual(4.5)
  })

  it('is legible on dark surfaces, where the mark may be used directly', () => {
    for (const name of ['brand-blue', 'brand-purple', 'brand-pink']) {
      expect(contrastRatio(token(name, 'dark'), token('surface', 'dark'))).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })
})

// ── 4. Danger must never read as "the partner" ──────────────────────
describe('semantic colors stay distinct from person colors (§2)', () => {
  it('keeps danger far from the partner pink in hue', () => {
    const danger = rgbToHsl(token('danger')).h
    const pink = rgbToHsl(token('brand-pink')).h
    const distance = Math.min(Math.abs(danger - pink), 360 - Math.abs(danger - pink))
    expect(distance, `danger ${danger.toFixed(0)}° vs pink ${pink.toFixed(0)}°`).toBeGreaterThan(20)
  })
})

// ── 5. The gradient vocabulary exists and is bounded ────────────────
describe('gradient utilities (§4)', () => {
  it('defines exactly the three sanctioned gradients', () => {
    for (const name of ['--gradient-blend', '--gradient-ink', '--gradient-wash']) {
      expect(css).toContain(name)
    }
  })

  it('fills .bg-blend with the logo colors themselves, in order', () => {
    const blend = css.match(/--gradient-blend:[^;]+;/)![0]
    const stops = [...blend.matchAll(/var\(--(brand-[a-z]+)\)/g)].map((m) => m[1])
    expect(stops).toEqual(['brand-blue', 'brand-purple', 'brand-pink'])
  })

  it('uses the readable ramp — never the light logo colors — for gradient text', () => {
    const ink = css.match(/--gradient-ink:[^;]+;/)![0]
    expect(ink).not.toMatch(/var\(--brand-/)
    for (const t of ['person-a', 'primary', 'person-b']) {
      expect(ink).toContain(`var(--${t})`)
    }
  })

  it('builds every gradient from tokens, never from raw hex', () => {
    const gradients = css.match(/--gradient-[a-z]+:[^;]+;/g) ?? []
    expect(gradients.length).toBeGreaterThanOrEqual(3)
    for (const g of gradients) {
      expect(g, `${g} must reference tokens`).not.toMatch(/#[0-9a-fA-F]{3,8}/)
    }
  })

  it('exposes them as utilities the components can use', () => {
    for (const utility of ['.bg-blend', '.bg-wash', '.text-blend', '.rule-blend']) {
      expect(css).toContain(utility)
    }
  })
})

// ── 6. Form and motion discipline ───────────────────────────────────
describe('form and motion (§5)', () => {
  it('keeps the corner radius inside the 16–24px band', () => {
    for (const name of ['radius', 'radius-sm', 'radius-lg']) {
      const match = css.match(new RegExp(`--${name}:\\s*([0-9.]+)rem`))
      expect(match, `--${name}`).toBeTruthy()
      const px = Number(match![1]) * 16
      expect(px, `--${name} = ${px}px`).toBeGreaterThanOrEqual(16)
      expect(px, `--${name} = ${px}px`).toBeLessThanOrEqual(24)
    }
  })

  it('honours prefers-reduced-motion for every animation', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
  })

  it('ships only the two sanctioned animations', () => {
    const keyframes = [...css.matchAll(/@keyframes\s+([a-z-]+)/g)].map((m) => m[1])
    expect(keyframes.sort()).toEqual(['gentle-rise', 'lens-breathe'])
  })
})

// ── 7. Components must not hardcode color ───────────────────────────
describe('components consume tokens, never raw color (§7)', () => {
  const files = walk(['src/components', 'src/features', 'src/app']).filter((f) =>
    f.endsWith('.tsx'),
  )

  it('finds the component tree', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it('contains no hardcoded hex colors outside globals.css', () => {
    const offenders: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      // theme-color meta tags legitimately need literal values
      const stripped = source.replace(/themeColor[\s\S]*?\]/g, '')
      const hits = stripped.match(/#[0-9a-fA-F]{6}\b/g)
      if (hits) offenders.push(`${file}: ${hits.join(', ')}`)
    }
    expect(offenders).toEqual([])
  })

  it('contains no raw tailwind palette colors (bg-blue-500 etc.)', () => {
    const offenders: string[] = []
    const banned =
      /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
    for (const file of files) {
      const hits = readFileSync(file, 'utf8').match(banned)
      if (hits) offenders.push(`${file}: ${[...new Set(hits)].join(', ')}`)
    }
    expect(offenders).toEqual([])
  })
})

// ── 8. White must never be placed on the light logo gradient ────────
describe('the blend carries dark ink, never white (§4)', () => {
  const files = walk(['src/components', 'src/features', 'src/app']).filter((f) =>
    f.endsWith('.tsx'),
  )

  it('pairs every bg-blend with text-on-blend', () => {
    const offenders: string[] = []
    for (const file of files) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!line.includes('bg-blend')) continue
        if (line.includes('text-white') || line.includes('text-primary-foreground')) {
          offenders.push(`${file}: ${line.trim()}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

// ── 9. Gender picks an entry color, never a content color ──────────
describe('gender never decides a person’s color (§3.1)', () => {
  const files = walk(['src/components', 'src/features', 'src/app']).filter((f) =>
    f.endsWith('.tsx'),
  )

  it('keeps the gender → color map in exactly one module', () => {
    const map = readFileSync('src/lib/ui/gender.ts', 'utf8')
    expect(map).toContain('bg-brand-blue')
    expect(map).toContain('bg-brand-pink')
  })

  it('always offers a third option — the two circles are not a binary', () => {
    const map = readFileSync('src/lib/ui/gender.ts', 'utf8')
    const values = [...map.matchAll(/value:\s*'([a-z_]+)'/g)].map((m) => m[1])
    expect(values.length).toBeGreaterThanOrEqual(3)
  })

  it('never derives the person colors from gender in a component', () => {
    const offenders: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (!/gender/i.test(line)) return
          if (/-person-[ab]\b/.test(line)) offenders.push(`${file}:${i + 1} ${line.trim()}`)
        })
    }
    expect(offenders).toEqual([])
  })

  it('carries dark ink on every solid brand fill, exactly as the gradient does', () => {
    const offenders: string[] = []
    for (const file of [...files, 'src/lib/ui/gender.ts', 'src/components/ui/button.tsx']) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!/bg-brand-(?:blue|purple|pink)\b/.test(line)) continue
        if (!line.includes('text-on-blend')) offenders.push(`${file}: ${line.trim()}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

// ── 10. Copy must not assume a gender (§6) ──────────────────────────
describe('the words never assume who the partner is (§6)', () => {
  it('calls them パートナー — never 彼氏/彼女/旦那/奥さん', () => {
    const files = walk(['src/components', 'src/features', 'src/app']).filter((f) =>
      f.endsWith('.tsx'),
    )
    const banned = /彼氏|彼女|旦那|奥さん|ご主人/
    const offenders = files.filter((f) => banned.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})

// ── 11. The rulebook itself must stay in the repo ───────────────────
describe('the rulebook is present and linked (§8)', () => {
  it('ships docs/BRAND.md', () => {
    const doc = readFileSync('docs/BRAND.md', 'utf8')
    expect(doc).toContain('#67AEFD')
    expect(doc).toContain('#D5B2E2')
    expect(doc).toContain('#FD7FA2')
  })

  it('is pointed to from the agent instructions so every session loads it', () => {
    const agents = readFileSync('AGENTS.md', 'utf8')
    expect(agents).toContain('docs/BRAND.md')
  })
})

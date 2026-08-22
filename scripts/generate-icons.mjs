/**
 * Zero-dependency PNG icon generator.
 *
 * Redraws the brand mark — two translucent circles overlapping into a lens —
 * using the exact values measured from the logo (see docs/BRAND.md §1), so
 * the installed PWA icon and the in-app design tokens can never drift apart.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

// Measured from the logo. Keep in sync with globals.css and docs/BRAND.md.
const BLUE = [0x67, 0xae, 0xfd]
const PINK = [0xfd, 0x7f, 0xa2]
const PURPLE = [0xd5, 0xb2, 0xe2] // the measured overlap — the lens
const CARD = [0xff, 0xff, 0xff]

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Multiply-blend an ink over a base, at the given coverage. */
function over(base, ink, alpha) {
  return base.map((b, i) => Math.round(b * (1 - alpha) + ((b * ink[i]) / 255) * alpha))
}

/** Linear interpolation between two inks. */
function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t))
}

/** Antialiased coverage of a stroked ring / filled disc at one pixel. */
function coverage(distance, radius, halfWidth, aa) {
  if (halfWidth === null) {
    // filled disc
    return Math.min(1, Math.max(0, (radius - distance) / aa + 0.5))
  }
  const edge = Math.abs(distance - radius)
  return Math.min(1, Math.max(0, (halfWidth - edge) / aa + 0.5))
}

function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const corner = maskable ? 0 : size * 0.22
  // maskable icons must survive a circular crop, so the mark sits smaller
  const scale = maskable ? 0.76 : 1
  // geometry measured from the logo: the circles overlap by ~18% of the width
  const r = size * 0.211 * scale
  const cy = size * 0.5
  const cx1 = size * 0.5 - r * 0.578
  const cx2 = size * 0.5 + r * 0.578
  const stroke = Math.max(1.5, size * 0.021 * scale)
  const aa = 1.1

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const px = x + 0.5
      const py = y + 0.5

      // rounded-rect card
      const dx = Math.max(corner - px, px - (size - corner), 0)
      const dy = Math.max(corner - py, py - (size - corner), 0)
      const inCard = maskable
        ? 1
        : Math.min(1, Math.max(0, (corner - Math.hypot(dx, dy)) / aa + 0.5))
      if (inCard <= 0) {
        rgba[i + 3] = 0
        continue
      }

      let color = CARD.slice()
      const d1 = Math.hypot(px - cx1, py - cy)
      const d2 = Math.hypot(px - cx2, py - cy)

      // Only the lens is tinted: the circles themselves stay open, exactly
      // as in the mark. What the two share is the only thing with color.
      const lens = Math.min(coverage(d1, r, null, aa), coverage(d2, r, null, aa))
      color = over(color, PURPLE, lens)

      // Both outlines are drawn from one gradient that runs across the
      // whole mark, so each circle turns violet exactly where it enters the
      // other — the blend happens on the strokes too, as in the logo.
      const t = Math.min(1, Math.max(0, (px - (cx1 - r)) / (2 * r + (cx2 - cx1))))
      const ink = lerp(BLUE, PINK, t)
      color = over(color, ink, coverage(d1, r, stroke / 2, aa))
      color = over(color, ink, coverage(d2, r, stroke / 2, aa))

      rgba[i] = color[0]
      rgba[i + 1] = color[1]
      rgba[i + 2] = color[2]
      rgba[i + 3] = Math.round(255 * inCard)
    }
  }
  return encodePng(size, size, rgba)
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', drawIcon(192))
writeFileSync('public/icons/icon-512.png', drawIcon(512))
writeFileSync('public/icons/icon-maskable-512.png', drawIcon(512, { maskable: true }))
writeFileSync('public/icons/apple-touch-icon.png', drawIcon(180, { maskable: true }))
writeFileSync('src/app/icon.png', drawIcon(192))
console.log('icons written from the measured brand values')

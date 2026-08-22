/**
 * Zero-dependency PNG icon generator.
 *
 * Redraws the brand mark — two golden-ratio circles with a head above each,
 * overlapping into a lens — from the two files that already define it:
 *
 *   src/config/mark-geometry.json   every coordinate (docs/BRAND.md §1.1)
 *   src/app/globals.css             the five colors of the gradient
 *
 * Nothing is re-typed here, so the installed PWA icon, the in-app mark and
 * the design tokens cannot drift apart.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'

const geometry = JSON.parse(readFileSync('src/config/mark-geometry.json', 'utf8'))
const {
  radius,
  centerLeftX,
  centerRightX,
  centerY,
  headRadius,
  headCenterY,
  strokeWidth,
  gradientX1,
  gradientX2,
  viewBox,
} = geometry

/** Read a brand color out of globals.css so this file never restates one. */
const css = readFileSync('src/app/globals.css', 'utf8')
function brand(name) {
  const hex = css.slice(css.indexOf(':root {')).match(new RegExp(`--${name}:\\s*#([0-9a-f]{6})`))
  if (!hex) throw new Error(`--${name} not found in globals.css`)
  return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16))
}

// The mark's gradient: five stops, evenly spaced, no seam.
const STOPS = [
  [0.0, brand('brand-blue')],
  [0.3, brand('brand-blue-violet')],
  [0.5, brand('brand-purple')],
  [0.7, brand('brand-magenta')],
  [1.0, brand('brand-pink')],
]
const HEAD_LEFT = brand('brand-blue')
const HEAD_RIGHT = brand('brand-pink')
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

/** Paint an opaque ink over a base at the given coverage, as SVG does. */
function over(base, ink, alpha) {
  if (alpha <= 0) return base
  return base.map((b, i) => Math.round(b + (ink[i] - b) * Math.min(1, alpha)))
}

/** The gradient color at one point of the mark's own x axis. */
function blendAt(x) {
  const t = Math.min(1, Math.max(0, (x - gradientX1) / (gradientX2 - gradientX1)))
  for (let i = 1; i < STOPS.length; i++) {
    const [t0, c0] = STOPS[i - 1]
    const [t1, c1] = STOPS[i]
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0)
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k))
    }
  }
  return STOPS[STOPS.length - 1][1]
}

/** Antialiased coverage of a filled disc at one sample point. */
function disc(distance, r, aa) {
  return Math.min(1, Math.max(0, (r - distance) / aa + 0.5))
}

/** Antialiased coverage of a stroked ring at one sample point. */
function ring(distance, r, halfWidth, aa) {
  return Math.min(1, Math.max(0, (halfWidth - Math.abs(distance - r)) / aa + 0.5))
}

function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const corner = maskable ? 0 : size * 0.22
  // A maskable icon must survive a circular crop: the mark's bounding box
  // has to fit inside the 80% safe circle, diagonal and all.
  const target = maskable
    ? (0.8 * size) / Math.hypot(1, viewBox.height / viewBox.width)
    : size * 0.78
  const scale = target / viewBox.width
  const offsetX = (size - viewBox.width * scale) / 2
  const offsetY = (size - viewBox.height * scale) / 2
  // antialias over roughly one device pixel, expressed in mark units
  const aa = 1.1 / scale

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
        : Math.min(1, Math.max(0, (corner - Math.hypot(dx, dy)) / 1.1 + 0.5))
      if (inCard <= 0) {
        rgba[i + 3] = 0
        continue
      }

      // this pixel, in the mark's own coordinates
      const mx = viewBox.x + (px - offsetX) / scale
      const my = viewBox.y + (py - offsetY) / scale
      const ink = blendAt(mx)

      let color = CARD.slice()
      const d1 = Math.hypot(mx - centerLeftX, my - centerY)
      const d2 = Math.hypot(mx - centerRightX, my - centerY)

      // The lens — the exact intersection of the two discs — is the only
      // filled part of the pair: what the two share is what carries color.
      color = over(color, ink, Math.min(disc(d1, radius, aa), disc(d2, radius, aa)))

      // Both outlines come from the one gradient, so each circle turns
      // violet exactly where it enters the other, as in the logo.
      const half = strokeWidth / 2
      color = over(color, ink, ring(d1, radius, half, aa))
      color = over(color, ink, ring(d2, radius, half, aa))

      // The heads are solid — each person is themselves, not a blend.
      const h1 = Math.hypot(mx - centerLeftX, my - headCenterY)
      const h2 = Math.hypot(mx - centerRightX, my - headCenterY)
      color = over(color, HEAD_LEFT, disc(h1, headRadius, aa))
      color = over(color, HEAD_RIGHT, disc(h2, headRadius, aa))

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
console.log('icons written from src/config/mark-geometry.json + globals.css')

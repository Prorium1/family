/**
 * Zero-dependency PNG icon generator. Draws the app mark (two overlapping
 * soft circles on a coral field) into raw RGBA buffers and encodes minimal
 * PNGs, so the repo needs no image tooling or network access.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CORAL = [168, 80, 66]
const IVORY = [250, 246, 239]
const SAGE = [231, 239, 230]

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

function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4)
  const radius = maskable ? 0 : size * 0.22
  const cx1 = size * 0.38
  const cy = size * 0.5
  const cx2 = size * 0.62
  const r = size * (maskable ? 0.16 : 0.19)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      // rounded-rect field
      const dx = Math.max(radius - x, x - (size - 1 - radius), 0)
      const dy = Math.max(radius - y, y - (size - 1 - radius), 0)
      const inField = Math.hypot(dx, dy) <= radius
      if (!inField && !maskable) {
        rgba[i + 3] = 0
        continue
      }
      let [cr, cg, cb] = CORAL
      const d1 = Math.hypot(x - cx1, y - cy)
      const d2 = Math.hypot(x - cx2, y - cy)
      if (d1 <= r && d2 <= r) [cr, cg, cb] = SAGE
      else if (d1 <= r || d2 <= r) [cr, cg, cb] = IVORY
      rgba[i] = cr
      rgba[i + 1] = cg
      rgba[i + 2] = cb
      rgba[i + 3] = 255
    }
  }
  return encodePng(size, size, rgba)
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', drawIcon(192))
writeFileSync('public/icons/icon-512.png', drawIcon(512))
writeFileSync('public/icons/icon-maskable-512.png', drawIcon(512, { maskable: true }))
writeFileSync('public/icons/apple-touch-icon.png', drawIcon(180, { maskable: true }))
console.log('icons written')

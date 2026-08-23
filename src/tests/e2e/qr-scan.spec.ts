import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test } from '@playwright/test'
import { PNG } from 'pngjs'
import QRCode from 'qrcode'
import { loginAs, onboardIfNeeded, resetDemo } from './helpers'

/**
 * The in-app scanner, exercised the way it is actually used: a second phone
 * is held up to the first one's screen.
 *
 * Chromium can be handed a video file as its camera, so this test builds a
 * real one — the invitation's own QR code, encoded frame by frame as raw
 * Y4M — and lets the app's scanner read it. Nothing here is stubbed: the
 * component runs its own decode loop against genuine camera frames.
 */

/** Encode an RGBA image as a one-second Y4M clip Chromium can play back. */
function writeFakeCameraVideo(png: PNG, path: string, frames = 30) {
  const { width, height, data } = png
  // Y4M wants even dimensions for 4:2:0 chroma
  const w = width - (width % 2)
  const h = height - (height % 2)
  const luma = Buffer.alloc(w * h)
  const cb = Buffer.alloc((w / 2) * (h / 2))
  const cr = Buffer.alloc((w / 2) * (h / 2))

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * width + x) * 4
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
      luma[y * w + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      if (y % 2 === 0 && x % 2 === 0) {
        const c = (y / 2) * (w / 2) + x / 2
        cb[c] = Math.round(128 - 0.168736 * r - 0.331264 * g + 0.5 * b)
        cr[c] = Math.round(128 + 0.5 * r - 0.418688 * g - 0.081312 * b)
      }
    }
  }

  const header = Buffer.from(`YUV4MPEG2 W${w} H${h} F30:1 Ip A1:1 C420jpeg\n`, 'ascii')
  const frame = Buffer.concat([Buffer.from('FRAME\n', 'ascii'), luma, cb, cr])
  writeFileSync(path, Buffer.concat([header, ...Array.from({ length: frames }, () => frame)]))
}

test.describe('カメラでQRを読み取って、その場でつながる', () => {
  test.beforeEach(async ({ request }) => {
    await resetDemo(request)
  })

  test('the partner scans the code with the in-app camera and the two are paired', async ({
    page,
    baseURL,
  }) => {
    // One person registers; the invitation is on screen without being asked for
    await loginAs(page, 'a', '/onboarding')
    await onboardIfNeeded(page, { name: 'ゆき', gender: '女性' })
    await page.waitForURL(/\/pair/)
    await expect(page.getByTestId('waiting-for-partner')).toBeVisible()
    const inviteUrl = (await page.getByTestId('invite-url').textContent())!.trim()
    expect(inviteUrl).toContain('/join/')

    // Build the camera the partner's phone will "see": that same invitation,
    // as a QR code, filling the frame — 640×640 of real video.
    const qrPng = await QRCode.toBuffer(inviteUrl, {
      type: 'png',
      width: 640,
      margin: 4,
      errorCorrectionLevel: 'H',
    })
    const videoPath = join(mkdtempSync(join(tmpdir(), 'qr-cam-')), 'invite.y4m')
    writeFakeCameraVideo(PNG.sync.read(qrPng), videoPath)

    // A second device, whose camera is that video
    const browserB = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        `--use-file-for-fake-video-capture=${videoPath}`,
      ],
    })
    try {
      const contextB = await browserB.newContext({ baseURL, permissions: ['camera'] })
      const pageB = await contextB.newPage()
      await loginAs(pageB, 'b', '/onboarding')
      await onboardIfNeeded(pageB, { name: 'はると', gender: '男性' })
      await pageB.waitForURL(/\/pair/)

      // Everything from here is what a person does: one tap, hold it up.
      await pageB.getByTestId('scan-open').click()
      await expect(pageB.getByRole('dialog')).toBeVisible()

      // The scan alone completes the pairing — no confirm step
      await pageB.waitForURL(/\/home/, { timeout: 30_000 })
      await expect(pageB.getByText('ゆき')).toBeVisible()

      // …and the inviter's screen leaves the waiting state by itself
      await page.waitForURL(/\/home/, { timeout: 30_000 })
      await expect(page.getByText('はると')).toBeVisible()

      await contextB.close()
    } finally {
      await browserB.close()
    }
  })
})

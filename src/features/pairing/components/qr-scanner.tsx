'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, CameraOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { looksLikeInviteSecret, normalizeInviteSecret } from '@/lib/pairing/invite-secret'

/**
 * Read the partner's QR code with the camera, right here on the pairing
 * screen (spec §7). Sitting side by side is the most common way two people
 * start, and it should not require leaving the app for a camera app.
 *
 * The frames never leave the device: each one is drawn to an off-screen
 * canvas and decoded in this browser — first with the platform's own
 * BarcodeDetector where it exists, otherwise with jsQR. Nothing is uploaded
 * and nothing is stored (docs/SECURITY.md §6). The camera is released the
 * moment this closes, whichever way it closes.
 */
type ScanState = 'idle' | 'starting' | 'scanning' | 'denied' | 'unavailable'

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>
}

function getDetector(): BarcodeDetectorLike | null {
  const ctor = (
    globalThis as unknown as {
      BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike
    }
  ).BarcodeDetector
  if (!ctor) return null
  try {
    return new ctor({ formats: ['qr_code'] })
  } catch {
    return null
  }
}

export function QrScanner({ onResult }: { onResult: (secret: string) => void }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ScanState>('idle')
  const [ignored, setIgnored] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const doneRef = useRef(false)

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  // Whatever happens — a scan, the close button, a route change — the camera
  // must be handed back. This is the only place that owns that promise.
  useEffect(() => stop, [stop])

  // Opening and closing are events, so the state they change is set there —
  // the effect below only owns the camera itself.
  const openScanner = () => {
    doneRef.current = false
    setIgnored(false)
    setState('starting')
    setOpen(true)
  }

  // stable, so listing it as a dependency below cannot restart the camera
  const closeScanner = useCallback(() => {
    stop()
    setOpen(false)
    setState('idle')
    setIgnored(false)
  }, [stop])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const detector = getDetector()

    const accept = (raw: string) => {
      if (doneRef.current) return
      // A QR code in the wild may be anything at all; only act on ours.
      if (!looksLikeInviteSecret(raw)) {
        setIgnored(true)
        return
      }
      doneRef.current = true
      closeScanner()
      onResult(normalizeInviteSecret(raw))
    }

    const tick = async () => {
      const video = videoRef.current
      if (cancelled || doneRef.current || !video || !context) return
      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        try {
          if (detector) {
            const [found] = await detector.detect(canvas)
            if (found?.rawValue) return accept(found.rawValue)
          } else {
            const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height)
            const found = jsQR(data, width, height, { inversionAttempts: 'dontInvert' })
            if (found?.data) return accept(found.data)
          }
        } catch {
          /* a single unreadable frame is normal — keep looking */
        }
      }
      if (!cancelled && !doneRef.current) frameRef.current = requestAnimationFrame(tick)
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unavailable')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        setState('scanning')
        frameRef.current = requestAnimationFrame(tick)
      } catch (error) {
        if (cancelled) return
        const name = error instanceof DOMException ? error.name : ''
        setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
      }
    }

    void start()
    return () => {
      cancelled = true
      stop()
    }
  }, [open, onResult, stop, closeScanner])

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? openScanner() : closeScanner())}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={openScanner}
        data-testid="scan-open"
      >
        <Camera className="size-4" aria-hidden="true" />
        QRを読み取る
      </Button>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>パートナーのQRコードを読み取る</DialogTitle>
          <DialogDescription>
            相手の画面に出ているQRコードを、枠の中に入れてください。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-card bg-surface-muted relative aspect-square overflow-hidden">
          <video
            ref={videoRef}
            className="size-full object-cover"
            playsInline
            muted
            autoPlay
            aria-label="カメラの映像"
          />
          {state === 'scanning' ? (
            // the lens of the mark, as a viewfinder
            <div
              className="animate-lens-breathe rounded-card border-primary pointer-events-none absolute inset-8 border-2"
              aria-hidden="true"
            />
          ) : null}
          {state === 'denied' || state === 'unavailable' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <CameraOff className="text-text-muted size-5" aria-hidden="true" />
              <p className="text-text-muted text-sm" role="status">
                {state === 'denied'
                  ? 'カメラの使用が許可されていません。ブラウザの設定から許可するか、下のコード入力をお使いください。'
                  : 'このブラウザではカメラを使えません。下のコード入力をお使いください。'}
              </p>
            </div>
          ) : null}
        </div>

        <p className="text-text-muted text-xs" role="status">
          {state === 'starting' ? 'カメラを起動しています…' : null}
          {state === 'scanning' && !ignored
            ? '映像はこの端末の中だけで読み取られ、送信も保存もされません。'
            : null}
          {ignored
            ? '招待用のQRコードではないようです。相手の招待画面のQRコードを映してください。'
            : null}
        </p>
      </DialogContent>
    </Dialog>
  )
}

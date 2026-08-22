'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Gentle server-state polling for the two "waiting for my partner" moments
 * (pairing, answer reveal). The screen updates by itself the instant the
 * partner acts — nobody is ever told to reload the page. Polling stops
 * after 10 minutes to stay battery-friendly.
 */
export function AutoRefresh({
  intervalMs = 4000,
  enabled = true,
}: {
  intervalMs?: number
  enabled?: boolean
}) {
  const router = useRouter()
  useEffect(() => {
    if (!enabled) return
    const tick = setInterval(() => router.refresh(), intervalMs)
    const stop = setTimeout(() => clearInterval(tick), 10 * 60_000)
    return () => {
      clearInterval(tick)
      clearTimeout(stop)
    }
  }, [enabled, intervalMs, router])
  return null
}

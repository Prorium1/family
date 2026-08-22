'use client'

import { useEffect, useState } from 'react'

/**
 * Registers the app-shell service worker in production and surfaces a gentle
 * refresh prompt when a new version is waiting (spec §21 アプリ更新通知).
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    let cancelled = false
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          installing?.addEventListener('statechange', () => {
            if (
              !cancelled &&
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true)
            }
          })
        })
      })
      .catch(() => {
        /* PWA is progressive enhancement — never break the app */
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!updateReady) return null
  return (
    <div className="fixed inset-x-0 bottom-16 z-50 mx-auto w-fit rounded-full border border-border bg-surface px-4 py-2 text-xs shadow-card md:bottom-6">
      新しいバージョンがあります{' '}
      <button className="font-semibold text-primary underline" onClick={() => location.reload()}>
        更新する
      </button>
    </div>
  )
}

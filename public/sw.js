/**
 * App-shell service worker (spec §21).
 *
 * PRIVACY CONTRACT: intimate content is NEVER cached. Only the offline page,
 * icons and hashed static assets enter any cache. Every HTML navigation and
 * every /api request goes network-only; navigation failure falls back to the
 * offline page. Answer text, AI insights and repair sessions therefore never
 * touch Cache Storage.
 */
const CACHE_VERSION = 'v1'
const SHELL_CACHE = `shell-${CACHE_VERSION}`
const STATIC_CACHE = `static-${CACHE_VERSION}`
const OFFLINE_URL = '/offline'

const SHELL_ASSETS = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Network-only for APIs and any HTML navigation — never cached.
  if (url.pathname.startsWith('/api/')) return
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    )
    return
  }

  // Cache-first for immutable build assets and icons only.
  const cacheable =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')
  if (!cacheable) return

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})

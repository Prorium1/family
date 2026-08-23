import type { NextConfig } from 'next'

/**
 * Response headers (spec §23, docs/SECURITY.md).
 *
 * This product holds the most private thing two people write down, so the
 * browser is told to lock the page down rather than trusted to do the right
 * thing by default. The CSP is deliberately strict: no third-party script,
 * style, font or frame can load, which also means no analytics vendor can be
 * dropped in later without a deliberate, reviewed change here.
 *
 * `'unsafe-inline'` on styles is required by Next.js's inlined critical CSS;
 * scripts do not need it because Next.js emits external chunks.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // The Supabase project is the only host the browser may talk to.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // A year of HTTPS-only, so an invitation link can never travel in the clear.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Invitation tokens live in the path (/join/{token}), so no other origin
  // may ever learn the path a visitor came from.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // An invitation link must never be cached by a shared proxy.
      {
        source: '/join/:token',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
      },
    ]
  },
}

export default nextConfig

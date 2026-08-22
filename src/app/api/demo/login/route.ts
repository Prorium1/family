import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/config/env'
import { DEMO_COOKIE, demoUserByKey } from '@/lib/auth/demo-users'

/** Demo-only login: sets the persona cookie and redirects. 404 outside demo mode. */
export async function GET(request: NextRequest) {
  if (!isDemoMode) return new NextResponse(null, { status: 404 })
  const key = request.nextUrl.searchParams.get('user') ?? ''
  const user = demoUserByKey(key)
  if (!user) return new NextResponse('unknown demo user', { status: 400 })
  const next = request.nextUrl.searchParams.get('next') ?? '/home'
  const target = next.startsWith('/') ? next : '/home'
  // Redirect on the host the browser actually used (127.0.0.1 vs localhost
  // are different cookie origins) so the freshly set cookie survives.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const response = NextResponse.redirect(`${proto}://${host}${target}`, 303)
  response.cookies.set(DEMO_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}

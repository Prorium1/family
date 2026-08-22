import { NextResponse } from 'next/server'
import { isDemoMode } from '@/config/env'
import { resetDemoStore } from '@/server/repositories/demo/store'

/** Demo-only world reset for e2e isolation. 404 outside demo mode. */
export async function POST() {
  if (!isDemoMode) return new NextResponse(null, { status: 404 })
  resetDemoStore()
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { exportUserData } from '@/server/services/settings-service'

/**
 * Personal data export (spec §33-18). Auth comes from the session cookie;
 * the service applies the reveal rules, so a partner's unrevealed answers
 * can never appear in the payload.
 */
export async function GET() {
  const session = await getSession()
  if (!session) return new NextResponse(null, { status: 401 })
  const data = await exportUserData(session.userId)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="my-data-export.json"',
    },
  })
}

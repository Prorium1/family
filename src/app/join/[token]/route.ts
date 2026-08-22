import { NextResponse, type NextRequest } from 'next/server'
import { peekInvitation } from '@/server/services/pairing-service'
import { storeInviteToken } from '@/lib/auth/invite-cookie'

/**
 * The invitation link's front door. A partner taps the link their person
 * sent, the token moves into an httpOnly cookie, and they land on /welcome —
 * from there, registration flows straight into automatic pairing without
 * ever retyping a code (spec §7).
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<'/join/[token]'>,
) {
  const { token } = await context.params
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'

  const invitation = await peekInvitation(token)
  if (!invitation) {
    return NextResponse.redirect(`${proto}://${host}/welcome?invalid=1`, 303)
  }
  await storeInviteToken(token)
  return NextResponse.redirect(`${proto}://${host}/welcome`, 303)
}

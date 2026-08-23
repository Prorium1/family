import 'server-only'
import { cookies } from 'next/headers'

/**
 * The invite token travels from the /join link to the moment onboarding
 * completes inside an httpOnly cookie, so a brand-new partner can register
 * without ever retyping anything — tap the link, sign up, and the pairing
 * happens automatically (spec §7, activation flow).
 */
const INVITE_COOKIE = 'family_invite'

export async function storeInviteToken(rawToken: string): Promise<void> {
  const store = await cookies()
  store.set(INVITE_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30, // the walk from link-tap to onboarding is minutes, not days
  })
}

export async function readInviteToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(INVITE_COOKIE)?.value ?? null
}

export async function clearInviteToken(): Promise<void> {
  const store = await cookies()
  store.delete(INVITE_COOKIE)
}

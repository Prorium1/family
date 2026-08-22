import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isDemoMode } from '@/config/env'
import type { SessionDTO } from '@/types/dto'
import { getRepositories } from '@/server/repositories'
import { DEMO_COOKIE, demoUserById } from './demo-users'

/**
 * Session resolution. Demo mode: an httpOnly cookie selects one of the demo
 * personas. Supabase mode: the auth cookie session. Either way the rest of
 * the app sees one `SessionDTO`, and authorization always re-derives the
 * user here — client-supplied ids are never trusted for identity.
 */
export async function getSession(): Promise<SessionDTO | null> {
  if (isDemoMode) {
    const cookieStore = await cookies()
    const userId = cookieStore.get(DEMO_COOKIE)?.value
    if (!userId || !demoUserById(userId)) return null
    return buildSession(userId)
  }
  return getSupabaseSession()
}

async function getSupabaseSession(): Promise<SessionDTO | null> {
  const { createSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return buildSession(user.id)
}

async function buildSession(userId: string): Promise<SessionDTO | null> {
  const repos = getRepositories()
  const profile = await repos.profiles.getById(userId)
  if (!profile) return null
  const membership = await repos.couples.getForUser(userId)
  const consents = await repos.consents.list(userId)
  const onboarded = consents.some((c) => c.kind === 'terms' && c.granted)
  return {
    userId: profile.id,
    displayName: profile.displayName,
    coupleId: membership?.couple.id ?? null,
    isAdmin: profile.isAdmin,
    onboarded,
  }
}

export async function requireSession(): Promise<SessionDTO> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireOnboardedSession(): Promise<SessionDTO> {
  const session = await requireSession()
  if (!session.onboarded) redirect('/onboarding')
  return session
}

export async function requireCoupleSession(): Promise<SessionDTO & { coupleId: string }> {
  const session = await requireOnboardedSession()
  if (!session.coupleId) redirect('/pair')
  return session as SessionDTO & { coupleId: string }
}

export async function requireAdminSession(): Promise<SessionDTO> {
  const session = await requireSession()
  if (!session.isAdmin) redirect('/home')
  return session
}

import { NextResponse, type NextRequest } from 'next/server'
import { getRepositories } from '@/server/repositories'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Magic-link landing: exchange the code for a session, make sure a profile
 * row exists, and continue into onboarding — where a stored /join invite
 * token turns straight into a pairing.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const origin = `${proto}://${host}`

  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/login?error=link`, 303)

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/login?error=link`, 303)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const email = user.email ?? ''
    await getRepositories().profiles.ensure(user.id, {
      displayName: email.split('@')[0] || 'あなた',
      email,
    })
  }
  return NextResponse.redirect(`${origin}/onboarding`, 303)
}

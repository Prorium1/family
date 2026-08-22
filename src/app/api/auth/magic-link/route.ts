import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { hasSupabaseConfig, isDemoMode } from '@/config/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { GENDERS } from '@/types/domain'

/**
 * Passwordless entry (spec §5): one email field, one tap. The link in the
 * mail lands on /auth/callback with a live session — and if the user came
 * from an invitation, pairing completes automatically right after.
 */
export async function POST(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const origin = `${proto}://${host}`

  const form = await request.formData()
  const from = form.get('from') === 'welcome' ? '/welcome' : form.get('from') === 'signup' ? '/signup' : '/login'
  const back = (query: string) => NextResponse.redirect(`${origin}${from}?${query}`, 303)

  if (isDemoMode || !hasSupabaseConfig) return back('error=unconfigured')

  const email = z.string().email().safeParse(String(form.get('email') ?? '').trim())
  if (!email.success) return back('error=email')

  // The entry already asked 男性 / 女性 — carry it to onboarding so the
  // question is asked once, not twice.
  const gender = GENDERS.find((g) => g === form.get('gender'))
  const callback = `${origin}/auth/callback${gender ? `?gender=${gender}` : ''}`

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: callback },
  })
  if (error) return back('error=send_failed')
  return back('sent=1')
}

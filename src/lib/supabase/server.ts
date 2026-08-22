import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { publicEnv } from '@/config/env'

/** Server client bound to the request's auth cookies (anon key + RLS). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component — safe to ignore, the proxy
            // session refresh handles cookie writes.
          }
        },
      },
    },
  )
}

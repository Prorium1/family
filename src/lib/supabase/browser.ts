'use client'

import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/config/env'

/** Browser client — anon key only; RLS is the security boundary. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

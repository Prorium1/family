import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/config/env'
import { serverEnv } from '@/config/server-env'

/**
 * Service-role client. SERVER ONLY (spec §5, §23) — used exclusively for
 * jobs that must bypass RLS deliberately (metadata logging, admin content
 * management). Never import this from anything a client component touches.
 */
export function createSupabaseAdminClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

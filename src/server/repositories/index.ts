import 'server-only'
import { isDemoMode, hasSupabaseConfig } from '@/config/env'
import type { Repositories } from './repository-types'
import { demoRepositories } from './demo'

/**
 * Driver selection. Demo mode (or missing Supabase config) uses the
 * in-memory driver; a configured Supabase project switches to the SQL driver.
 * Everything above this barrel is driver-agnostic.
 */
export function getRepositories(): Repositories {
  if (isDemoMode || !hasSupabaseConfig) return demoRepositories
  // Lazy import keeps the supabase client out of the demo bundle entirely.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { supabaseRepositories } = require('./supabase') as {
    supabaseRepositories: Repositories
  }
  return supabaseRepositories
}

export type { Repositories } from './repository-types'

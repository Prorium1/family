import 'server-only'
import type { Repositories } from '../repository-types'
import { createSupabaseRepositories } from './driver'

/**
 * Supabase driver entry. Selected only when NEXT_PUBLIC_DEMO_MODE=false and
 * Supabase credentials are configured (see ../index.ts).
 */
export const supabaseRepositories: Repositories = createSupabaseRepositories()

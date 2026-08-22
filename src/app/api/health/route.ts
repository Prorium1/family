import { NextResponse } from 'next/server'
import { hasSupabaseConfig, isDemoMode } from '@/config/env'
import { serverEnv } from '@/config/server-env'

export const dynamic = 'force-dynamic'

/**
 * Launch readiness, in one request (docs/LAUNCH.md).
 *
 * It answers the only three questions that matter after a deploy: which mode
 * the app is really running in, whether the database is actually reachable
 * from this environment, and whether the AI is mocked. It exposes no
 * secrets, no counts and no user data — the database probe is the anonymous
 * invitation preview with a hash that matches nothing, so a healthy answer
 * is an empty answer.
 */
export async function GET() {
  const mode = isDemoMode ? 'demo' : 'supabase'
  const ai = serverEnv.AI_MOCK_MODE ? 'mock' : serverEnv.AI_PROVIDER

  let database: 'ok' | 'unreachable' | 'not_configured' = 'not_configured'
  if (!isDemoMode) {
    if (!hasSupabaseConfig) {
      database = 'not_configured'
    } else {
      try {
        const { createSupabaseServerClient } = await import('@/lib/supabase/server')
        const client = await createSupabaseServerClient()
        const { error } = await client.rpc('peek_couple_invitation', {
          p_secret_hash: 'health-probe-matches-nothing',
        })
        database = error ? 'unreachable' : 'ok'
      } catch {
        database = 'unreachable'
      }
    }
  }

  const ready = isDemoMode || database === 'ok'
  return NextResponse.json(
    {
      status: ready ? 'ok' : 'degraded',
      mode,
      database: isDemoMode ? 'demo_store' : database,
      ai,
      checkedAt: new Date().toISOString(),
    },
    { status: ready ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  )
}

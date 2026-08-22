import 'server-only'

/**
 * A small fixed-window limiter for the endpoints an attacker can reach
 * without an account.
 *
 * It is in-memory, so on serverless it limits per instance rather than
 * globally. That is deliberate and honest: it is a speed bump in front of
 * the real defenses (Supabase's own auth rate limits, and the invitation's
 * 5-attempt lockout), not a substitute for them. Nothing about a person is
 * stored — the key is hashed and the entry expires with the window.
 */

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()

function sweep(now: number) {
  if (buckets.size < 500) return
  for (const [key, window] of buckets) if (window.resetAt <= now) buckets.delete(key)
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  sweep(now)
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  current.count += 1
  if (current.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSeconds: 0 }
}

/** Only for tests — production windows expire on their own. */
export function resetRateLimits(): void {
  buckets.clear()
}

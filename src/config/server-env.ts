import 'server-only'
import { z } from 'zod'

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : v.trim().toLowerCase() === 'true'))

const serverSchema = z.object({
  AI_MOCK_MODE: booleanish.default(true),
  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  AI_MODEL: z.string().default(''),
  AI_FALLBACK_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  AI_FALLBACK_MODEL: z.string().default(''),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  OPENAI_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  INVITATION_TOKEN_PEPPER: z.string().min(8).default('dev-only-pepper-change-me'),
  /**
   * 32 random bytes, base64. Encrypts what people write, so a database
   * backup is not the same as a diary (docs/SECURITY.md §11). Demo mode runs
   * without it; a real deployment refuses to start without it, because
   * silently writing plaintext would be the worst possible failure.
   */
  DATA_ENCRYPTION_KEY: z.string().default(''),
  /** Kept readable during a key rotation; decryption falls back to it. */
  DATA_ENCRYPTION_KEY_PREVIOUS: z.string().default(''),
})

const parsed = serverSchema.safeParse(
  Object.fromEntries(
    Object.entries({
      AI_MOCK_MODE: process.env.AI_MOCK_MODE,
      AI_PROVIDER: process.env.AI_PROVIDER,
      AI_MODEL: process.env.AI_MODEL,
      AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
      AI_FALLBACK_MODEL: process.env.AI_FALLBACK_MODEL,
      AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS,
      AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      INVITATION_TOKEN_PEPPER: process.env.INVITATION_TOKEN_PEPPER,
      DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
      DATA_ENCRYPTION_KEY_PREVIOUS: process.env.DATA_ENCRYPTION_KEY_PREVIOUS,
    }).filter(([, v]) => v !== undefined && v !== ''),
  ),
)

if (!parsed.success) {
  throw new Error(`Invalid server environment variables:\n${z.prettifyError(parsed.error)}`)
}

export const serverEnv = parsed.data
export type ServerEnv = typeof serverEnv

/**
 * A real deployment must never write intimate text in the clear. Demo mode
 * has no real people in it, so it is allowed to run without a key.
 */
if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && process.env.NEXT_PHASE !== 'phase-production-build') {
  const key = Buffer.from(serverEnv.DATA_ENCRYPTION_KEY, 'base64')
  if (key.length !== 32) {
    throw new Error(
      'DATA_ENCRYPTION_KEY must be 32 bytes of base64 when demo mode is off — ' +
        'generate one with `openssl rand -base64 32` (see docs/LAUNCH.md).',
    )
  }
}

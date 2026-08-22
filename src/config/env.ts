import { z } from 'zod'

/**
 * Environment is parsed once, at module load, and split into a public half
 * (safe for the browser bundle) and a server half. Nothing from `serverEnv`
 * may ever be imported into a Client Component — the `server-only` guard in
 * the modules that consume it enforces that at build time.
 */

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : v.trim().toLowerCase() === 'true'))

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Futari'),
  NEXT_PUBLIC_APP_TAGLINE: z.string().default('二人の会話を、未来につなげる。'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['ja', 'en']).default('ja'),
  NEXT_PUBLIC_DEMO_MODE: booleanish.default(true),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(''),
})

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` only for statically written
 * member expressions, so each key is listed literally rather than looped.
 */
const rawPublic = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_TAGLINE: process.env.NEXT_PUBLIC_APP_TAGLINE,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

const parsedPublic = publicSchema.safeParse(
  Object.fromEntries(Object.entries(rawPublic).filter(([, v]) => v !== undefined && v !== '')),
)

if (!parsedPublic.success) {
  throw new Error(
    `Invalid public environment variables:\n${z.prettifyError(parsedPublic.error)}`,
  )
}

export const publicEnv = parsedPublic.data
export type PublicEnv = typeof publicEnv

/** True when the app runs entirely on the in-memory demo driver. */
export const isDemoMode = publicEnv.NEXT_PUBLIC_DEMO_MODE

/** True when Supabase is configured well enough to be used at all. */
export const hasSupabaseConfig =
  publicEnv.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

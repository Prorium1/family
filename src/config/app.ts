import { publicEnv } from './env'

/**
 * Single source of truth for product identity. Screens and metadata read from
 * here so the product can be renamed without touching a component.
 */
export const appConfig = {
  name: publicEnv.NEXT_PUBLIC_APP_NAME,
  tagline: publicEnv.NEXT_PUBLIC_APP_TAGLINE,
  url: publicEnv.NEXT_PUBLIC_APP_URL,
  defaultLocale: publicEnv.NEXT_PUBLIC_DEFAULT_LOCALE,
  /** Minimum age to create an account. */
  minimumAge: 18,
  support: {
    /** Region-scoped helplines live in content/safety-resources.ts. */
    defaultRegion: 'JP',
  },
} as const

export type AppConfig = typeof appConfig

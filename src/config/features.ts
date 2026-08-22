/**
 * Static feature flags. The admin surface (`/admin/feature-flags`) reads the
 * same shape from the database at runtime; this object is the fallback used in
 * demo mode and the default for a fresh install.
 */
export const featureFlags = {
  dailyQuestions: true,
  journeys: true,
  weeklyCheckin: true,
  repairMode: true,
  futurePlanning: true,
  agreements: true,
  relationshipManual: true,
  shareCards: true,
  referrals: true,
  billing: false,
  pushNotifications: false,
  photoMemories: false,
  voiceAnswers: false,
} as const

export type FeatureFlagKey = keyof typeof featureFlags

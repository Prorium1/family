/**
 * Billing is per couple, never per person — one subscription covers both
 * members. Safety, privacy, export, unpairing and deletion are deliberately
 * absent from every gate: they are never paid features.
 */
export const PLANS = ['free', 'couple_premium'] as const
export type PlanId = (typeof PLANS)[number]

export const ENTITLEMENTS = [
  'daily_question',
  'basic_journeys',
  'all_journeys',
  'weekly_checkin',
  'basic_insight',
  'detailed_insight',
  'repair_mode',
  'relationship_manual',
  'monthly_report',
  'advanced_future_planning',
  'custom_questions',
  'anniversaries',
  'couple_record',
] as const
export type Entitlement = (typeof ENTITLEMENTS)[number]

export const planEntitlements: Record<PlanId, readonly Entitlement[]> = {
  free: ['daily_question', 'basic_journeys', 'weekly_checkin', 'basic_insight', 'couple_record'],
  couple_premium: [...ENTITLEMENTS],
}

/**
 * Capabilities that must never sit behind a paywall, per product principle 27.
 * Exported so a test can assert no plan gate ever references them.
 */
export const NEVER_PAID = [
  'data_export',
  'account_deletion',
  'unpair',
  'privacy_settings',
  'safety_features',
] as const

export function planIncludes(plan: PlanId, entitlement: Entitlement): boolean {
  return planEntitlements[plan].includes(entitlement)
}

export const planLabels: Record<PlanId, string> = {
  free: 'Free',
  couple_premium: 'Couple Premium',
}

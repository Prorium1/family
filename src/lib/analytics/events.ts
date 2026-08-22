/**
 * Analytics event vocabulary (spec §31). Props are ids/enums/numbers/booleans
 * only — intimate text, emails and names never enter an event.
 */
export const ANALYTICS_EVENTS = [
  'signup_completed',
  'partner_invite_created',
  'partner_invite_accepted',
  'couple_pairing_completed',
  'daily_question_viewed',
  'answer_submitted',
  'both_answers_revealed',
  'ai_insight_viewed',
  'journey_started',
  'journey_step_completed',
  'weekly_checkin_completed',
  'repair_session_started',
  'repair_session_completed',
  'agreement_created',
  'share_card_created',
  'referral_completed',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

export type AnalyticsProps = Record<string, string | number | boolean>

/** Keys that smell like PII or free text are rejected at runtime and in tests. */
export const FORBIDDEN_PROP_KEY_PATTERN = /(text|answer|body|email|name|address|phone)/i

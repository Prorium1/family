/**
 * Core domain vocabulary. These literal unions mirror the Postgres enums in
 * supabase/migrations so the demo driver and the Supabase driver stay
 * interchangeable.
 */

// ── Relationship ────────────────────────────────────────────────────────────
export const RELATIONSHIP_STAGES = [
  'dating',
  'long_distance',
  'cohabiting',
  'considering_engagement',
  'engaged',
  'married',
  'preparing_for_children',
  'parenting',
  'long_term_partners',
] as const
export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[number]

/**
 * Gender is self-description only. It picks the color of the entry button
 * (docs/BRAND.md §3.1) and nothing else: pairing accepts every combination,
 * and no question, insight or AI prompt is ever varied by it.
 */
export const GENDERS = ['male', 'female', 'other'] as const
export type Gender = (typeof GENDERS)[number]

export const COUPLE_STATUS = ['pending', 'active', 'unpaired'] as const
export type CoupleStatus = (typeof COUPLE_STATUS)[number]

// ── Question / answer lifecycle ─────────────────────────────────────────────
/**
 * The assignment state machine from spec §10. Transitions are enforced
 * server-side in `server/policies/assignment-policy.ts`; the client never
 * decides when an answer becomes visible.
 */
export const ASSIGNMENT_STATUSES = [
  'assigned',
  'draft',
  'submitted',
  'waiting_partner',
  'ready_to_reveal',
  'revealed',
  'insight_generating',
  'insight_ready',
  'completed',
] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

export const QUESTION_FORMATS = [
  'free_text',
  'single_choice',
  'multi_choice',
  'scale_5',
  'ranking',
  'binary',
  'short_text',
] as const
export type QuestionFormat = (typeof QUESTION_FORMATS)[number]

export const QUESTION_CATEGORIES = [
  'daily',
  'gratitude',
  'affection',
  'personality',
  'weekend',
  'work',
  'money',
  'housework',
  'living',
  'marriage',
  'children',
  'parenting',
  'parents_family',
  'intimacy',
  'health',
  'dreams',
  'life_values',
  'anxiety',
  'past',
  'conflict',
  'reconciliation',
  'later_life',
] as const
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]

/**
 * 0 = safe from day one. 3 = only after sustained trust, and only if the
 * couple has opted into sensitive topics.
 */
export type SensitivityLevel = 0 | 1 | 2 | 3

// ── Privacy ─────────────────────────────────────────────────────────────────
/**
 * The five-way visibility contract from spec §4-4. Every free-text capture in
 * the product carries one of these, chosen by the author — never inferred.
 */
export const VISIBILITY_LEVELS = [
  'private',        // only the author, not even the AI
  'ai_only',        // the AI may read it; the partner never sees it
  'ai_summary',     // the partner sees an AI summary, never the original text
  'shared_excerpt', // the partner sees only excerpts the author picked
  'shared',         // the partner sees the original text
] as const
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number]

/** Visibility levels whose raw text may be sent to the model. */
export const AI_READABLE_VISIBILITY: readonly VisibilityLevel[] = [
  'ai_only',
  'ai_summary',
  'shared_excerpt',
  'shared',
]

/** Visibility levels whose raw text may ever reach the partner. */
export const PARTNER_READABLE_VISIBILITY: readonly VisibilityLevel[] = [
  'shared_excerpt',
  'shared',
]

// ── Safety ──────────────────────────────────────────────────────────────────
export const SAFETY_LEVELS = ['none', 'needs_support', 'urgent'] as const
export type SafetyLevel = (typeof SAFETY_LEVELS)[number]

export const SAFETY_CATEGORIES = [
  'violence',
  'threat',
  'sexual_coercion',
  'stalking',
  'surveillance',
  'financial_control',
  'self_harm',
  'suicide',
  'homicidal_threat',
  'minor',
  'personal_data_leak',
  'secret_leak',
  'prompt_injection',
  'role_override',
  'cross_user_data_request',
] as const
export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number]

// ── Relationship manual ─────────────────────────────────────────────────────
export const MANUAL_SOURCE_TYPES = [
  'user_stated',
  'shared_agreement',
  'ai_inference',
  'needs_confirmation',
] as const
export type ManualSourceType = (typeof MANUAL_SOURCE_TYPES)[number]

export type Confidence = 'low' | 'medium' | 'high'

// ── Future planning ─────────────────────────────────────────────────────────
export const FUTURE_CATEGORIES = ['marriage', 'money', 'family', 'work', 'dream'] as const
export type FutureCategory = (typeof FUTURE_CATEGORIES)[number]

export const AGREEMENT_STATUSES = ['draft', 'active', 'under_review', 'archived'] as const
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number]

// ── Repair ──────────────────────────────────────────────────────────────────
export const REPAIR_SESSION_STATUSES = [
  'open',
  'waiting_partner',
  'analyzing',
  'insight_ready',
  'paused_for_safety',
  'resolved',
  'closed',
] as const
export type RepairSessionStatus = (typeof REPAIR_SESSION_STATUSES)[number]

export const REPAIR_MODES = ['solo', 'together'] as const
export type RepairMode = (typeof REPAIR_MODES)[number]

// ── Journeys ────────────────────────────────────────────────────────────────
export const JOURNEY_PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed', 'paused'] as const
export type JourneyProgressStatus = (typeof JOURNEY_PROGRESS_STATUSES)[number]

export type LocaleCode = 'ja' | 'en'

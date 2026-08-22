import { describe, expect, it } from 'vitest'
import { ANALYTICS_EVENTS, FORBIDDEN_PROP_KEY_PATTERN } from '@/lib/analytics/events'

describe('analytics (spec §31)', () => {
  it('defines exactly the spec event vocabulary', () => {
    for (const name of [
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
    ]) {
      expect(ANALYTICS_EVENTS).toContain(name)
    }
  })

  it('rejects PII-shaped prop keys', () => {
    for (const key of ['answerText', 'email', 'displayName', 'body', 'phone_number']) {
      expect(FORBIDDEN_PROP_KEY_PATTERN.test(key), key).toBe(true)
    }
    for (const key of ['assignmentId', 'coupleId', 'stage', 'mode']) {
      expect(FORBIDDEN_PROP_KEY_PATTERN.test(key), key).toBe(false)
    }
  })
})

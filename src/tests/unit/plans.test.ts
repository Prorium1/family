import { describe, expect, it } from 'vitest'
import { ENTITLEMENTS, NEVER_PAID, PLANS, planEntitlements, planIncludes } from '@/config/plans'

describe('plans', () => {
  it('never gates safety/privacy capabilities behind a plan', () => {
    for (const capability of NEVER_PAID) {
      expect(ENTITLEMENTS).not.toContain(capability)
    }
  })

  it('premium is a strict superset of free', () => {
    for (const e of planEntitlements.free) {
      expect(planIncludes('couple_premium', e)).toBe(true)
    }
  })

  it('every plan grants the couple record', () => {
    for (const plan of PLANS) {
      expect(planIncludes(plan, 'couple_record')).toBe(true)
    }
  })
})

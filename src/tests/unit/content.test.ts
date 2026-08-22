import { describe, expect, it } from 'vitest'
import {
  allQuestions,
  dailyQuestions,
  gratitudeQuestions,
  affectionQuestions,
  workFamilyQuestions,
  moneyQuestions,
  premarriageQuestions,
  futureQuestions,
  getQuestionById,
} from '@/content/questions'
import { QUESTION_CATEGORIES, QUESTION_FORMATS } from '@/types/domain'
import { weeklyCheckinQuestions } from '@/content/weekly-checkin'
import { repairPrompts } from '@/content/repair-questions'
import { journeys, journeySteps, getStepsForJourney } from '@/content/journeys'

describe('seed content (spec §34)', () => {
  it('has the required counts per pack', () => {
    expect(dailyQuestions).toHaveLength(20)
    expect(gratitudeQuestions).toHaveLength(10)
    expect(affectionQuestions).toHaveLength(10)
    expect(workFamilyQuestions).toHaveLength(10)
    expect(moneyQuestions).toHaveLength(10)
    expect(premarriageQuestions).toHaveLength(30)
    expect(futureQuestions).toHaveLength(20)
    expect(weeklyCheckinQuestions).toHaveLength(5)
    expect(repairPrompts).toHaveLength(7)
  })

  it('has globally unique question ids', () => {
    const ids = allQuestions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses only valid categories, formats and sensitivity levels', () => {
    for (const q of allQuestions) {
      expect(QUESTION_CATEGORIES).toContain(q.category)
      expect(QUESTION_FORMATS).toContain(q.format)
      expect([0, 1, 2, 3]).toContain(q.sensitivity)
      expect(q.text.length).toBeGreaterThan(4)
    }
  })

  it('gives every choice-style question its options', () => {
    for (const q of allQuestions) {
      if (q.format === 'single_choice' || q.format === 'multi_choice' || q.format === 'binary' || q.format === 'ranking') {
        expect(q.options, `${q.id} needs options`).toBeDefined()
        expect(q.options!.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('defines 5 journeys whose steps all resolve to real questions', () => {
    expect(journeys).toHaveLength(5)
    for (const journey of journeys) {
      const steps = getStepsForJourney(journey.id)
      expect(steps.length).toBeGreaterThan(0)
      for (const step of steps) {
        expect(getQuestionById(step.questionId), `${step.id} → ${step.questionId}`).toBeDefined()
      }
    }
  })

  it('premarriage journey has exactly 30 steps ending with the marriage declaration', () => {
    const steps = getStepsForJourney('journey-premarriage-30')
    expect(steps).toHaveLength(30)
    expect(steps[29].questionId).toBe('prem-30')
  })

  it('has unique journey step ids', () => {
    const ids = journeySteps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps daily pack light: sensitivity 0-1 only for day-one questions', () => {
    for (const q of dailyQuestions) {
      expect(q.sensitivity).toBeLessThanOrEqual(1)
    }
  })
})

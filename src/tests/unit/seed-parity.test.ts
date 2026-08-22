import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { allQuestions, questionPacks } from '@/content/questions'
import { journeys, journeySteps } from '@/content/journeys'

/**
 * Drift guard: supabase/seed.sql is generated from src/content. If content
 * changes without regenerating (node scripts/generate-seed.mjs), this fails.
 */
describe('seed.sql parity with TS content', () => {
  const sql = readFileSync('supabase/seed.sql', 'utf8')

  const count = (pattern: string) =>
    (sql.match(new RegExp(`insert into ${pattern} `, 'g')) ?? []).length

  it('matches row counts', () => {
    expect(count('question_packs')).toBe(questionPacks.length)
    expect(count('questions')).toBe(allQuestions.length)
    expect(count('journeys')).toBe(journeys.length)
    expect(count('journey_steps')).toBe(journeySteps.length)
  })

  it('contains every question id', () => {
    for (const q of allQuestions) {
      expect(sql).toContain(`'${q.id}'`)
    }
  })
})

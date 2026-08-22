import { describe, expect, it } from 'vitest'
import { VISIBILITY_LEVELS } from '@/types/domain'
import {
  aiReadableText,
  isAiReadable,
  isPartnerReadable,
  redactEntryForPartner,
} from '@/server/policies/visibility-policy'
import type { RepairEntry } from '@/types/entities'

function entry(visibility: RepairEntry['visibility']): RepairEntry {
  return {
    id: 're-1',
    sessionId: 'rs-1',
    userId: 'user-a',
    promptId: 'rp-01',
    text: 'とても個人的な気持ちの原文',
    visibility,
    sharedExcerpts: ['選ばれた一文だけ'],
    submitted: true,
    createdAt: 'now',
    updatedAt: 'now',
  }
}

describe('visibility policy (spec §4-4, §12)', () => {
  it('covers all five levels', () => {
    expect(VISIBILITY_LEVELS).toHaveLength(5)
  })

  it('private text never reaches the AI', () => {
    expect(isAiReadable('private')).toBe(false)
    expect(aiReadableText(entry('private'))).toBeNull()
    for (const level of ['ai_only', 'ai_summary', 'shared_excerpt', 'shared'] as const) {
      expect(isAiReadable(level)).toBe(true)
    }
  })

  it('raw text reaches the partner only at shared / shared_excerpt', () => {
    expect(isPartnerReadable('private')).toBe(false)
    expect(isPartnerReadable('ai_only')).toBe(false)
    expect(isPartnerReadable('ai_summary')).toBe(false)
    expect(isPartnerReadable('shared_excerpt')).toBe(true)
    expect(isPartnerReadable('shared')).toBe(true)
  })

  it('redaction: private/ai_only yield nothing at all for the partner', () => {
    expect(redactEntryForPartner(entry('private'))).toBeNull()
    expect(redactEntryForPartner(entry('ai_only'))).toBeNull()
  })

  it('redaction: ai_summary yields a marker but never the text', () => {
    const redacted = redactEntryForPartner(entry('ai_summary'))!
    expect(redacted.summaryOnly).toBe(true)
    expect(redacted.sharedText).toBeNull()
    expect(redacted.excerpts).toHaveLength(0)
    expect(JSON.stringify(redacted)).not.toContain('原文')
  })

  it('redaction: shared_excerpt yields only the chosen excerpts', () => {
    const redacted = redactEntryForPartner(entry('shared_excerpt'))!
    expect(redacted.excerpts).toEqual(['選ばれた一文だけ'])
    expect(redacted.sharedText).toBeNull()
    expect(JSON.stringify(redacted)).not.toContain('個人的な気持ち')
  })

  it('redaction: shared passes the original text', () => {
    const redacted = redactEntryForPartner(entry('shared'))!
    expect(redacted.sharedText).toBe('とても個人的な気持ちの原文')
  })
})

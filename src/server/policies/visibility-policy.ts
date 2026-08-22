import {
  AI_READABLE_VISIBILITY,
  PARTNER_READABLE_VISIBILITY,
  type VisibilityLevel,
} from '@/types/domain'
import type { RepairEntry } from '@/types/entities'

/**
 * The five-way visibility contract (spec §4-4, §12). The author picks the
 * level; these helpers are the only place the rest of the code asks
 * "may the AI / the partner see this?"
 */

export function isAiReadable(level: VisibilityLevel): boolean {
  return AI_READABLE_VISIBILITY.includes(level)
}

export function isPartnerReadable(level: VisibilityLevel): boolean {
  return PARTNER_READABLE_VISIBILITY.includes(level)
}

export interface PartnerFacingEntry {
  promptId: string
  /** null unless the author shared the full text */
  sharedText: string | null
  /** excerpts the author explicitly picked (shared_excerpt) */
  excerpts: string[]
  summaryOnly: boolean
}

/**
 * Redact a repair entry for the partner. Raw text passes through ONLY at
 * `shared`; `shared_excerpt` passes the chosen excerpts; `ai_summary` yields
 * a summary-only marker (the summary itself comes from the AI insight, never
 * from this function); everything else yields nothing.
 */
export function redactEntryForPartner(entry: RepairEntry): PartnerFacingEntry | null {
  switch (entry.visibility) {
    case 'shared':
      return { promptId: entry.promptId, sharedText: entry.text, excerpts: [], summaryOnly: false }
    case 'shared_excerpt':
      return {
        promptId: entry.promptId,
        sharedText: null,
        excerpts: entry.sharedExcerpts,
        summaryOnly: false,
      }
    case 'ai_summary':
      return { promptId: entry.promptId, sharedText: null, excerpts: [], summaryOnly: true }
    case 'ai_only':
    case 'private':
      return null
  }
}

/** Text the AI may read from a repair entry. `private` never reaches the model. */
export function aiReadableText(entry: RepairEntry): string | null {
  return isAiReadable(entry.visibility) ? entry.text : null
}

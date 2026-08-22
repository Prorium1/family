import type { SafetyCategory, SafetyLevel } from '@/types/domain'
import { safetyPatterns } from './safety-patterns'

export interface SafetyAssessment {
  level: SafetyLevel
  categories: SafetyCategory[]
  /** true when the text tries to steer the AI rather than describe feelings */
  injectionDetected: boolean
}

const INJECTION_CATEGORIES: SafetyCategory[] = [
  'prompt_injection',
  'role_override',
  'cross_user_data_request',
  'secret_leak',
]

function normalize(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Rule-based safety check run before AND after every AI call (spec §19).
 * Returns metadata only — never the matched substrings — so downstream
 * `safety_events` rows cannot leak the intimate text that triggered them.
 */
export function checkTextSafety(text: string): SafetyAssessment {
  const normalized = normalize(text)
  const categories = new Set<SafetyCategory>()
  let level: SafetyLevel = 'none'

  for (const rule of safetyPatterns) {
    if (rule.patterns.some((p) => p.test(normalized))) {
      categories.add(rule.category)
      if (rule.level === 'urgent') level = 'urgent'
      else if (level === 'none') level = 'needs_support'
    }
  }

  return {
    level,
    categories: [...categories],
    injectionDetected: [...categories].some((c) => INJECTION_CATEGORIES.includes(c)),
  }
}

export function combineAssessments(assessments: SafetyAssessment[]): SafetyAssessment {
  const categories = new Set<SafetyCategory>()
  let level: SafetyLevel = 'none'
  let injectionDetected = false
  for (const a of assessments) {
    a.categories.forEach((c) => categories.add(c))
    if (a.level === 'urgent') level = 'urgent'
    else if (a.level === 'needs_support' && level === 'none') level = 'needs_support'
    injectionDetected ||= a.injectionDetected
  }
  return { level, categories: [...categories], injectionDetected }
}

/**
 * AI output guard: verdict phrases the "love interpreter" must never say
 * (spec §4-1, §4-2, §16). A hit fails validation and triggers regeneration.
 */
const FORBIDDEN_OUTPUT = [
  /別れるべき/,
  /相性が(悪い|低い)/,
  /相性は?\d+(点|%)/,
  /(あなた|相手)の方が正しい/,
  /相手が悪い/,
  /絶対に結婚(す(べき|るべき)|しなさい)/,
  /you should break up/i,
  /compatibility (score|of \d+)/i,
]

export function outputViolatesPrinciples(text: string): boolean {
  return FORBIDDEN_OUTPUT.some((p) => p.test(text))
}

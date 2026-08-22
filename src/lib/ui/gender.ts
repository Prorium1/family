import type { Gender } from '@/types/domain'

/**
 * How the registration entry asks "which of the two are you?".
 *
 * The mark is two circles — water blue on the left, pink on the right — so
 * the entry shows those two circles as the two choices (docs/BRAND.md §3.1),
 * plus a third, because two circles are two people, not a binary.
 *
 * This mapping exists only here, and only for the entry. Once someone is
 * inside the app their color is always 自分 = person-a / 相手 = person-b —
 * never their gender. That is what lets two men, or two women, see exactly
 * the same product as anyone else.
 */
export interface GenderOption {
  value: Gender
  /** Label on its own button at the entry: 「男性としてはじめる」 */
  entryLabel: (verb: string) => string
  label: string
  /** Button variant for the standalone entry buttons (signup / welcome). */
  variant: 'brandA' | 'brandB' | 'outline'
  /** Fill for the selected chip inside the onboarding radio group. */
  chipClass: string
}

export const GENDER_OPTIONS: GenderOption[] = [
  {
    value: 'male',
    label: '男性',
    entryLabel: (verb) => `男性として${verb}`,
    variant: 'brandA',
    chipClass: 'peer-checked:bg-brand-blue peer-checked:text-on-blend',
  },
  {
    value: 'female',
    label: '女性',
    entryLabel: (verb) => `女性として${verb}`,
    variant: 'brandB',
    chipClass: 'peer-checked:bg-brand-pink peer-checked:text-on-blend',
  },
  {
    value: 'other',
    label: 'その他',
    entryLabel: (verb) => `どちらでもない・答えずに${verb}`,
    variant: 'outline',
    chipClass: 'peer-checked:bg-surface-muted peer-checked:font-semibold',
  },
]

export function genderOption(value: Gender | null): GenderOption | null {
  return GENDER_OPTIONS.find((o) => o.value === value) ?? null
}

/** Shown wherever a couple might wonder whether this product is for them. */
export const ANY_PAIRING_NOTE = '男性同士・女性同士でも、まったく同じようにお使いいただけます。'

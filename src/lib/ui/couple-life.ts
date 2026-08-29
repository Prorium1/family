import type { CoupleDateKind, CoupleNoteKind, SignalKind } from '@/types/domain'

/**
 * Shared vocabulary for the couple-life features (予定・メモ・サイン).
 * One module, so a label can never drift between the page, the home card
 * and the tests.
 */

export const DATE_KIND_LABELS: Record<CoupleDateKind, string> = {
  anniversary: '記念日',
  family_event: '家族の行事',
  memorial: '大切な人を想う日',
  trip: '旅行',
  reminder: 'リマインダー',
}

/** Kinds that repeat yearly unless the person says otherwise. */
export const DATE_KIND_DEFAULT_YEARLY: Record<CoupleDateKind, boolean> = {
  anniversary: true,
  family_event: false,
  memorial: true,
  trip: false,
  reminder: false,
}

export const NOTE_KIND_LABELS: Record<CoupleNoteKind, string> = {
  memo: 'メモ',
  trip: '旅行の計画',
  emergency: 'もしものときメモ',
}

/**
 * ひとことサイン: the fixed vocabulary. Six everyday moments — enough to say
 * 「元気だよ」 without composing anything, few enough to fit one row.
 */
export const SIGNAL_LABELS: Record<SignalKind, string> = {
  good_morning: 'おはよう',
  heading_out: 'いってきます',
  got_home: 'ただいま',
  work_done: 'おつかれさま',
  good_night: 'おやすみ',
  thinking_of_you: '想ってるよ',
}

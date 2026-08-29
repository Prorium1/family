/** Date helpers shared by services. All couple-facing "days" are timezone-local. */

export function localDateKey(timezone: string, at = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(at) // YYYY-MM-DD
}

/** ISO-8601 week key, e.g. 2026-W34. */
export function isoWeekKey(at = new Date()): string {
  const date = new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()))
  const dayNumber = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function daysBetween(fromIso: string, to = new Date()): number {
  return Math.max(0, Math.floor((to.getTime() - new Date(fromIso).getTime()) / 86400000))
}

/** Whole-day difference between two YYYY-MM-DD strings (b - a). */
export function diffDateKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

/** Add whole days to a YYYY-MM-DD string. */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

import 'server-only'
import { getRepositories } from '@/server/repositories'
import { track } from '@/lib/analytics/track'
import { diffDateKeys, localDateKey } from '@/lib/dates'
import type { CoupleDate } from '@/types/entities'
import type { CoupleDateKind } from '@/types/domain'

/**
 * ふたりの予定 (spec: 共有カレンダー・記念日・家族行事・命日・法事・リマインダー).
 *
 * One shared list of dates. Anniversaries and memorial days repeat yearly;
 * trips and reminders happen once. The service computes "when is this next"
 * in the viewer's own timezone, so a countdown never flips a day early for
 * one of the two people.
 */

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The next calendar occurrence of a date, seen from `today` (YYYY-MM-DD).
 * A yearly Feb 29 lands on Feb 28 in non-leap years — the day is kept, a
 * year is never skipped. A one-shot date in the past has no next occurrence.
 */
export function nextOccurrence(date: string, today: string, repeatsYearly: boolean): string | null {
  if (!repeatsYearly) return date >= today ? date : null
  const [, month, day] = date.split('-').map(Number)
  const todayYear = Number(today.slice(0, 4))
  const inYear = (year: number) => {
    const clampedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day
    return `${year}-${pad(month)}-${pad(clampedDay)}`
  }
  const thisYear = inYear(todayYear)
  return thisYear >= today ? thisYear : inYear(todayYear + 1)
}

export interface CoupleDateView {
  id: string
  kind: CoupleDateKind
  title: string
  date: string
  repeatsYearly: boolean
  note: string
  /** null = a one-shot date already behind us */
  next: string | null
  /** days from today to `next` (0 = today) */
  daysUntil: number | null
  /** anniversaries only: ◯周年 at the next occurrence (null for year 0) */
  years: number | null
}

export interface DatesViewDTO {
  today: string
  upcoming: CoupleDateView[]
  past: CoupleDateView[]
}

function toView(date: CoupleDate, today: string): CoupleDateView {
  const next = nextOccurrence(date.date, today, date.repeatsYearly)
  const years =
    date.kind === 'anniversary' && date.repeatsYearly && next
      ? Number(next.slice(0, 4)) - Number(date.date.slice(0, 4))
      : null
  return {
    id: date.id,
    kind: date.kind,
    title: date.title,
    date: date.date,
    repeatsYearly: date.repeatsYearly,
    note: date.note,
    next,
    daysUntil: next ? diffDateKeys(today, next) : null,
    years: years && years > 0 ? years : null,
  }
}

export async function getDatesView(coupleId: string, viewerUserId: string): Promise<DatesViewDTO> {
  const repos = getRepositories()
  const profile = await repos.profiles.getById(viewerUserId)
  const today = localDateKey(profile?.timezone ?? 'Asia/Tokyo')
  const views = (await repos.coupleDates.list(coupleId, viewerUserId)).map((d) => toView(d, today))
  const upcoming = views
    .filter((v) => v.next !== null)
    .sort((a, b) => (a.next ?? '').localeCompare(b.next ?? ''))
  const past = views.filter((v) => v.next === null).sort((a, b) => b.date.localeCompare(a.date))
  return { today, upcoming, past }
}

/** The single closest date, for the home card. */
export async function getNextDate(
  coupleId: string,
  viewerUserId: string,
): Promise<CoupleDateView | null> {
  const { upcoming } = await getDatesView(coupleId, viewerUserId)
  return upcoming[0] ?? null
}

export async function addCoupleDate(input: {
  coupleId: string
  userId: string
  kind: CoupleDateKind
  title: string
  date: string
  repeatsYearly: boolean
  note: string
}): Promise<CoupleDate> {
  const created = await getRepositories().coupleDates.create({
    id: `cd_${crypto.randomUUID()}`,
    coupleId: input.coupleId,
    kind: input.kind,
    title: input.title.trim().slice(0, 80),
    date: input.date,
    repeatsYearly: input.repeatsYearly,
    note: input.note.trim().slice(0, 500),
    createdByUserId: input.userId,
    createdAt: new Date().toISOString(),
  })
  await track('couple_date_added', { kind: input.kind })
  return created
}

export async function removeCoupleDate(id: string, viewerUserId: string): Promise<void> {
  await getRepositories().coupleDates.remove(id, viewerUserId)
}

/** Reminder window for the home surface: today or tomorrow. */
export function isImminent(view: CoupleDateView): boolean {
  return view.daysUntil !== null && view.daysUntil <= 1
}

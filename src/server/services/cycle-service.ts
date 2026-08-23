import 'server-only'
import { getRepositories } from '@/server/repositories'
import { track } from '@/lib/analytics/track'
import { addDaysToKey, diffDateKeys, localDateKey } from '@/lib/dates'

/**
 * からだの周期 (spec: 生理日共有) — treated as health data, which means three
 * hard rules, all enforced below or in the drivers:
 *
 *   1. Off by default. The partner sees NOTHING — not even that records
 *      exist — until the owner turns sharing on. The gate lives in the
 *      driver (`getSharedByPartner`), not in the UI.
 *   2. Encrypted at rest. The dates live in one sealed payload; the only
 *      plaintext fact in the database is the sharing flag.
 *   3. Never a verdict. The prediction is an average with a 「ごろ」, not a
 *      medical statement — and if the recorded intervals don't support an
 *      estimate, we say nothing rather than guess.
 *
 * Inclusive by design: either partner may keep a cycle, and nothing here
 * reads gender.
 */

/** Plausible period-to-period gap. Outside this we treat the gap as noise. */
const MIN_INTERVAL_DAYS = 15
const MAX_INTERVAL_DAYS = 60
/** Average over the most recent gaps only, so the estimate tracks change. */
const RECENT_GAPS = 6
const MAX_RECORDED_STARTS = 36

export interface CyclePrediction {
  lastStart: string
  averageIntervalDays: number | null
  predictedNext: string | null
}

/** Pure math, exported for the unit tests. */
export function predictNextStart(starts: string[]): CyclePrediction | null {
  const sorted = [...new Set(starts)].sort()
  if (sorted.length === 0) return null
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const gap = diffDateKeys(sorted[i - 1], sorted[i])
    if (gap >= MIN_INTERVAL_DAYS && gap <= MAX_INTERVAL_DAYS) gaps.push(gap)
  }
  const recent = gaps.slice(-RECENT_GAPS)
  const average = recent.length
    ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
    : null
  const lastStart = sorted[sorted.length - 1]
  return {
    lastStart,
    averageIntervalDays: average,
    predictedNext: average ? addDaysToKey(lastStart, average) : null,
  }
}

export interface CycleViewDTO {
  today: string
  mine: {
    starts: string[]
    sharedWithPartner: boolean
    prediction: CyclePrediction | null
  }
  /** null unless the partner turned sharing on. */
  partner: {
    prediction: CyclePrediction | null
    daysUntilPredicted: number | null
  } | null
}

export async function getCycleView(coupleId: string, viewerUserId: string): Promise<CycleViewDTO> {
  const repos = getRepositories()
  const profile = await repos.profiles.getById(viewerUserId)
  const today = localDateKey(profile?.timezone ?? 'Asia/Tokyo')
  const own = await repos.cycles.getOwn(viewerUserId)
  const shared = await repos.cycles.getSharedByPartner(coupleId, viewerUserId)
  const partnerPrediction = shared ? predictNextStart(shared.payload.starts) : null
  return {
    today,
    mine: {
      starts: [...(own?.payload.starts ?? [])].sort().reverse(),
      sharedWithPartner: own?.sharedWithPartner ?? false,
      prediction: own ? predictNextStart(own.payload.starts) : null,
    },
    partner: shared
      ? {
          prediction: partnerPrediction,
          daysUntilPredicted:
            partnerPrediction?.predictedNext && partnerPrediction.predictedNext >= today
              ? diffDateKeys(today, partnerPrediction.predictedNext)
              : null,
        }
      : null,
  }
}

export async function recordCycleStart(input: {
  coupleId: string
  userId: string
  date: string
}): Promise<void> {
  const repos = getRepositories()
  const own = await repos.cycles.getOwn(input.userId)
  const starts = [...new Set([...(own?.payload.starts ?? []), input.date])]
    .sort()
    .slice(-MAX_RECORDED_STARTS)
  await repos.cycles.save({
    userId: input.userId,
    coupleId: input.coupleId,
    sharedWithPartner: own?.sharedWithPartner ?? false,
    payload: { starts },
    updatedAt: new Date().toISOString(),
  })
  // metadata only — the date itself is never logged
  await track('cycle_start_recorded', {})
}

export async function removeCycleStart(input: {
  coupleId: string
  userId: string
  date: string
}): Promise<void> {
  const repos = getRepositories()
  const own = await repos.cycles.getOwn(input.userId)
  if (!own) return
  await repos.cycles.save({
    ...own,
    payload: { starts: own.payload.starts.filter((s) => s !== input.date) },
    updatedAt: new Date().toISOString(),
  })
}

export async function setCycleSharing(input: {
  coupleId: string
  userId: string
  shared: boolean
}): Promise<void> {
  const repos = getRepositories()
  const own = await repos.cycles.getOwn(input.userId)
  await repos.cycles.save({
    userId: input.userId,
    coupleId: input.coupleId,
    sharedWithPartner: input.shared,
    payload: own?.payload ?? { starts: [] },
    updatedAt: new Date().toISOString(),
  })
  await track('cycle_sharing_changed', { shared: input.shared })
}

import 'server-only'
import { getRepositories } from '@/server/repositories'
import { track } from '@/lib/analytics/track'
import type { CoupleSignal } from '@/types/entities'
import type { SignalKind } from '@/types/domain'

/**
 * ひとことサイン (spec: チェックイン) — presence without surveillance.
 *
 * One tap sends one of six fixed signs; the partner's home shows the latest
 * for a day. There is no location, no free text and no read receipt: the
 * point is 「元気だよ」, not 「どこにいるか」.
 */

const SIGNAL_WINDOW_HOURS = 24

export interface SignalBoardDTO {
  mine: { kind: SignalKind; at: string } | null
  partner: { kind: SignalKind; at: string } | null
}

export async function getSignalBoard(
  coupleId: string,
  viewerUserId: string,
): Promise<SignalBoardDTO> {
  const since = new Date(Date.now() - SIGNAL_WINDOW_HOURS * 3600_000).toISOString()
  const recent = await getRepositories().signals.listRecent(coupleId, viewerUserId, since)
  const mine = recent.find((s) => s.userId === viewerUserId) ?? null
  const partner = recent.find((s) => s.userId !== viewerUserId) ?? null
  return {
    mine: mine ? { kind: mine.kind, at: mine.createdAt } : null,
    partner: partner ? { kind: partner.kind, at: partner.createdAt } : null,
  }
}

export async function sendSignal(input: {
  coupleId: string
  userId: string
  kind: SignalKind
}): Promise<CoupleSignal> {
  const signal = await getRepositories().signals.add({
    id: `sig_${crypto.randomUUID()}`,
    coupleId: input.coupleId,
    userId: input.userId,
    kind: input.kind,
    createdAt: new Date().toISOString(),
  })
  await track('signal_sent', { kind: input.kind })
  return signal
}

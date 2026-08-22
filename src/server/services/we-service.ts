import 'server-only'
import { getRepositories } from '@/server/repositories'
import { track } from '@/lib/analytics/track'
import type { WeEntry } from '@/types/entities'
import type { WeEntryKind, WeEntrySource } from '@/types/domain'

/**
 * NEW WE (docs/BRAND.md §0.2) — the couple's own answers, kept in place of a
 * compatibility score. The AI only ever drafts; every entry here is saved by
 * one of the two people, and either of them can remove it.
 */

export interface SaveWeEntryInput {
  coupleId: string
  userId: string
  kind: WeEntryKind
  title: string
  body: string
  sourceType: WeEntrySource
  sourceId: string | null
}

export async function listWeEntries(coupleId: string, viewerUserId: string): Promise<WeEntry[]> {
  return getRepositories().weEntries.list(coupleId, viewerUserId)
}

/**
 * Save one entry. Saving the same source twice is a no-op rather than an
 * error: both partners may tap "make this ours" on the same reveal, and the
 * second tap should feel like agreement, not a duplicate.
 */
export async function saveWeEntry(input: SaveWeEntryInput): Promise<WeEntry | null> {
  const repos = getRepositories()
  const title = input.title.trim()
  if (!title) return null

  if (input.sourceId) {
    const existing = await repos.weEntries.findBySource(
      input.coupleId,
      input.sourceType,
      input.sourceId,
    )
    const already = existing.find((e) => e.kind === input.kind)
    if (already) return already
  }

  const entry = await repos.weEntries.create({
    id: `we_${crypto.randomUUID()}`,
    coupleId: input.coupleId,
    kind: input.kind,
    title: title.slice(0, 120),
    body: input.body.trim().slice(0, 2000),
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    createdByUserId: input.userId,
    createdAt: new Date().toISOString(),
  })
  await track('new_we_saved', { kind: input.kind, source: input.sourceType })
  return entry
}

export async function removeWeEntry(id: string, viewerUserId: string): Promise<void> {
  await getRepositories().weEntries.remove(id, viewerUserId)
}

/** Counts per kind, for the ふたり page and the NEW WE header. */
export function countByKind(entries: WeEntry[]): Record<WeEntryKind, number> {
  return entries.reduce(
    (acc, entry) => ({ ...acc, [entry.kind]: (acc[entry.kind] ?? 0) + 1 }),
    { discovery: 0, answer: 0, promise: 0, future: 0 } as Record<WeEntryKind, number>,
  )
}

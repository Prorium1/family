import 'server-only'
import { getRepositories } from '@/server/repositories'
import { track } from '@/lib/analytics/track'
import type { CoupleNote } from '@/types/entities'
import type { CoupleNoteKind } from '@/types/domain'

/**
 * ふたりのメモ (spec: メモ・旅行計画・万が一メモ). Shared notes both people
 * read and edit. The text is sealed at rest (docs/SECURITY.md §11) — an
 * emergency note holds exactly the kind of content an operator must never
 * be able to read.
 */

export async function listNotes(coupleId: string, viewerUserId: string): Promise<CoupleNote[]> {
  return getRepositories().coupleNotes.list(coupleId, viewerUserId)
}

export async function createNote(input: {
  coupleId: string
  userId: string
  kind: CoupleNoteKind
  title: string
  body: string
}): Promise<CoupleNote> {
  const now = new Date().toISOString()
  const note = await getRepositories().coupleNotes.create({
    id: `cn_${crypto.randomUUID()}`,
    coupleId: input.coupleId,
    kind: input.kind,
    title: input.title.trim().slice(0, 80),
    body: input.body.trim().slice(0, 8000),
    createdByUserId: input.userId,
    updatedByUserId: input.userId,
    createdAt: now,
    updatedAt: now,
  })
  await track('couple_note_created', { kind: input.kind })
  return note
}

export async function saveNote(input: {
  id: string
  viewerUserId: string
  title: string
  body: string
}): Promise<CoupleNote | null> {
  const repos = getRepositories()
  const existing = await repos.coupleNotes.getById(input.id, input.viewerUserId)
  if (!existing) return null
  return repos.coupleNotes.save(
    {
      ...existing,
      title: input.title.trim().slice(0, 80),
      body: input.body.trim().slice(0, 8000),
      updatedByUserId: input.viewerUserId,
      updatedAt: new Date().toISOString(),
    },
    input.viewerUserId,
  )
}

export async function removeNote(id: string, viewerUserId: string): Promise<void> {
  await getRepositories().coupleNotes.remove(id, viewerUserId)
}

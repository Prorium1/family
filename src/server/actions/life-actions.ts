'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCoupleSession } from '@/lib/auth/session'
import { COUPLE_DATE_KINDS, COUPLE_NOTE_KINDS, SIGNAL_KINDS } from '@/types/domain'
import { addCoupleDate, removeCoupleDate } from '@/server/services/dates-service'
import { createNote, removeNote, saveNote } from '@/server/services/notes-service'
import { sendSignal } from '@/server/services/signals-service'
import {
  recordCycleStart,
  removeCycleStart,
  setCycleSharing,
} from '@/server/services/cycle-service'

/** Server actions for the couple-life features: 予定・メモ・サイン・周期. */

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// ── ふたりの予定 ────────────────────────────────────────────────────

const addDateSchema = z.object({
  kind: z.enum(COUPLE_DATE_KINDS),
  title: z.string().trim().min(1).max(80),
  date: dateKey,
  repeatsYearly: z.boolean(),
  note: z.string().max(500),
})

export async function addCoupleDateAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const parsed = addDateSchema.safeParse({
    kind: formData.get('kind'),
    title: formData.get('title'),
    date: formData.get('date'),
    repeatsYearly: formData.get('repeatsYearly') === 'on',
    note: formData.get('note') ?? '',
  })
  if (!parsed.success) return
  await addCoupleDate({ coupleId: session.coupleId, userId: session.userId, ...parsed.data })
  revalidatePath('/dates')
  revalidatePath('/home')
}

export async function removeCoupleDateAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const id = z.string().min(1).safeParse(formData.get('id'))
  if (!id.success) return
  await removeCoupleDate(id.data, session.userId)
  revalidatePath('/dates')
  revalidatePath('/home')
}

// ── ふたりのメモ ────────────────────────────────────────────────────

const createNoteSchema = z.object({
  kind: z.enum(COUPLE_NOTE_KINDS),
  title: z.string().trim().min(1).max(80),
  body: z.string().max(8000),
})

export async function createNoteAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const parsed = createNoteSchema.safeParse({
    kind: formData.get('kind'),
    title: formData.get('title'),
    body: formData.get('body') ?? '',
  })
  if (!parsed.success) return
  await createNote({ coupleId: session.coupleId, userId: session.userId, ...parsed.data })
  revalidatePath('/notes')
}

const saveNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(80),
  body: z.string().max(8000),
})

export async function saveNoteAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const parsed = saveNoteSchema.safeParse({
    id: formData.get('id'),
    title: formData.get('title'),
    body: formData.get('body') ?? '',
  })
  if (!parsed.success) return
  await saveNote({ viewerUserId: session.userId, ...parsed.data })
  revalidatePath('/notes')
}

export async function removeNoteAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const id = z.string().min(1).safeParse(formData.get('id'))
  if (!id.success) return
  await removeNote(id.data, session.userId)
  revalidatePath('/notes')
}

// ── ひとことサイン ──────────────────────────────────────────────────

export async function sendSignalAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const kind = z.enum(SIGNAL_KINDS).safeParse(formData.get('kind'))
  if (!kind.success) return
  await sendSignal({ coupleId: session.coupleId, userId: session.userId, kind: kind.data })
  revalidatePath('/home')
}

// ── からだの周期 ────────────────────────────────────────────────────

export async function recordCycleStartAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const date = dateKey.safeParse(formData.get('date'))
  if (!date.success) return
  await recordCycleStart({ coupleId: session.coupleId, userId: session.userId, date: date.data })
  revalidatePath('/cycle')
}

export async function removeCycleStartAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const date = dateKey.safeParse(formData.get('date'))
  if (!date.success) return
  await removeCycleStart({ coupleId: session.coupleId, userId: session.userId, date: date.data })
  revalidatePath('/cycle')
}

export async function setCycleSharingAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  await setCycleSharing({
    coupleId: session.coupleId,
    userId: session.userId,
    shared: formData.get('shared') === 'on',
  })
  revalidatePath('/cycle')
}

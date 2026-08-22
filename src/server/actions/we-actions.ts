'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCoupleSession } from '@/lib/auth/session'
import { getRepositories } from '@/server/repositories'
import { removeWeEntry, saveWeEntry } from '@/server/services/we-service'
import { WE_ENTRY_KINDS, WE_ENTRY_SOURCES } from '@/types/domain'

const saveSchema = z.object({
  kind: z.enum(WE_ENTRY_KINDS),
  title: z.string().trim().min(1).max(120),
  body: z.string().max(2000),
  sourceType: z.enum(WE_ENTRY_SOURCES),
  sourceId: z.string().max(120).nullable(),
})

/**
 * Save one NEW WE entry (docs/BRAND.md §0.2). The couple decides what becomes
 * theirs — the AI's draft only becomes an entry when a person taps this.
 */
export async function saveWeEntryAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const parsed = saveSchema.safeParse({
    kind: formData.get('kind'),
    title: formData.get('title'),
    body: formData.get('body') ?? '',
    sourceType: formData.get('sourceType'),
    sourceId: formData.get('sourceId') || null,
  })
  if (!parsed.success) return

  await saveWeEntry({
    coupleId: session.coupleId,
    userId: session.userId,
    ...parsed.data,
  })

  // The couple's own record of the moment — no scores, just what they made.
  await getRepositories().timeline.add({
    id: `tl_${crypto.randomUUID()}`,
    coupleId: session.coupleId,
    kind: 'new_we_saved',
    title: `私たちの答え「${parsed.data.title.slice(0, 40)}」`,
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  })

  revalidatePath('/we')
  revalidatePath('/story')
}

export async function removeWeEntryAction(formData: FormData): Promise<void> {
  const session = await requireCoupleSession()
  const id = z.string().min(1).safeParse(formData.get('id'))
  if (!id.success) return
  await removeWeEntry(id.data, session.userId)
  revalidatePath('/we')
}

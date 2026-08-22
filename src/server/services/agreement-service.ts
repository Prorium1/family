import 'server-only'
import { getRepositories } from '@/server/repositories'
import type { FutureCategory } from '@/types/domain'
import type { AgreementDTO } from '@/types/dto'
import { track } from '@/lib/analytics/track'
import { saveWeEntry } from './we-service'

/** 二人の約束 (spec §13): revisable decisions, never fixed contracts. */

export async function listAgreements(coupleId: string, userId: string): Promise<AgreementDTO[]> {
  const repos = getRepositories()
  const agreements = await repos.agreements.list(coupleId, userId)
  return Promise.all(
    agreements.map(async (a) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      background: a.background,
      decision: a.decision,
      startsOn: a.startsOn,
      reviewOn: a.reviewOn,
      status: a.status,
      revisions: (await repos.agreements.listRevisions(a.id, userId)).map((r) => ({
        editedAt: r.editedAt,
        comment: r.comment,
      })),
    })),
  )
}

export async function createAgreement(
  coupleId: string,
  userId: string,
  input: {
    category: FutureCategory
    title: string
    background: string
    decision: string
    startsOn: string | null
    reviewOn: string | null
  },
): Promise<string> {
  const repos = getRepositories()
  const now = new Date().toISOString()
  const agreement = await repos.agreements.create({
    id: `ag_${crypto.randomUUID()}`,
    coupleId,
    category: input.category,
    title: input.title,
    background: input.background,
    decision: input.decision,
    startsOn: input.startsOn,
    reviewOn: input.reviewOn,
    status: 'active',
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now,
  })
  await repos.timeline.add({
    id: `tl_${crypto.randomUUID()}`,
    coupleId,
    kind: 'agreement_created',
    title: `約束「${input.title}」`,
    date: now.slice(0, 10),
    createdAt: now,
  })
  // A promise is one of the four things NEW WE is made of (BRAND.md §0.2).
  await saveWeEntry({
    coupleId,
    userId,
    kind: 'promise',
    title: input.title,
    body: input.decision,
    sourceType: 'agreement',
    sourceId: agreement.id,
  })
  await track('agreement_created', { category: input.category })
  return agreement.id
}

export async function reviseAgreement(
  agreementId: string,
  userId: string,
  input: { title: string; background: string; decision: string; comment: string | null },
): Promise<void> {
  const repos = getRepositories()
  const agreement = await repos.agreements.getById(agreementId, userId)
  if (!agreement) throw new Error('agreement not found')
  const now = new Date().toISOString()
  await repos.agreements.save(
    { ...agreement, title: input.title, background: input.background, decision: input.decision, updatedAt: now },
    {
      id: `agr_${crypto.randomUUID()}`,
      agreementId,
      title: agreement.title,
      background: agreement.background,
      decision: agreement.decision,
      comment: input.comment,
      editedByUserId: userId,
      editedAt: now,
    },
  )
}

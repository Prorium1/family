import 'server-only'
import { getRepositories } from '@/server/repositories'
import { isRevealed } from '@/server/policies/assignment-policy'
import { isAiReadable } from '@/server/policies/visibility-policy'
import type { ManualItemDTO } from '@/types/dto'
import type { RelationshipManualItemRecord } from '@/types/entities'
import type { QuestionCategory } from '@/types/domain'

/**
 * ふたりの取扱説明書 (spec §15, §18). Items derive from revealed,
 * AI-readable answers. Direct statements are labeled `user_stated`; derived
 * observations are `ai_inference` and stay unconfirmed until a user confirms
 * them. Users can edit and delete anything here — this is the visible,
 * controllable "AI memory".
 */

const CATEGORY_TO_MANUAL: Partial<Record<QuestionCategory, string>> = {
  affection: '愛情を感じやすい行動',
  gratitude: '感謝されると嬉しいこと',
  work: '仕事に対する価値観',
  money: 'お金に対する価値観',
  parents_family: '家族に対する価値観',
  dreams: '将来の夢',
  anxiety: '不安になりやすい状況',
  conflict: '喧嘩したときに必要なこと',
  reconciliation: '仲直りしやすい方法',
  personality: '大切にしたい習慣',
}

export async function refreshManualFromAnswers(coupleId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  const [assignments, answers, existing] = await Promise.all([
    repos.assignments.listForCouple(coupleId, userId),
    repos.answers.listRevealedForCouple(coupleId, userId),
    repos.manual.list(coupleId, userId),
  ])
  const revealedIds = new Map(
    assignments.filter((a) => isRevealed(a.status)).map((a) => [a.id, a] as const),
  )
  const knownSources = new Set(existing.flatMap((i) => i.sourceIds))

  for (const answer of answers) {
    const assignment = revealedIds.get(answer.assignmentId)
    if (!assignment || knownSources.has(answer.id)) continue
    if (!isAiReadable(answer.visibility)) continue
    if (answer.value.kind !== 'text' || answer.value.text.trim().length < 4) continue
    const question = await repos.questions.getById(assignment.questionId)
    const category = question ? CATEGORY_TO_MANUAL[question.category] : undefined
    if (!category) continue

    const item: RelationshipManualItemRecord = {
      id: `mi_${crypto.randomUUID()}`,
      coupleId,
      subjectUserId: answer.userId,
      category,
      statement: answer.value.text.split(/[。\n]/)[0]?.slice(0, 80) ?? '',
      sourceType: 'user_stated',
      sourceIds: [answer.id],
      confidence: 'high',
      confirmedByUserIds: [answer.userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (item.statement) await repos.manual.save(item, userId)
  }
}

export async function listManualItems(coupleId: string, userId: string): Promise<ManualItemDTO[]> {
  const repos = getRepositories()
  await refreshManualFromAnswers(coupleId, userId)
  const items = await repos.manual.list(coupleId, userId)
  const membership = await repos.couples.getById(coupleId, userId)
  const nameOf = new Map<string, string>()
  for (const member of membership?.members ?? []) {
    const profile = await repos.profiles.getById(member.userId)
    nameOf.set(member.userId, profile?.displayName ?? '')
  }
  return items.map((i) => ({
    id: i.id,
    subjectUserId: i.subjectUserId,
    subjectName: nameOf.get(i.subjectUserId) ?? '',
    category: i.category,
    statement: i.statement,
    sourceType: i.sourceType,
    confidence: i.confidence,
    confirmedByMe: i.confirmedByUserIds.includes(userId),
    confirmedByPartner: i.confirmedByUserIds.some((id) => id !== userId),
  }))
}

export async function confirmManualItem(itemId: string, coupleId: string, userId: string): Promise<void> {
  const repos = getRepositories()
  const items = await repos.manual.list(coupleId, userId)
  const item = items.find((i) => i.id === itemId)
  if (!item) return
  if (!item.confirmedByUserIds.includes(userId)) {
    await repos.manual.save(
      {
        ...item,
        confirmedByUserIds: [...item.confirmedByUserIds, userId],
        sourceType: item.sourceType === 'ai_inference' ? 'user_stated' : item.sourceType,
        updatedAt: new Date().toISOString(),
      },
      userId,
    )
  }
}

export async function deleteManualItem(itemId: string, userId: string): Promise<void> {
  await getRepositories().manual.remove(itemId, userId)
}

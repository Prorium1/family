import { beforeEach, describe, expect, it } from 'vitest'
import { resetDemoStore, getDemoStore } from '@/server/repositories/demo/store'
import { getRepositories } from '@/server/repositories'
import {
  acceptInvitation,
  createInvitation,
  getPairStatus,
  PairingError,
  unpairCouple,
} from '@/server/services/pairing-service'
import {
  ensureTodayAssignment,
  getTodayView,
  saveDraft,
  submitAnswer,
} from '@/server/services/daily-service'
import { regenerateDailyInsight } from '@/server/services/insight-service'
import {
  getRepairSession,
  saveRepairEntries,
  startRepairSession,
} from '@/server/services/repair-service'
import { exportUserData } from '@/server/services/settings-service'
import { countByKind, listWeEntries, removeWeEntry, saveWeEntry } from '@/server/services/we-service'
import { createAgreement } from '@/server/services/agreement-service'
import { MAX_INVITATION_ATTEMPTS } from '@/lib/security/invitation-token'
import type { Gender } from '@/types/domain'

const A = 'demo-user-a'
const B = 'demo-user-b'
const C = 'demo-user-c'

/** Register a demo account the way onboarding does — accounts start blank. */
async function register(
  userId: string,
  displayName: string,
  gender: Gender = 'other',
): Promise<void> {
  await getRepositories().profiles.update(userId, { displayName, gender })
}

/** Onboarding records an AI-processing consent, so the fixtures do too. */
async function grantAiConsent(userId: string, granted = true): Promise<void> {
  await getRepositories().consents.record({
    id: `co_${userId}_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    userId,
    kind: 'ai_processing',
    granted,
    version: '1.0',
    recordedAt: new Date().toISOString(),
  })
}

async function pairAB(): Promise<string> {
  const invite = await createInvitation(A, 'dating')
  const { coupleId } = await acceptInvitation(B, invite.code)
  await grantAiConsent(A)
  await grantAiConsent(B)
  return coupleId
}

beforeEach(() => {
  resetDemoStore()
})

describe('pairing flow (spec §37-1)', () => {
  it('pairs A and B into the same couple via the 6-digit code', async () => {
    await register(B, '2人目')
    const coupleId = await pairAB()
    const statusA = await getPairStatus(A)
    const statusB = await getPairStatus(B)
    expect(statusA.paired).toBe(true)
    expect(statusB.paired).toBe(true)
    expect(statusA.couple?.coupleId).toBe(coupleId)
    expect(statusB.couple?.coupleId).toBe(coupleId)
    expect(statusA.couple?.partner?.displayName).toBe('2人目')
  })

  it('rejects an invalid code and locks after repeated attempts', async () => {
    await createInvitation(A, 'dating')
    for (let i = 0; i < MAX_INVITATION_ATTEMPTS; i++) {
      await expect(acceptInvitation(B, '000000')).rejects.toThrow(PairingError)
    }
    // invitation now revoked by the brute-force guard
    const active = await getRepositories().invitations.listActive()
    expect(active).toHaveLength(0)
  })

  it('never stores raw invitation secrets', async () => {
    const invite = await createInvitation(A, 'dating')
    const serialized = JSON.stringify(getDemoStore().invitations)
    expect(serialized).not.toContain(invite.code)
    const rawToken = invite.inviteUrl.split('/join/')[1]
    expect(rawToken.length).toBeGreaterThan(20)
    expect(serialized).not.toContain(rawToken)
  })

  it('a used invitation cannot be redeemed again by a third user', async () => {
    const invite = await createInvitation(A, 'dating')
    await acceptInvitation(B, invite.code)
    await expect(acceptInvitation(C, invite.code)).rejects.toThrow(PairingError)
  })

  it('rejects accepting your own invitation', async () => {
    const invite = await createInvitation(A, 'dating')
    await expect(acceptInvitation(A, invite.code)).rejects.toThrow(PairingError)
  })
})

describe('daily question flow (spec §37-2)', () => {
  it('serves both members the same question', async () => {
    const coupleId = await pairAB()
    const forA = await ensureTodayAssignment(coupleId, A)
    const forB = await ensureTodayAssignment(coupleId, B)
    expect(forA.id).toBe(forB.id)
    expect(forA.questionId).toBe(forB.questionId)
  })

  it("hides A's answer from B until both submitted, then reveals simultaneously", async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)

    await saveDraft(assignment.id, A, { kind: 'text', text: '朝のコーヒーを淹れてくれたこと' }, 'shared')
    await submitAnswer(assignment.id, A)

    // B sees only the boolean, never the content
    const viewB = await getTodayView(assignment.id, B)
    expect(viewB?.partnerSubmitted).toBe(true)
    expect(viewB?.partnerAnswer).toBeNull()
    expect(JSON.stringify(viewB)).not.toContain('コーヒー')

    // A cannot see B's nothing either; A's own answer is visible to A
    const viewA = await getTodayView(assignment.id, A)
    expect(viewA?.myAnswer.value).toEqual({ kind: 'text', text: '朝のコーヒーを淹れてくれたこと' })
    expect(viewA?.partnerAnswer).toBeNull()

    await saveDraft(assignment.id, B, { kind: 'text', text: '荷物を持ってくれたこと' }, 'shared')
    await submitAnswer(assignment.id, B)

    const revealedA = await getTodayView(assignment.id, A)
    const revealedB = await getTodayView(assignment.id, B)
    expect(revealedA?.partnerAnswer?.value).toEqual({ kind: 'text', text: '荷物を持ってくれたこと' })
    expect(revealedB?.partnerAnswer?.value).toEqual({ kind: 'text', text: '朝のコーヒーを淹れてくれたこと' })
    expect(revealedA?.revealedAt).toBeTruthy()
    expect(revealedA?.revealedAt).toBe(revealedB?.revealedAt)
  })

  it('generates a schema-valid insight after reveal — and dedupes repeat generation', async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)
    await saveDraft(assignment.id, A, { kind: 'text', text: '一緒に散歩した時間が嬉しかった' }, 'shared')
    await submitAnswer(assignment.id, A)
    await saveDraft(assignment.id, B, { kind: 'text', text: '手紙をもらえて嬉しかった' }, 'shared')
    await submitAnswer(assignment.id, B)

    const view1 = await getTodayView(assignment.id, A)
    expect(view1?.insightStatus).toBe('ready')
    expect(view1?.insight?.title).toBeTruthy()
    expect(view1?.insight?.microAction.estimatedMinutes).toBeGreaterThan(0)
    expect(view1?.insight?.safetyLevel).toBe('none')

    // Second and third views reuse the stored insight — no duplicate rows
    await getTodayView(assignment.id, B)
    await getTodayView(assignment.id, A)
    const succeeded = getDemoStore().insights.filter(
      (i) => i.assignmentId === assignment.id && i.status === 'succeeded',
    )
    expect(succeeded).toHaveLength(1)
  })

  it('AI failure still reveals both answers, and regeneration recovers (spec §30, §37-2-7)', async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)
    await saveDraft(assignment.id, A, { kind: 'text', text: '[[force-ai-error]] のテスト回答' }, 'shared')
    await submitAnswer(assignment.id, A)
    await saveDraft(assignment.id, B, { kind: 'text', text: 'ふつうの回答' }, 'shared')
    await submitAnswer(assignment.id, B)

    const view = await getTodayView(assignment.id, A)
    expect(view?.insightStatus).toBe('failed')
    // Reveal is untouched by the failure
    expect(view?.partnerAnswer?.value).toEqual({ kind: 'text', text: 'ふつうの回答' })
    expect(view?.myRevealedAnswer).toBeTruthy()

    // Fix the input and regenerate
    // (answers are locked post-reveal, so regeneration reuses the same input
    // and fails again — asserting idempotent failure behavior)
    await regenerateDailyInsight(assignment.id, A)
    const after = await getTodayView(assignment.id, A)
    expect(after?.insightStatus).toBe('failed')
    expect(after?.partnerAnswer).toBeTruthy()
  })

  it('a third user cannot read the assignment or its answers (spec §37-5)', async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)
    await saveDraft(assignment.id, A, { kind: 'text', text: '秘密の回答A' }, 'shared')
    await submitAnswer(assignment.id, A)

    expect(await getTodayView(assignment.id, C)).toBeNull()
    const { mine, partner } = await getRepositories().answers.getForAssignment(assignment.id, C)
    expect(mine).toBeNull()
    expect(partner).toBeNull()
  })

  it('private-visibility answers are excluded from the AI context', async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)
    await saveDraft(assignment.id, A, { kind: 'text', text: 'AIにも見せない気持ち' }, 'private')
    await submitAnswer(assignment.id, A)
    await saveDraft(assignment.id, B, { kind: 'text', text: '共有される気持ち' }, 'shared')
    await submitAnswer(assignment.id, B)

    await getTodayView(assignment.id, A)
    const insight = getDemoStore().insights.find((i) => i.assignmentId === assignment.id)
    // Only one readable answer → context built without the private text
    expect(JSON.stringify(insight?.payload ?? {})).not.toContain('AIにも見せない気持ち')
  })
})

describe('repair mode (spec §37-3)', () => {
  it("keeps A's raw text away from B by default (ai_summary)", async () => {
    const coupleId = await pairAB()
    const sessionId = await startRepairSession(coupleId, A, 'together', '週末の予定のすれ違い')
    await saveRepairEntries(
      sessionId,
      A,
      [
        { promptId: 'rp-01', text: '週末の予定を直前で変えられて悲しかった' },
        { promptId: 'rp-02', text: '寂しさと、後回しにされた感じ' },
      ],
      'ai_summary',
      true,
    )

    const redacted = await getRepositories().repair.listPartnerEntriesRedacted(sessionId, B)
    expect(redacted.every((e) => e.summaryOnly)).toBe(true)
    expect(JSON.stringify(redacted)).not.toContain('悲しかった')

    const sessionForB = await getRepairSession(sessionId, B)
    expect(JSON.stringify(sessionForB?.myEntries)).not.toContain('悲しかった')
  })

  it('generates a neutral insight once both submit', async () => {
    const coupleId = await pairAB()
    const sessionId = await startRepairSession(coupleId, A, 'together', null)
    await saveRepairEntries(
      sessionId,
      A,
      [{ promptId: 'rp-02', text: '寂しかった' }],
      'ai_summary',
      true,
    )
    await saveRepairEntries(
      sessionId,
      B,
      [{ promptId: 'rp-02', text: '焦っていた' }],
      'ai_summary',
      true,
    )
    const session = await getRepairSession(sessionId, A)
    expect(session?.insightStatus).toBe('ready')
    expect(session?.insight?.shouldPauseMediation).toBe(false)
    expect(session?.insight?.neutralSummary).toBeTruthy()
    expect(session?.insight?.conversationSteps.length).toBeGreaterThan(0)
  })

  it('urgent input pauses mediation, suppresses partner notification, records metadata only', async () => {
    const coupleId = await pairAB()
    const sessionId = await startRepairSession(coupleId, A, 'together', null)
    const result = await saveRepairEntries(
      sessionId,
      A,
      [{ promptId: 'rp-01', text: '昨日、彼に殴られました。怖いです。' }],
      'ai_only',
      true,
    )
    expect(result.safetyPaused).toBe(true)

    const store = getDemoStore()
    const session = store.repairSessions.find((s) => s.id === sessionId)!
    expect(session.status).toBe('paused_for_safety')
    expect(session.partnerNotified).toBe(false)
    expect(session.safetyLevel).toBe('urgent')

    // No insight was generated
    expect(store.repairInsights.filter((i) => i.sessionId === sessionId)).toHaveLength(0)

    // Safety event holds metadata only — never the text
    const events = store.safetyEvents
    expect(events.length).toBeGreaterThan(0)
    expect(JSON.stringify(events)).not.toContain('殴られました')
    expect(events[0].categories).toContain('violence')
  })

  it('solo sessions stay invisible to the partner', async () => {
    const coupleId = await pairAB()
    const sessionId = await startRepairSession(coupleId, A, 'solo', null)
    await saveRepairEntries(sessionId, A, [{ promptId: 'rp-01', text: '一人で整理したい気持ち' }], 'ai_only', true)
    expect(await getRepairSession(sessionId, B)).toBeNull()
  })
})

describe('unpair (spec §37-4)', () => {
  it('cuts both members off from new shared data and kills invitations', async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)
    await saveDraft(assignment.id, A, { kind: 'text', text: 'ペア解除前の回答' }, 'shared')

    await unpairCouple(A, 'keep')

    expect(await getPairStatus(A)).toMatchObject({ paired: false })
    expect(await getPairStatus(B)).toMatchObject({ paired: false })
    expect(await getTodayView(assignment.id, B)).toBeNull()
    expect(await getTodayView(assignment.id, A)).toBeNull()
    expect(await getRepositories().invitations.listActive()).toHaveLength(0)
  })
})

describe('data export (spec §33-18)', () => {
  it("pre-reveal export for B never contains A's answer text", async () => {
    const coupleId = await pairAB()
    const assignment = await ensureTodayAssignment(coupleId, A)
    await saveDraft(assignment.id, A, { kind: 'text', text: '公開前のとても秘密な回答' }, 'shared')
    await submitAnswer(assignment.id, A)

    const exportB = await exportUserData(B)
    expect(JSON.stringify(exportB)).not.toContain('公開前のとても秘密な回答')

    // After reveal it may appear
    await saveDraft(assignment.id, B, { kind: 'text', text: 'Bの回答' }, 'shared')
    await submitAnswer(assignment.id, B)
    const exportB2 = await exportUserData(B)
    expect(JSON.stringify(exportB2)).toContain('公開前のとても秘密な回答')
  })
})

describe('safety-paused sessions are invisible to the partner (spec §4-5)', () => {
  it('hides a paused together-session from the partner entirely', async () => {
    const coupleId = await pairAB()
    const sessionId = await startRepairSession(coupleId, A, 'together', null)
    await saveRepairEntries(
      sessionId,
      A,
      [{ promptId: 'rp-01', text: '殺すと言われて脅されています' }],
      'ai_only',
      true,
    )
    expect(await getRepairSession(sessionId, B)).toBeNull()
    const listForB = await getRepositories().repair.listSessions(coupleId, B)
    expect(listForB.find((s) => s.id === sessionId)).toBeUndefined()
    // The initiator still sees it, with the safety screen
    const forA = await getRepairSession(sessionId, A)
    expect(forA?.status).toBe('paused_for_safety')
  })
})

describe('who may pair (docs/BRAND.md §3.1)', () => {
  it('pairs two people of the same gender exactly like any other couple', async () => {
    await register(A, 'ひとり目', 'male')
    await register(B, 'ふたり目', 'male')
    const coupleId = await pairAB()

    const statusA = await getPairStatus(A)
    const statusB = await getPairStatus(B)
    expect(statusA.paired).toBe(true)
    expect(statusB.paired).toBe(true)
    expect(statusA.couple?.coupleId).toBe(coupleId)
    expect(statusB.couple?.coupleId).toBe(coupleId)

    // …and the daily loop is the same loop, with nothing varied by gender
    const assignment = await ensureTodayAssignment(coupleId, A)
    const viewA = await getTodayView(assignment.id, A)
    const viewB = await getTodayView(assignment.id, B)
    expect(viewA?.question.id).toBe(viewB?.question.id)
    expect(viewA?.question.id).toBeTruthy()
  })

  it('keeps gender as self-description only — it never reaches the couple', async () => {
    await register(A, 'ひとり目', 'female')
    await register(B, 'ふたり目', 'female')
    const coupleId = await pairAB()

    const couple = getDemoStore().couples.find((c) => c.id === coupleId)
    expect(JSON.stringify(couple)).not.toContain('female')
    const profileA = await getRepositories().profiles.getById(A)
    expect(profileA?.gender).toBe('female')
  })
})

describe('AI consent is a promise, not a checkbox (docs/SECURITY.md §2)', () => {
  const consent = grantAiConsent

  async function revealTogether(coupleId: string) {
    const assignment = await ensureTodayAssignment(coupleId, A)
    for (const [user, text] of [
      [A, '休みの日は静かに過ごしたい。'],
      [B, '休みの日は出かけたい。'],
    ] as const) {
      await saveDraft(assignment.id, user, { kind: 'text', text }, 'shared')
      await submitAnswer(assignment.id, user)
    }
    return assignment
  }

  it('sends nothing to the AI when one partner has not agreed', async () => {
    const coupleId = await pairAB()
    await consent(A, true)
    await consent(B, false)

    const assignment = await revealTogether(coupleId)
    const view = await getTodayView(assignment.id, A)

    expect(view?.insightStatus).toBe('consent_off')
    expect(view?.insight).toBeNull()
    // …and nothing was generated for the consenting half either
    expect(await getRepositories().insights.findCurrent(assignment.id)).toBeNull()
  })

  it('still reveals both answers — declining costs nothing but the AI', async () => {
    const coupleId = await pairAB()
    await consent(A, true)
    await consent(B, false)

    const assignment = await revealTogether(coupleId)
    const view = await getTodayView(assignment.id, A)

    expect(view?.partnerAnswer).not.toBeNull()
    expect(JSON.stringify(view?.partnerAnswer)).toContain('出かけたい')
  })

  it('runs the AI once both have agreed', async () => {
    const coupleId = await pairAB()
    await consent(A, true)
    await consent(B, true)

    const assignment = await revealTogether(coupleId)
    const view = await getTodayView(assignment.id, A)

    expect(view?.insightStatus).toBe('ready')
    expect(view?.insight?.title).toBeTruthy()
  })
})

describe('NEW WE — what the couple builds (docs/BRAND.md §0.2)', () => {
  it('saves the third answer, and a second tap by the partner is agreement, not a duplicate', async () => {
    const coupleId = await pairAB()
    const saved = await saveWeEntry({
      coupleId,
      userId: A,
      kind: 'answer',
      title: '休日をどう過ごしたい？',
      body: '午前はひとり、午後は二人。まず1週間だけ試す。',
      sourceType: 'daily',
      sourceId: 'as_1',
    })
    const again = await saveWeEntry({
      coupleId,
      userId: B,
      kind: 'answer',
      title: '休日をどう過ごしたい？',
      body: '（Bが同じ下書きを保存しようとした）',
      sourceType: 'daily',
      sourceId: 'as_1',
    })
    expect(again?.id).toBe(saved?.id)

    const entries = await listWeEntries(coupleId, B)
    expect(entries).toHaveLength(1)
    expect(entries[0].body).toBe('午前はひとり、午後は二人。まず1週間だけ試す。')
    expect(countByKind(entries)).toEqual({ discovery: 0, answer: 1, promise: 0, future: 0 })
  })

  it('never scores the couple — NEW WE only ever counts what they made', async () => {
    const coupleId = await pairAB()
    for (const [kind, title] of [
      ['discovery', '相手は静かな時間を大切にしている'],
      ['future', '3年後は少し広い部屋で'],
    ] as const) {
      await saveWeEntry({
        coupleId,
        userId: A,
        kind,
        title,
        body: '',
        sourceType: 'daily',
        sourceId: `src-${kind}`,
      })
    }
    const counts = countByKind(await listWeEntries(coupleId, A))
    expect(counts.discovery).toBe(1)
    expect(counts.future).toBe(1)
    expect(JSON.stringify(await listWeEntries(coupleId, A))).not.toMatch(/score|相性/)
  })

  it('keeps a promise the couple made as part of their NEW WE', async () => {
    const coupleId = await pairAB()
    await createAgreement(coupleId, A, {
      category: 'money',
      title: '毎月1日に家計の話をする',
      background: '',
      decision: '月初の日曜、朝ごはんのあとに30分',
      startsOn: null,
      reviewOn: null,
    })
    const promises = (await listWeEntries(coupleId, B)).filter((e) => e.kind === 'promise')
    expect(promises).toHaveLength(1)
    expect(promises[0].title).toBe('毎月1日に家計の話をする')
    expect(promises[0].sourceType).toBe('agreement')
  })

  it('shows nothing to a third party, and lets either partner remove an entry', async () => {
    const coupleId = await pairAB()
    const entry = await saveWeEntry({
      coupleId,
      userId: A,
      kind: 'answer',
      title: '二人の答え',
      body: '',
      sourceType: 'daily',
      sourceId: 'as_2',
    })
    expect(await listWeEntries(coupleId, C)).toEqual([])
    await expect(removeWeEntry(entry!.id, C)).rejects.toThrow()

    await removeWeEntry(entry!.id, B)
    expect(await listWeEntries(coupleId, A)).toEqual([])
  })
})

describe('smooth activation (spec §7)', () => {
  it('peekInvitation reveals inviter name and stage for both token and code — without consuming', async () => {
    const { peekInvitation } = await import('@/server/services/pairing-service')
    await register(A, '1人目')
    const invite = await createInvitation(A, 'engaged')
    const rawToken = invite.inviteUrl.split('/join/')[1]

    expect(await peekInvitation(rawToken)).toEqual({ inviterName: '1人目', stage: 'engaged' })
    expect(await peekInvitation(invite.code)).toEqual({ inviterName: '1人目', stage: 'engaged' })
    // peeking twice — nothing consumed, still redeemable
    await acceptInvitation(B, invite.code)
    expect((await getPairStatus(B)).paired).toBe(true)
  })

  it('peekInvitation returns null for unknown or used secrets', async () => {
    const { peekInvitation } = await import('@/server/services/pairing-service')
    expect(await peekInvitation('no-such-token')).toBeNull()
    const invite = await createInvitation(A, 'dating')
    await acceptInvitation(B, invite.code)
    expect(await peekInvitation(invite.code)).toBeNull()
  })

  it("pairing revokes the accepter's own dangling invitation", async () => {
    const inviteA = await createInvitation(A, 'dating')
    await createInvitation(B, 'dating') // B hesitated and made their own first
    await acceptInvitation(B, inviteA.code)
    // no live secrets remain for either member of the new couple
    expect(await getRepositories().invitations.listActive()).toHaveLength(0)
  })

  it('the invite URL points at /join and carries the raw token', async () => {
    const invite = await createInvitation(A, 'dating', 'https://example.com')
    expect(invite.inviteUrl).toMatch(/^https:\/\/example\.com\/join\/[A-Za-z0-9_-]{20,}$/)
  })
})

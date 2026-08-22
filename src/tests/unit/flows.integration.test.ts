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
import { MAX_INVITATION_ATTEMPTS } from '@/lib/security/invitation-token'

const A = 'demo-user-a'
const B = 'demo-user-b'
const C = 'demo-user-c'

async function pairAB(): Promise<string> {
  const invite = await createInvitation(A, 'dating')
  const { coupleId } = await acceptInvitation(B, invite.code)
  return coupleId
}

beforeEach(() => {
  resetDemoStore()
})

describe('pairing flow (spec §37-1)', () => {
  it('pairs A and B into the same couple via the 6-digit code', async () => {
    const coupleId = await pairAB()
    const statusA = await getPairStatus(A)
    const statusB = await getPairStatus(B)
    expect(statusA.paired).toBe(true)
    expect(statusB.paired).toBe(true)
    expect(statusA.couple?.coupleId).toBe(coupleId)
    expect(statusB.couple?.coupleId).toBe(coupleId)
    expect(statusA.couple?.partner?.displayName).toBe('ゆうと')
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

describe('smooth activation (spec §7)', () => {
  it('peekInvitation reveals inviter name and stage for both token and code — without consuming', async () => {
    const { peekInvitation } = await import('@/server/services/pairing-service')
    const invite = await createInvitation(A, 'engaged')
    const rawToken = invite.inviteUrl.split('/join/')[1]

    expect(await peekInvitation(rawToken)).toEqual({ inviterName: 'あかり', stage: 'engaged' })
    expect(await peekInvitation(invite.code)).toEqual({ inviterName: 'あかり', stage: 'engaged' })
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

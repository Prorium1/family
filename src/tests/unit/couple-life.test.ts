import { beforeEach, describe, expect, it } from 'vitest'
import { resetDemoStore } from '@/server/repositories/demo/store'
import { getRepositories } from '@/server/repositories'
import { acceptInvitation, createInvitation } from '@/server/services/pairing-service'
import {
  addCoupleDate,
  getDatesView,
  getNextDate,
  nextOccurrence,
  removeCoupleDate,
} from '@/server/services/dates-service'
import { createNote, listNotes, removeNote, saveNote } from '@/server/services/notes-service'
import { getSignalBoard, sendSignal } from '@/server/services/signals-service'
import {
  getCycleView,
  predictNextStart,
  recordCycleStart,
  removeCycleStart,
  setCycleSharing,
} from '@/server/services/cycle-service'
import { localDateKey } from '@/lib/dates'

const A = 'demo-user-a'
const B = 'demo-user-b'
const C = 'demo-user-c'

async function register(userId: string, displayName: string): Promise<void> {
  await getRepositories().profiles.update(userId, { displayName, gender: 'other' })
}

async function pairAB(): Promise<string> {
  const invite = await createInvitation(A, 'dating')
  const { coupleId } = await acceptInvitation(B, invite.code)
  return coupleId
}

const TODAY = localDateKey('Asia/Tokyo')

beforeEach(async () => {
  resetDemoStore()
  await register(A, '一人目')
  await register(B, '二人目')
  await register(C, '第三者')
})

// ── ふたりの予定 ────────────────────────────────────────────────────

describe('ふたりの予定 — 記念日・行事・命日・旅行 (Coupply parity)', () => {
  it('computes the next occurrence of a yearly date, never skipping a year', () => {
    expect(nextOccurrence('2020-05-10', '2026-05-09', true)).toBe('2026-05-10')
    expect(nextOccurrence('2020-05-10', '2026-05-10', true)).toBe('2026-05-10') // today counts
    expect(nextOccurrence('2020-05-10', '2026-05-11', true)).toBe('2027-05-10')
  })

  it('lands a Feb 29 anniversary on Feb 28 in non-leap years', () => {
    expect(nextOccurrence('2024-02-29', '2026-01-01', true)).toBe('2026-02-28')
    expect(nextOccurrence('2024-02-29', '2028-01-01', true)).toBe('2028-02-29')
  })

  it('gives a one-shot date no next occurrence once it is behind us', () => {
    expect(nextOccurrence('2026-01-01', '2026-06-01', false)).toBeNull()
    expect(nextOccurrence('2026-12-31', '2026-06-01', false)).toBe('2026-12-31')
  })

  it('both partners see the date; the closest one leads the home card', async () => {
    const coupleId = await pairAB()
    await addCoupleDate({
      coupleId,
      userId: A,
      kind: 'anniversary',
      title: '付き合いはじめた日',
      date: '2020-01-01',
      repeatsYearly: true,
      note: '',
    })
    await addCoupleDate({
      coupleId,
      userId: A,
      kind: 'reminder',
      title: '指輪を受け取る',
      date: TODAY,
      repeatsYearly: false,
      note: '',
    })
    const forB = await getDatesView(coupleId, B)
    expect(forB.upcoming.map((d) => d.title)).toContain('付き合いはじめた日')
    const next = await getNextDate(coupleId, B)
    expect(next?.title).toBe('指輪を受け取る')
    expect(next?.daysUntil).toBe(0)
  })

  it('counts the anniversary year (◯周年) from the original date', async () => {
    const coupleId = await pairAB()
    await addCoupleDate({
      coupleId,
      userId: B,
      kind: 'anniversary',
      title: '結婚記念日',
      date: '2020-06-01',
      repeatsYearly: true,
      note: '',
    })
    const view = await getDatesView(coupleId, A)
    const anniversary = view.upcoming.find((d) => d.title === '結婚記念日')
    expect(anniversary?.years).toBe(Number(anniversary!.next!.slice(0, 4)) - 2020)
  })

  it('keeps a memorial day plain — remembered, never scored or celebrated', async () => {
    const coupleId = await pairAB()
    await addCoupleDate({
      coupleId,
      userId: A,
      kind: 'memorial',
      title: '祖母の命日',
      date: '2010-03-03',
      repeatsYearly: true,
      note: 'お花を持っていく',
    })
    const view = await getDatesView(coupleId, A)
    const memorial = view.upcoming.find((d) => d.kind === 'memorial')
    expect(memorial).toBeTruthy()
    // no 周年 framing for a memorial day
    expect(memorial?.years).toBeNull()
  })

  it('locks a third party out entirely', async () => {
    const coupleId = await pairAB()
    await addCoupleDate({
      coupleId,
      userId: A,
      kind: 'trip',
      title: '京都',
      date: '2030-11-01',
      repeatsYearly: false,
      note: '',
    })
    const forC = await getDatesView(coupleId, C)
    expect(forC.upcoming).toEqual([])
    expect(forC.past).toEqual([])
  })

  it('either partner can remove a date', async () => {
    const coupleId = await pairAB()
    const created = await addCoupleDate({
      coupleId,
      userId: A,
      kind: 'reminder',
      title: '予約の電話',
      date: '2030-01-01',
      repeatsYearly: false,
      note: '',
    })
    await removeCoupleDate(created.id, B)
    const view = await getDatesView(coupleId, A)
    expect(view.upcoming).toEqual([])
  })
})

// ── ふたりのメモ ────────────────────────────────────────────────────

describe('ふたりのメモ — メモ・旅行計画・もしものとき (Coupply parity)', () => {
  it('a note one person writes, the other can read and edit', async () => {
    const coupleId = await pairAB()
    const note = await createNote({
      coupleId,
      userId: A,
      kind: 'trip',
      title: '秋の京都',
      body: '哲学の道を歩く',
    })
    const forB = await listNotes(coupleId, B)
    expect(forB.map((n) => n.title)).toContain('秋の京都')

    const saved = await saveNote({
      id: note.id,
      viewerUserId: B,
      title: '秋の京都',
      body: '哲学の道を歩く。湯豆腐も。',
    })
    expect(saved?.updatedByUserId).toBe(B)
    const forA = await listNotes(coupleId, A)
    expect(forA[0].body).toContain('湯豆腐')
  })

  it('keeps the emergency note inside the couple, like everything else', async () => {
    const coupleId = await pairAB()
    await createNote({
      coupleId,
      userId: A,
      kind: 'emergency',
      title: 'もしものとき',
      body: '保険はX社、証券番号は自宅の引き出し',
    })
    expect(await listNotes(coupleId, C)).toEqual([])
  })

  it('either partner can delete a note', async () => {
    const coupleId = await pairAB()
    const note = await createNote({
      coupleId,
      userId: A,
      kind: 'memo',
      title: '買いもの',
      body: '',
    })
    await removeNote(note.id, B)
    expect(await listNotes(coupleId, A)).toEqual([])
  })
})

// ── ひとことサイン ──────────────────────────────────────────────────

describe('ひとことサイン — 位置情報なしのチェックイン', () => {
  it('shows each side the latest sign from the other', async () => {
    const coupleId = await pairAB()
    await sendSignal({ coupleId, userId: A, kind: 'heading_out' })
    await sendSignal({ coupleId, userId: A, kind: 'got_home' })
    await sendSignal({ coupleId, userId: B, kind: 'work_done' })

    const forB = await getSignalBoard(coupleId, B)
    expect(forB.partner?.kind).toBe('got_home') // A's latest, not the first
    expect(forB.mine?.kind).toBe('work_done')

    const forA = await getSignalBoard(coupleId, A)
    expect(forA.partner?.kind).toBe('work_done')
  })

  it('a signal carries a kind and a time — nothing else exists to leak', async () => {
    const coupleId = await pairAB()
    const signal = await sendSignal({ coupleId, userId: A, kind: 'good_night' })
    expect(Object.keys(signal).sort()).toEqual(['coupleId', 'createdAt', 'id', 'kind', 'userId'])
  })

  it('shows a third party nothing', async () => {
    const coupleId = await pairAB()
    await sendSignal({ coupleId, userId: A, kind: 'good_morning' })
    const forC = await getSignalBoard(coupleId, C)
    expect(forC.mine).toBeNull()
    expect(forC.partner).toBeNull()
  })
})

// ── からだの周期 ────────────────────────────────────────────────────

describe('からだの周期 — 共有は本人だけが決める', () => {
  it('predicts from the average of recent plausible gaps, as a ごろ', () => {
    const prediction = predictNextStart(['2026-01-01', '2026-01-29', '2026-02-26'])
    expect(prediction?.lastStart).toBe('2026-02-26')
    expect(prediction?.averageIntervalDays).toBe(28)
    expect(prediction?.predictedNext).toBe('2026-03-26')
  })

  it('refuses to guess from one record or implausible gaps', () => {
    expect(predictNextStart(['2026-01-01'])?.predictedNext).toBeNull()
    // a 200-day gap is noise, not a cycle
    expect(predictNextStart(['2025-01-01', '2025-07-20'])?.predictedNext).toBeNull()
    expect(predictNextStart([])).toBeNull()
  })

  it('shows the partner NOTHING until sharing is turned on — then only the estimate', async () => {
    const coupleId = await pairAB()
    await recordCycleStart({ coupleId, userId: A, date: '2026-01-01' })
    await recordCycleStart({ coupleId, userId: A, date: '2026-01-29' })

    // off by default: B cannot even tell records exist
    let forB = await getCycleView(coupleId, B)
    expect(forB.partner).toBeNull()

    await setCycleSharing({ coupleId, userId: A, shared: true })
    forB = await getCycleView(coupleId, B)
    expect(forB.partner?.prediction?.lastStart).toBe('2026-01-29')

    // ...and revocable at any moment
    await setCycleSharing({ coupleId, userId: A, shared: false })
    forB = await getCycleView(coupleId, B)
    expect(forB.partner).toBeNull()
  })

  it('never mixes up whose record is whose', async () => {
    const coupleId = await pairAB()
    await recordCycleStart({ coupleId, userId: A, date: '2026-01-01' })
    await setCycleSharing({ coupleId, userId: A, shared: true })
    const forA = await getCycleView(coupleId, A)
    // A's own view: partner section reflects B (who has nothing), not A's data
    expect(forA.partner).toBeNull()
    expect(forA.mine.starts).toEqual(['2026-01-01'])
  })

  it('lets the owner delete one record, and it is gone from both sides', async () => {
    const coupleId = await pairAB()
    await recordCycleStart({ coupleId, userId: A, date: '2026-01-01' })
    await recordCycleStart({ coupleId, userId: A, date: '2026-01-29' })
    await setCycleSharing({ coupleId, userId: A, shared: true })
    await removeCycleStart({ coupleId, userId: A, date: '2026-01-29' })

    const forA = await getCycleView(coupleId, A)
    expect(forA.mine.starts).toEqual(['2026-01-01'])
    const forB = await getCycleView(coupleId, B)
    expect(forB.partner?.prediction?.lastStart).toBe('2026-01-01')
  })

  it('shows a third party nothing, shared or not', async () => {
    const coupleId = await pairAB()
    await recordCycleStart({ coupleId, userId: A, date: '2026-01-01' })
    await setCycleSharing({ coupleId, userId: A, shared: true })
    const forC = await getCycleView(coupleId, C)
    expect(forC.partner).toBeNull()
    expect(forC.mine.starts).toEqual([])
  })
})

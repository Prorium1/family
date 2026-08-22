import 'server-only'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type {
  Agreement,
  AgreementRevision,
  AiGenerationLog,
  AiInsightRecord,
  AnalyticsEventRecord,
  Answer,
  AnswerRevision,
  ConsentRecord,
  Couple,
  CoupleInvitation,
  CoupleMember,
  JourneyProgress,
  NotificationPreference,
  Profile,
  QuestionAssignment,
  RelationshipManualItemRecord,
  RepairAgreement,
  RepairEntry,
  RepairInsightRecord,
  RepairSession,
  SafetyEvent,
  TimelineEvent,
  UserDataRequest,
  WeeklyCheckin,
  WeeklyCheckinAnswer,
} from '@/types/entities'
import { buildSeedStore } from './seed'

export const DEMO_STORE_VERSION = 1

export interface DemoStore {
  version: number
  profiles: Profile[]
  couples: Couple[]
  coupleMembers: CoupleMember[]
  invitations: CoupleInvitation[]
  assignments: QuestionAssignment[]
  answers: Answer[]
  answerRevisions: AnswerRevision[]
  insights: AiInsightRecord[]
  journeyProgress: JourneyProgress[]
  checkins: WeeklyCheckin[]
  checkinAnswers: WeeklyCheckinAnswer[]
  repairSessions: RepairSession[]
  repairEntries: RepairEntry[]
  repairInsights: RepairInsightRecord[]
  repairAgreements: RepairAgreement[]
  agreements: Agreement[]
  agreementRevisions: AgreementRevision[]
  timeline: TimelineEvent[]
  manualItems: RelationshipManualItemRecord[]
  notificationPreferences: NotificationPreference[]
  consents: ConsentRecord[]
  dataRequests: UserDataRequest[]
  safetyEvents: SafetyEvent[]
  aiLogs: AiGenerationLog[]
  analyticsEvents: AnalyticsEventRecord[]
}

const STORE_KEY = Symbol.for('familyos.demoStore')

type GlobalWithStore = typeof globalThis & {
  [STORE_KEY]?: { store: DemoStore; persistTimer: NodeJS.Timeout | null }
}

function storePath(): string {
  if (process.env.DEMO_STORE_PATH) return process.env.DEMO_STORE_PATH
  // Serverless filesystems are read-only apart from /tmp, so a hosted demo
  // persists there; locally the file sits next to the project.
  return process.env.VERCEL ? '/tmp/family-demo-store.json' : '.demo-store.json'
}

function persistenceEnabled(): boolean {
  return process.env.NODE_ENV !== 'test' && process.env.DEMO_STORE_PERSIST !== 'false'
}

function loadFromDisk(): DemoStore | null {
  if (!persistenceEnabled() || !existsSync(storePath())) return null
  try {
    const parsed = JSON.parse(readFileSync(storePath(), 'utf8')) as DemoStore
    if (parsed?.version !== DEMO_STORE_VERSION || !Array.isArray(parsed.profiles)) return null
    return parsed
  } catch {
    return null
  }
}

function holder(): NonNullable<GlobalWithStore[typeof STORE_KEY]> {
  const g = globalThis as GlobalWithStore
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = { store: loadFromDisk() ?? buildSeedStore(), persistTimer: null }
  }
  return g[STORE_KEY]
}

/**
 * The demo store: a `globalThis` singleton (survives route transitions in one
 * `next start` process and HMR re-evaluation in dev) with debounced JSON
 * persistence so a dev-server restart doesn't lose the walkthrough state.
 */
export function getDemoStore(): DemoStore {
  return holder().store
}

function schedulePersist(): void {
  if (!persistenceEnabled()) return
  const h = holder()
  if (h.persistTimer) return
  h.persistTimer = setTimeout(() => {
    h.persistTimer = null
    try {
      writeFileSync(storePath(), JSON.stringify(h.store))
    } catch (error) {
      console.warn('[demo-store] persist failed:', (error as Error).message)
    }
  }, 250)
}

/** All demo-driver writes go through here so persistence stays consistent. */
export function mutateDemoStore<T>(fn: (store: DemoStore) => T): T {
  const result = fn(holder().store)
  schedulePersist()
  return result
}

/** Rebuild from seed — used by the demo reset endpoint and tests. */
export function resetDemoStore(): void {
  const h = holder()
  h.store = buildSeedStore()
  if (persistenceEnabled()) {
    try {
      writeFileSync(storePath(), JSON.stringify(h.store))
    } catch {
      /* ignore */
    }
  }
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

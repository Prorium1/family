import type {
  AgreementStatus,
  AssignmentStatus,
  Confidence,
  CoupleStatus,
  FutureCategory,
  JourneyProgressStatus,
  LocaleCode,
  ManualSourceType,
  QuestionCategory,
  QuestionFormat,
  RelationshipStage,
  RepairMode,
  RepairSessionStatus,
  SafetyCategory,
  SafetyLevel,
  SensitivityLevel,
  VisibilityLevel,
} from './domain'

/**
 * Persistence-level entities. Everything is JSON-serializable (string ids,
 * ISO-8601 timestamps) so the demo driver can round-trip through a JSON file
 * and the Supabase driver can map rows 1:1.
 */

export interface Profile {
  id: string
  displayName: string
  email: string
  locale: LocaleCode
  timezone: string
  ageConfirmed: boolean
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface Couple {
  id: string
  status: CoupleStatus
  relationshipStage: RelationshipStage
  anniversary: string | null // date the two started dating, if shared
  pairedAt: string | null
  unpairedAt: string | null
  createdAt: string
}

export interface CoupleMember {
  coupleId: string
  userId: string
  role: 'member'
  active: boolean
  joinedAt: string
  leftAt: string | null
}

export interface CoupleInvitation {
  id: string
  inviterUserId: string
  /** HMAC-SHA256 of the raw link token — raw value is never stored. */
  tokenHash: string
  /** HMAC-SHA256 of the 6-digit code. */
  codeHash: string
  relationshipStage: RelationshipStage
  expiresAt: string
  usedAt: string | null
  usedByUserId: string | null
  revokedAt: string | null
  /** failed redemption attempts, for brute-force lockout */
  attemptCount: number
  createdAt: string
}

export interface Question {
  id: string
  packId: string
  format: QuestionFormat
  category: QuestionCategory
  stages: RelationshipStage[] | 'all'
  difficulty: 1 | 2 | 3
  sensitivity: SensitivityLevel
  estimatedMinutes: number
  /** 0 = Sunday … 6 = Saturday; null = any day */
  preferredWeekday: number | null
  prerequisiteQuestionId: string | null
  locale: LocaleCode
  version: number
  premium: boolean
  active: boolean
  aiFollowUpAllowed: boolean
  text: string
  helper?: string
  options?: string[]
}

export interface QuestionPack {
  id: string
  slug: string
  title: string
  description: string
  active: boolean
}

export interface QuestionAssignment {
  id: string
  coupleId: string
  questionId: string
  /** 'daily' | journey step reference | weekly checkin */
  source: 'daily' | 'journey' | 'weekly_checkin'
  journeyStepId: string | null
  assignedDate: string // YYYY-MM-DD in the couple's day
  status: AssignmentStatus
  statusHistory: Array<{ status: AssignmentStatus; at: string }>
  revealedAt: string | null
  insightError: string | null
  createdAt: string
}

export interface Answer {
  id: string
  assignmentId: string
  coupleId: string
  userId: string
  /** structured by format: text for free text, selection(s), scale value… */
  value: AnswerValue
  visibility: VisibilityLevel
  submitted: boolean
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export type AnswerValue =
  | { kind: 'text'; text: string }
  | { kind: 'choice'; selected: string[] }
  | { kind: 'scale'; value: 1 | 2 | 3 | 4 | 5 }
  | { kind: 'ranking'; ordered: string[] }

export interface AnswerRevision {
  id: string
  answerId: string
  value: AnswerValue
  editedAt: string
}

export interface AiInsightRecord {
  id: string
  coupleId: string
  assignmentId: string
  kind: 'daily'
  schemaVersion: number
  inputHash: string
  attempt: number
  isCurrent: boolean
  status: 'generating' | 'succeeded' | 'failed'
  /** validated DailyInsight JSON when succeeded */
  payload: unknown | null
  createdAt: string
}

export interface Journey {
  id: string
  slug: string
  title: string
  description: string
  stageHint: RelationshipStage[] | 'all'
  premium: boolean
  active: boolean
  order: number
}

export interface JourneyStep {
  id: string
  journeyId: string
  order: number
  title: string
  questionId: string
}

export interface JourneyProgress {
  id: string
  coupleId: string
  journeyId: string
  status: JourneyProgressStatus
  completedStepIds: string[]
  startedAt: string | null
  completedAt: string | null
}

export interface WeeklyCheckin {
  id: string
  coupleId: string
  /** ISO week key e.g. 2026-W34 */
  weekKey: string
  status: 'open' | 'waiting_partner' | 'revealed' | 'completed'
  revealedAt: string | null
  createdAt: string
}

export interface WeeklyCheckinAnswer {
  id: string
  checkinId: string
  userId: string
  answers: Array<{ questionId: string; text: string }>
  submitted: boolean
  submittedAt: string | null
}

export interface RepairSession {
  id: string
  coupleId: string
  initiatorUserId: string
  mode: RepairMode
  status: RepairSessionStatus
  topic: string | null
  safetyLevel: SafetyLevel
  safetyCategories: SafetyCategory[]
  /** never auto-notify the partner when safety pauses the flow */
  partnerNotified: boolean
  createdAt: string
  closedAt: string | null
}

export interface RepairEntry {
  id: string
  sessionId: string
  userId: string
  promptId: string
  text: string
  visibility: VisibilityLevel
  /** excerpts explicitly chosen by the author for the partner */
  sharedExcerpts: string[]
  submitted: boolean
  createdAt: string
  updatedAt: string
}

export interface RepairInsightRecord {
  id: string
  sessionId: string
  schemaVersion: number
  inputHash: string
  attempt: number
  isCurrent: boolean
  status: 'generating' | 'succeeded' | 'failed'
  payload: unknown | null
  createdAt: string
}

export interface RepairAgreement {
  id: string
  sessionId: string
  coupleId: string
  text: string
  agreedByUserIds: string[]
  createdAt: string
}

export interface Agreement {
  id: string
  coupleId: string
  category: FutureCategory
  title: string
  background: string
  decision: string
  startsOn: string | null
  reviewOn: string | null
  status: AgreementStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface AgreementRevision {
  id: string
  agreementId: string
  title: string
  background: string
  decision: string
  comment: string | null
  editedByUserId: string
  editedAt: string
}

export interface TimelineEvent {
  id: string
  coupleId: string
  kind:
    | 'app_started'
    | 'paired'
    | 'journey_completed'
    | 'agreement_created'
    | 'marriage_talk_started'
    | 'marriage_declaration'
    | 'engaged'
    | 'married'
    | 'moved'
    | 'pregnancy'
    | 'birth'
    | 'custom'
  title: string
  date: string
  createdAt: string
}

export interface Memory {
  id: string
  coupleId: string
  title: string
  note: string
  date: string
  createdByUserId: string
  createdAt: string
}

export interface RelationshipManualItemRecord {
  id: string
  coupleId: string
  /** the person this item describes */
  subjectUserId: string
  category: string
  statement: string
  sourceType: ManualSourceType
  sourceIds: string[]
  confidence: Confidence
  confirmedByUserIds: string[]
  createdAt: string
  updatedAt: string
}

export interface RelationshipSummary {
  id: string
  coupleId: string
  summary: string
  sourceIds: string[]
  updatedAt: string
}

export interface NotificationPreference {
  userId: string
  dailyQuestion: boolean
  bothRevealed: boolean
  weeklyCheckin: boolean
  gratitudeReceived: boolean
  /** HH:MM local */
  preferredTime: string
  /** couple-level quiet window label — "二人の時間" */
  coupleTimeStart: string | null
  coupleTimeEnd: string | null
}

export interface ConsentRecord {
  id: string
  userId: string
  kind: 'terms' | 'ai_processing' | 'ai_training'
  granted: boolean
  version: string
  recordedAt: string
}

export interface UserDataRequest {
  id: string
  userId: string
  kind: 'export' | 'deletion'
  status: 'pending' | 'completed' | 'cancelled'
  requestedAt: string
  completedAt: string | null
}

export interface SafetyEvent {
  id: string
  userId: string
  coupleId: string | null
  context: 'daily_answer' | 'repair_entry' | 'weekly_checkin' | 'ai_output'
  level: SafetyLevel
  categories: SafetyCategory[]
  /** metadata only — never the text that triggered the event */
  createdAt: string
}

export interface AuditLog {
  id: string
  actorUserId: string | null
  action: string
  targetType: string
  targetId: string
  createdAt: string
}

/** §22: metadata only, never answer text. */
export interface AiGenerationLog {
  id: string
  requestId: string
  userId: string | null
  coupleId: string | null
  kind: 'daily_insight' | 'repair_insight' | 'weekly_summary' | 'relationship_manual'
  model: string
  inputTokens: number | null
  outputTokens: number | null
  success: boolean
  durationMs: number
  schemaVersion: number
  errorCode: string | null
  createdAt: string
}

export interface AnalyticsEventRecord {
  id: string
  name: string
  props: Record<string, string | number | boolean>
  createdAt: string
}

export interface FeatureFlagRecord {
  key: string
  enabled: boolean
  updatedAt: string
}

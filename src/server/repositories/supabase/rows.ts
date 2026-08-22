import type {
  Agreement,
  AgreementRevision,
  Answer,
  AnswerValue,
  AiInsightRecord,
  ConsentRecord,
  Couple,
  CoupleInvitation,
  CoupleMember,
  Journey,
  JourneyProgress,
  JourneyStep,
  NotificationPreference,
  Profile,
  Question,
  QuestionAssignment,
  RelationshipManualItemRecord,
  RepairAgreement,
  RepairEntry,
  RepairInsightRecord,
  RepairSession,
  TimelineEvent,
  UserDataRequest,
  WeeklyCheckin,
  WeeklyCheckinAnswer,
} from '@/types/entities'
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
} from '@/types/domain'

/**
 * snake_case row shapes (as returned by PostgREST) and mappers to the
 * camelCase entities the rest of the app uses. Kept in one reviewed module so
 * schema drift shows up here, not scattered across the driver.
 */

export interface ProfileRow {
  id: string
  display_name: string
  gender: string | null
  locale: string
  timezone: string
  age_confirmed: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export function mapProfile(row: ProfileRow, email = ''): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    email,
    gender: (row.gender as Profile['gender']) ?? null,
    locale: row.locale as LocaleCode,
    timezone: row.timezone,
    ageConfirmed: row.age_confirmed,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface CoupleRow {
  id: string
  status: string
  relationship_stage: string
  anniversary: string | null
  paired_at: string | null
  unpaired_at: string | null
  created_at: string
}

export function mapCouple(row: CoupleRow): Couple {
  return {
    id: row.id,
    status: row.status as CoupleStatus,
    relationshipStage: row.relationship_stage as RelationshipStage,
    anniversary: row.anniversary,
    pairedAt: row.paired_at,
    unpairedAt: row.unpaired_at,
    createdAt: row.created_at,
  }
}

export interface CoupleMemberRow {
  couple_id: string
  user_id: string
  role: string
  active: boolean
  joined_at: string
  left_at: string | null
}

export function mapMember(row: CoupleMemberRow): CoupleMember {
  return {
    coupleId: row.couple_id,
    userId: row.user_id,
    role: 'member',
    active: row.active,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
  }
}

export interface InvitationRow {
  id: string
  inviter_user_id: string
  token_hash: string
  code_hash: string
  relationship_stage: string
  expires_at: string
  used_at: string | null
  used_by_user_id: string | null
  revoked_at: string | null
  attempt_count: number
  created_at: string
}

export function mapInvitation(row: InvitationRow): CoupleInvitation {
  return {
    id: row.id,
    inviterUserId: row.inviter_user_id,
    tokenHash: row.token_hash,
    codeHash: row.code_hash,
    relationshipStage: row.relationship_stage as RelationshipStage,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    usedByUserId: row.used_by_user_id,
    revokedAt: row.revoked_at,
    attemptCount: row.attempt_count,
    createdAt: row.created_at,
  }
}

export interface QuestionRow {
  id: string
  pack_id: string
  format: string
  category: string
  stages: string[]
  difficulty: number
  sensitivity: number
  estimated_minutes: number
  preferred_weekday: number | null
  prerequisite_question_id: string | null
  locale: string
  version: number
  premium: boolean
  active: boolean
  ai_follow_up_allowed: boolean
  text: string
  helper: string | null
  options: string[] | null
}

export function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    packId: row.pack_id,
    format: row.format as QuestionFormat,
    category: row.category as QuestionCategory,
    stages: row.stages.length === 0 ? 'all' : (row.stages as RelationshipStage[]),
    difficulty: row.difficulty as 1 | 2 | 3,
    sensitivity: row.sensitivity as SensitivityLevel,
    estimatedMinutes: row.estimated_minutes,
    preferredWeekday: row.preferred_weekday,
    prerequisiteQuestionId: row.prerequisite_question_id,
    locale: row.locale as LocaleCode,
    version: row.version,
    premium: row.premium,
    active: row.active,
    aiFollowUpAllowed: row.ai_follow_up_allowed,
    text: row.text,
    helper: row.helper ?? undefined,
    options: row.options ?? undefined,
  }
}

export interface AssignmentRow {
  id: string
  couple_id: string
  question_id: string
  source: string
  journey_step_id: string | null
  assigned_date: string
  status: string
  status_history: Array<{ status: AssignmentStatus; at: string }>
  revealed_at: string | null
  insight_error: string | null
  created_at: string
}

export function mapAssignment(row: AssignmentRow): QuestionAssignment {
  return {
    id: row.id,
    coupleId: row.couple_id,
    questionId: row.question_id,
    source: row.source as QuestionAssignment['source'],
    journeyStepId: row.journey_step_id,
    assignedDate: row.assigned_date,
    status: row.status as AssignmentStatus,
    statusHistory: row.status_history ?? [],
    revealedAt: row.revealed_at,
    insightError: row.insight_error,
    createdAt: row.created_at,
  }
}

export interface AnswerRow {
  id: string
  assignment_id: string
  couple_id: string
  user_id: string
  value: AnswerValue
  visibility: string
  submitted: boolean
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export function mapAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    coupleId: row.couple_id,
    userId: row.user_id,
    value: row.value,
    visibility: row.visibility as VisibilityLevel,
    submitted: row.submitted,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface InsightRow {
  id: string
  couple_id: string
  assignment_id: string
  kind: string
  schema_version: number
  input_hash: string
  attempt: number
  is_current: boolean
  status: string
  payload: unknown | null
  created_at: string
}

export function mapInsight(row: InsightRow): AiInsightRecord {
  return {
    id: row.id,
    coupleId: row.couple_id,
    assignmentId: row.assignment_id,
    kind: 'daily',
    schemaVersion: row.schema_version,
    inputHash: row.input_hash,
    attempt: row.attempt,
    isCurrent: row.is_current,
    status: row.status as AiInsightRecord['status'],
    payload: row.payload,
    createdAt: row.created_at,
  }
}

export interface JourneyRow {
  id: string
  slug: string
  title: string
  description: string
  stage_hint: string[]
  premium: boolean
  active: boolean
  order: number
}

export function mapJourney(row: JourneyRow): Journey {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    stageHint: row.stage_hint.length === 0 ? 'all' : (row.stage_hint as RelationshipStage[]),
    premium: row.premium,
    active: row.active,
    order: row.order,
  }
}

export interface JourneyStepRow {
  id: string
  journey_id: string
  order: number
  title: string
  question_id: string
}

export function mapJourneyStep(row: JourneyStepRow): JourneyStep {
  return {
    id: row.id,
    journeyId: row.journey_id,
    order: row.order,
    title: row.title,
    questionId: row.question_id,
  }
}

export interface JourneyProgressRow {
  id: string
  couple_id: string
  journey_id: string
  status: string
  completed_step_ids: string[]
  started_at: string | null
  completed_at: string | null
}

export function mapJourneyProgress(row: JourneyProgressRow): JourneyProgress {
  return {
    id: row.id,
    coupleId: row.couple_id,
    journeyId: row.journey_id,
    status: row.status as JourneyProgressStatus,
    completedStepIds: row.completed_step_ids ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }
}

export interface CheckinRow {
  id: string
  couple_id: string
  week_key: string
  status: string
  revealed_at: string | null
  created_at: string
}

export function mapCheckin(row: CheckinRow): WeeklyCheckin {
  return {
    id: row.id,
    coupleId: row.couple_id,
    weekKey: row.week_key,
    status: row.status as WeeklyCheckin['status'],
    revealedAt: row.revealed_at,
    createdAt: row.created_at,
  }
}

export interface CheckinAnswerRow {
  id: string
  checkin_id: string
  user_id: string
  answers: Array<{ questionId: string; text: string }>
  submitted: boolean
  submitted_at: string | null
}

export function mapCheckinAnswer(row: CheckinAnswerRow): WeeklyCheckinAnswer {
  return {
    id: row.id,
    checkinId: row.checkin_id,
    userId: row.user_id,
    answers: row.answers ?? [],
    submitted: row.submitted,
    submittedAt: row.submitted_at,
  }
}

export interface RepairSessionRow {
  id: string
  couple_id: string
  initiator_user_id: string
  mode: string
  status: string
  topic: string | null
  safety_level: string
  safety_categories: string[]
  partner_notified: boolean
  created_at: string
  closed_at: string | null
}

export function mapRepairSession(row: RepairSessionRow): RepairSession {
  return {
    id: row.id,
    coupleId: row.couple_id,
    initiatorUserId: row.initiator_user_id,
    mode: row.mode as RepairMode,
    status: row.status as RepairSessionStatus,
    topic: row.topic,
    safetyLevel: row.safety_level as SafetyLevel,
    safetyCategories: (row.safety_categories ?? []) as SafetyCategory[],
    partnerNotified: row.partner_notified,
    createdAt: row.created_at,
    closedAt: row.closed_at,
  }
}

export interface RepairEntryRow {
  id: string
  session_id: string
  user_id: string
  prompt_id: string
  text: string
  visibility: string
  shared_excerpts: string[]
  submitted: boolean
  created_at: string
  updated_at: string
}

export function mapRepairEntry(row: RepairEntryRow): RepairEntry {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    promptId: row.prompt_id,
    text: row.text,
    visibility: row.visibility as VisibilityLevel,
    sharedExcerpts: row.shared_excerpts ?? [],
    submitted: row.submitted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface RepairInsightRow {
  id: string
  session_id: string
  schema_version: number
  input_hash: string
  attempt: number
  is_current: boolean
  status: string
  payload: unknown | null
  created_at: string
}

export function mapRepairInsight(row: RepairInsightRow): RepairInsightRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    schemaVersion: row.schema_version,
    inputHash: row.input_hash,
    attempt: row.attempt,
    isCurrent: row.is_current,
    status: row.status as RepairInsightRecord['status'],
    payload: row.payload,
    createdAt: row.created_at,
  }
}

export interface RepairAgreementRow {
  id: string
  session_id: string
  couple_id: string
  text: string
  agreed_by_user_ids: string[]
  created_at: string
}

export function mapRepairAgreement(row: RepairAgreementRow): RepairAgreement {
  return {
    id: row.id,
    sessionId: row.session_id,
    coupleId: row.couple_id,
    text: row.text,
    agreedByUserIds: row.agreed_by_user_ids ?? [],
    createdAt: row.created_at,
  }
}

export interface AgreementRow {
  id: string
  couple_id: string
  category: string
  title: string
  background: string
  decision: string
  starts_on: string | null
  review_on: string | null
  status: string
  created_by_user_id: string
  created_at: string
  updated_at: string
}

export function mapAgreement(row: AgreementRow): Agreement {
  return {
    id: row.id,
    coupleId: row.couple_id,
    category: row.category as FutureCategory,
    title: row.title,
    background: row.background,
    decision: row.decision,
    startsOn: row.starts_on,
    reviewOn: row.review_on,
    status: row.status as AgreementStatus,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface AgreementRevisionRow {
  id: string
  agreement_id: string
  title: string
  background: string
  decision: string
  comment: string | null
  edited_by_user_id: string
  edited_at: string
}

export function mapAgreementRevision(row: AgreementRevisionRow): AgreementRevision {
  return {
    id: row.id,
    agreementId: row.agreement_id,
    title: row.title,
    background: row.background,
    decision: row.decision,
    comment: row.comment,
    editedByUserId: row.edited_by_user_id,
    editedAt: row.edited_at,
  }
}

export interface TimelineRow {
  id: string
  couple_id: string
  kind: string
  title: string
  date: string
  created_at: string
}

export function mapTimeline(row: TimelineRow): TimelineEvent {
  return {
    id: row.id,
    coupleId: row.couple_id,
    kind: row.kind as TimelineEvent['kind'],
    title: row.title,
    date: row.date,
    createdAt: row.created_at,
  }
}

export interface ManualItemRow {
  id: string
  couple_id: string
  subject_user_id: string
  category: string
  statement: string
  source_type: string
  source_ids: string[]
  confidence: string
  confirmed_by_user_ids: string[]
  created_at: string
  updated_at: string
}

export function mapManualItem(row: ManualItemRow): RelationshipManualItemRecord {
  return {
    id: row.id,
    coupleId: row.couple_id,
    subjectUserId: row.subject_user_id,
    category: row.category,
    statement: row.statement,
    sourceType: row.source_type as ManualSourceType,
    sourceIds: row.source_ids ?? [],
    confidence: row.confidence as Confidence,
    confirmedByUserIds: row.confirmed_by_user_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface NotificationPreferenceRow {
  user_id: string
  daily_question: boolean
  both_revealed: boolean
  weekly_checkin: boolean
  gratitude_received: boolean
  preferred_time: string
  couple_time_start: string | null
  couple_time_end: string | null
}

export function mapNotificationPreference(row: NotificationPreferenceRow): NotificationPreference {
  return {
    userId: row.user_id,
    dailyQuestion: row.daily_question,
    bothRevealed: row.both_revealed,
    weeklyCheckin: row.weekly_checkin,
    gratitudeReceived: row.gratitude_received,
    preferredTime: row.preferred_time,
    coupleTimeStart: row.couple_time_start,
    coupleTimeEnd: row.couple_time_end,
  }
}

export interface ConsentRow {
  id: string
  user_id: string
  kind: string
  granted: boolean
  version: string
  recorded_at: string
}

export function mapConsent(row: ConsentRow): ConsentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as ConsentRecord['kind'],
    granted: row.granted,
    version: row.version,
    recordedAt: row.recorded_at,
  }
}

export interface DataRequestRow {
  id: string
  user_id: string
  kind: string
  status: string
  requested_at: string
  completed_at: string | null
}

export function mapDataRequest(row: DataRequestRow): UserDataRequest {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as UserDataRequest['kind'],
    status: row.status as UserDataRequest['status'],
    requestedAt: row.requested_at,
    completedAt: row.completed_at,
  }
}

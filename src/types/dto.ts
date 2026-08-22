import type { AssignmentStatus, RelationshipStage, SafetyLevel, VisibilityLevel } from './domain'
import type { AnswerValue } from './entities'
import type { DailyInsight, RepairInsight } from '@/lib/validation/ai-insight'

/**
 * View models crossing the server → client boundary. The shapes themselves
 * make pre-reveal leakage impossible: a partner's answer only exists on a DTO
 * once the assignment is revealed — before that the field is `null` and the
 * text never enters the RSC payload.
 */

export interface SessionDTO {
  userId: string
  displayName: string
  coupleId: string | null
  isAdmin: boolean
  onboarded: boolean
}

export interface PartnerDTO {
  userId: string
  displayName: string
}

export interface CoupleSummaryDTO {
  coupleId: string
  relationshipStage: RelationshipStage
  partner: PartnerDTO | null
  pairedAt: string | null
  daysTogether: number | null
}

export interface RevealedAnswerDTO {
  userId: string
  displayName: string
  value: AnswerValue
  submittedAt: string | null
}

export interface TodayViewDTO {
  assignmentId: string
  status: AssignmentStatus
  question: {
    id: string
    text: string
    helper: string | null
    format: string
    options: string[] | null
    category: string
    estimatedMinutes: number
  }
  myAnswer: {
    value: AnswerValue | null
    visibility: VisibilityLevel
    submitted: boolean
  }
  /** true/false only — never the content — until reveal */
  partnerSubmitted: boolean
  partnerAnswer: RevealedAnswerDTO | null
  myRevealedAnswer: RevealedAnswerDTO | null
  insight: DailyInsight | null
  insightStatus: 'none' | 'generating' | 'ready' | 'failed'
  revealedAt: string | null
}

export interface PairStatusDTO {
  paired: boolean
  couple: CoupleSummaryDTO | null
  pendingInvitation: {
    id: string
    inviteUrl: string
    code: string
    expiresAt: string
  } | null
}

export interface JourneyListItemDTO {
  id: string
  slug: string
  title: string
  description: string
  premium: boolean
  totalSteps: number
  completedSteps: number
  status: string
}

export interface JourneyDetailDTO extends JourneyListItemDTO {
  steps: Array<{
    id: string
    order: number
    title: string
    questionText: string
    completed: boolean
    assignmentId: string | null
    current: boolean
  }>
}

export interface WeeklyCheckinDTO {
  checkinId: string
  weekKey: string
  status: 'open' | 'waiting_partner' | 'revealed' | 'completed'
  questions: Array<{ id: string; text: string }>
  myAnswers: Array<{ questionId: string; text: string }> | null
  mySubmitted: boolean
  partnerSubmitted: boolean
  partnerAnswers: Array<{ questionId: string; text: string }> | null
  partnerName: string | null
}

export interface RepairEntryDTO {
  promptId: string
  text: string
  visibility: VisibilityLevel
  submitted: boolean
}

export interface RepairPartnerViewDTO {
  /** what the partner is allowed to see, post visibility filtering */
  summaryOnly: boolean
  excerpts: string[]
  sharedText: string | null
}

export interface RepairSessionDTO {
  sessionId: string
  mode: string
  status: string
  topic: string | null
  isInitiator: boolean
  safetyLevel: SafetyLevel
  myEntries: RepairEntryDTO[]
  mySubmitted: boolean
  partnerJoined: boolean
  partnerSubmitted: boolean
  insight: RepairInsight | null
  insightStatus: 'none' | 'generating' | 'ready' | 'failed'
  agreements: Array<{ id: string; text: string; agreedByMe: boolean; agreedByPartner: boolean }>
}

export interface AgreementDTO {
  id: string
  category: string
  title: string
  background: string
  decision: string
  startsOn: string | null
  reviewOn: string | null
  status: string
  revisions: Array<{
    editedAt: string
    comment: string | null
  }>
}

export interface StoryDTO {
  couple: CoupleSummaryDTO
  stats: {
    conversationsCompleted: number
    gratitudeShared: number
    agreementsMade: number
    journeysCompleted: number
  }
  timeline: Array<{ id: string; kind: string; title: string; date: string }>
  recentGratitude: string[]
  sharedValues: string[]
}

export interface ManualItemDTO {
  id: string
  subjectUserId: string
  subjectName: string
  category: string
  statement: string
  sourceType: string
  confidence: string
  confirmedByMe: boolean
  confirmedByPartner: boolean
}

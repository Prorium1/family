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
  SafetyEvent,
  TimelineEvent,
  UserDataRequest,
  WeeklyCheckin,
  WeeklyCheckinAnswer,
} from '@/types/entities'
import type { RelationshipStage } from '@/types/domain'

/**
 * Driver-agnostic persistence contract. The demo (in-memory) and Supabase
 * drivers both implement this; services never see which one is active.
 *
 * Authorization note: methods that take a `viewerUserId` apply the reveal /
 * visibility policies INSIDE the driver, so a partner answer that isn't
 * revealed yet simply never crosses this boundary.
 */
export interface Repositories {
  profiles: {
    getById(id: string): Promise<Profile | null>
    /** Create the profile on first login when it does not exist yet. */
    ensure(id: string, defaults: { displayName: string; email: string }): Promise<Profile>
    update(id: string, patch: Partial<Pick<Profile, 'displayName' | 'locale' | 'timezone' | 'ageConfirmed'>>): Promise<Profile>
  }
  couples: {
    getForUser(userId: string): Promise<{ couple: Couple; members: CoupleMember[] } | null>
    getById(coupleId: string, viewerUserId: string): Promise<{ couple: Couple; members: CoupleMember[] } | null>
    create(input: { stage: RelationshipStage; userIds: [string, string] }): Promise<Couple>
    updateStage(coupleId: string, viewerUserId: string, stage: RelationshipStage): Promise<void>
    unpair(coupleId: string, requestedByUserId: string): Promise<void>
  }
  invitations: {
    create(invitation: CoupleInvitation): Promise<CoupleInvitation>
    getActiveForInviter(inviterUserId: string): Promise<CoupleInvitation | null>
    findByTokenHash(tokenHash: string): Promise<CoupleInvitation | null>
    /**
     * Anonymous-safe preview for the /join landing: who invited me, into
     * which stage. Never returns hashes and never consumes the invitation.
     */
    peekBySecretHash(
      secretHash: string,
    ): Promise<{ inviterName: string; stage: RelationshipStage } | null>
    findByCodeHash(codeHash: string): Promise<CoupleInvitation | null>
    listActive(): Promise<CoupleInvitation[]>
    recordFailedAttempt(invitationId: string): Promise<number>
    markUsed(invitationId: string, usedByUserId: string): Promise<void>
    revoke(invitationId: string, inviterUserId: string): Promise<void>
  }
  questions: {
    getById(id: string): Promise<Question | null>
    listActive(): Promise<Question[]>
  }
  assignments: {
    getById(assignmentId: string, viewerUserId: string): Promise<QuestionAssignment | null>
    getTodayForCouple(coupleId: string, viewerUserId: string, date: string): Promise<QuestionAssignment | null>
    findByStep(coupleId: string, journeyStepId: string, viewerUserId: string): Promise<QuestionAssignment | null>
    listForCouple(coupleId: string, viewerUserId: string): Promise<QuestionAssignment[]>
    create(assignment: QuestionAssignment): Promise<QuestionAssignment>
    save(assignment: QuestionAssignment): Promise<QuestionAssignment>
  }
  answers: {
    /**
     * Returns the viewer's own answer plus the partner's answer ONLY when the
     * assignment is revealed; before that `partner` is null and
     * `partnerSubmitted` is the only signal that crosses the boundary.
     */
    getForAssignment(
      assignmentId: string,
      viewerUserId: string,
    ): Promise<{ mine: Answer | null; partner: Answer | null; partnerSubmitted: boolean }>
    saveDraft(answer: Answer): Promise<Answer>
    submit(answerId: string, viewerUserId: string, at: string): Promise<void>
    listRevisions(answerId: string, viewerUserId: string): Promise<AnswerRevision[]>
    addRevision(revision: AnswerRevision): Promise<void>
    /** All revealed answers for a couple, for story/export. Applies reveal policy. */
    listRevealedForCouple(coupleId: string, viewerUserId: string): Promise<Answer[]>
    /** The viewer's own answers regardless of reveal state (export). */
    listOwn(userId: string): Promise<Answer[]>
  }
  insights: {
    findCurrent(assignmentId: string): Promise<AiInsightRecord | null>
    findByInputHash(assignmentId: string, inputHash: string): Promise<AiInsightRecord | null>
    create(record: AiInsightRecord): Promise<AiInsightRecord>
    save(record: AiInsightRecord): Promise<AiInsightRecord>
  }
  journeys: {
    listActive(): Promise<Journey[]>
    getBySlug(slug: string): Promise<Journey | null>
    stepsFor(journeyId: string): Promise<JourneyStep[]>
    getProgress(coupleId: string, journeyId: string, viewerUserId: string): Promise<JourneyProgress | null>
    listProgress(coupleId: string, viewerUserId: string): Promise<JourneyProgress[]>
    saveProgress(progress: JourneyProgress, viewerUserId: string): Promise<JourneyProgress>
  }
  checkins: {
    getForWeek(coupleId: string, weekKey: string, viewerUserId: string): Promise<WeeklyCheckin | null>
    create(checkin: WeeklyCheckin): Promise<WeeklyCheckin>
    save(checkin: WeeklyCheckin): Promise<WeeklyCheckin>
    /** Same reveal discipline as daily answers. */
    getAnswers(
      checkinId: string,
      viewerUserId: string,
    ): Promise<{ mine: WeeklyCheckinAnswer | null; partner: WeeklyCheckinAnswer | null; partnerSubmitted: boolean }>
    saveAnswers(answer: WeeklyCheckinAnswer): Promise<WeeklyCheckinAnswer>
  }
  repair: {
    getSession(sessionId: string, viewerUserId: string): Promise<RepairSession | null>
    listSessions(coupleId: string, viewerUserId: string): Promise<RepairSession[]>
    createSession(session: RepairSession): Promise<RepairSession>
    saveSession(session: RepairSession): Promise<RepairSession>
    /** Own entries only — partner entries never come back raw from here. */
    listOwnEntries(sessionId: string, viewerUserId: string): Promise<RepairEntry[]>
    /** Partner entries pass through visibility redaction inside the driver. */
    listPartnerEntriesRedacted(
      sessionId: string,
      viewerUserId: string,
    ): Promise<import('@/server/policies/visibility-policy').PartnerFacingEntry[]>
    /** For the AI pipeline: only ai-readable text, keyed by author. */
    listAiReadableEntries(sessionId: string): Promise<Array<{ userId: string; promptId: string; text: string }>>
    hasPartnerSubmitted(sessionId: string, viewerUserId: string): Promise<boolean>
    saveEntry(entry: RepairEntry): Promise<RepairEntry>
    findInsight(sessionId: string, inputHash: string): Promise<RepairInsightRecord | null>
    findCurrentInsight(sessionId: string): Promise<RepairInsightRecord | null>
    saveInsight(record: RepairInsightRecord): Promise<RepairInsightRecord>
    listAgreements(sessionId: string, viewerUserId: string): Promise<RepairAgreement[]>
    saveAgreement(agreement: RepairAgreement): Promise<RepairAgreement>
  }
  agreements: {
    list(coupleId: string, viewerUserId: string): Promise<Agreement[]>
    getById(agreementId: string, viewerUserId: string): Promise<Agreement | null>
    create(agreement: Agreement): Promise<Agreement>
    save(agreement: Agreement, revision: AgreementRevision): Promise<Agreement>
    listRevisions(agreementId: string, viewerUserId: string): Promise<AgreementRevision[]>
  }
  timeline: {
    list(coupleId: string, viewerUserId: string): Promise<TimelineEvent[]>
    add(event: TimelineEvent): Promise<TimelineEvent>
  }
  manual: {
    list(coupleId: string, viewerUserId: string): Promise<RelationshipManualItemRecord[]>
    save(item: RelationshipManualItemRecord, viewerUserId: string): Promise<RelationshipManualItemRecord>
    remove(itemId: string, viewerUserId: string): Promise<void>
  }
  notificationPreferences: {
    get(userId: string): Promise<NotificationPreference>
    save(pref: NotificationPreference): Promise<NotificationPreference>
  }
  consents: {
    list(userId: string): Promise<ConsentRecord[]>
    record(consent: ConsentRecord): Promise<void>
  }
  dataRequests: {
    create(request: UserDataRequest): Promise<UserDataRequest>
    list(userId: string): Promise<UserDataRequest[]>
  }
  safetyEvents: {
    record(event: SafetyEvent): Promise<void>
  }
  aiLogs: {
    record(log: AiGenerationLog): Promise<void>
  }
  analytics: {
    record(event: AnalyticsEventRecord): Promise<void>
  }
}

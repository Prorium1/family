import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canViewAnswer, isRevealed } from '@/server/policies/assignment-policy'
import { aiReadableText, redactEntryForPartner } from '@/server/policies/visibility-policy'
import type { Repositories } from '../repository-types'
import {
  mapAgreement,
  mapAgreementRevision,
  mapAnswer,
  mapAssignment,
  mapCheckin,
  mapCheckinAnswer,
  mapConsent,
  mapCouple,
  mapDataRequest,
  mapInsight,
  mapInvitation,
  mapJourney,
  mapJourneyProgress,
  mapJourneyStep,
  mapManualItem,
  mapMember,
  mapNotificationPreference,
  mapProfile,
  mapQuestion,
  mapRepairAgreement,
  mapRepairEntry,
  mapRepairInsight,
  mapRepairSession,
  mapTimeline,
  type AgreementRevisionRow,
  type AgreementRow,
  type AnswerRow,
  type AssignmentRow,
  type CheckinAnswerRow,
  type CheckinRow,
  type ConsentRow,
  type CoupleMemberRow,
  type CoupleRow,
  type DataRequestRow,
  type InsightRow,
  type InvitationRow,
  type JourneyProgressRow,
  type JourneyRow,
  type JourneyStepRow,
  type ManualItemRow,
  type NotificationPreferenceRow,
  type ProfileRow,
  type QuestionRow,
  type RepairAgreementRow,
  type RepairEntryRow,
  type RepairInsightRow,
  type RepairSessionRow,
  type TimelineRow,
} from './rows'

/**
 * Supabase driver. RLS (supabase/migrations/0004_rls.sql) is the primary
 * enforcement: an unrevealed partner answer or a foreign couple's row simply
 * never comes back from PostgREST. The same TS policies used by the demo
 * driver run again on top, so both layers must agree before data moves.
 *
 * Security-critical writes go through the security-definer RPCs from
 * 0003_functions.sql; this driver never tries to reimplement them.
 */

async function db() {
  return createSupabaseServerClient()
}

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(`[supabase] ${error.message}`)
}

export function createSupabaseRepositories(): Repositories {
  const repositories: Repositories = {
    profiles: {
      async getById(id) {
        const client = await db()
        const { data, error } = await client.from('profiles').select('*').eq('id', id).maybeSingle()
        throwIf(error)
        if (!data) return null
        const {
          data: { user },
        } = await client.auth.getUser()
        return mapProfile(data as ProfileRow, user?.id === id ? (user.email ?? '') : '')
      },
      async ensure(id, defaults) {
        const client = await db()
        const { data: existing } = await client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (existing) return mapProfile(existing as ProfileRow, defaults.email)
        const { data, error } = await client
          .from('profiles')
          .insert({ id, display_name: defaults.displayName })
          .select()
          .single()
        throwIf(error)
        return mapProfile(data as ProfileRow, defaults.email)
      },
      async update(id, patch) {
        const client = await db()
        const { data, error } = await client
          .from('profiles')
          .update({
            ...(patch.displayName !== undefined && { display_name: patch.displayName }),
            ...(patch.locale !== undefined && { locale: patch.locale }),
            ...(patch.timezone !== undefined && { timezone: patch.timezone }),
            ...(patch.ageConfirmed !== undefined && { age_confirmed: patch.ageConfirmed }),
            ...(patch.gender !== undefined && { gender: patch.gender }),
          })
          .eq('id', id)
          .select()
          .single()
        throwIf(error)
        return mapProfile(data as ProfileRow)
      },
    },

    couples: {
      async getForUser(userId) {
        const client = await db()
        const { data: membership, error } = await client
          .from('couple_members')
          .select('couple_id')
          .eq('user_id', userId)
          .eq('active', true)
          .maybeSingle()
        throwIf(error)
        if (!membership) return null
        return repositories.couples.getById(membership.couple_id as string, userId)
      },
      async getById(coupleId) {
        const client = await db()
        const { data: couple, error } = await client
          .from('couples')
          .select('*')
          .eq('id', coupleId)
          .eq('status', 'active')
          .maybeSingle()
        throwIf(error)
        if (!couple) return null
        const { data: members, error: mErr } = await client
          .from('couple_members')
          .select('*')
          .eq('couple_id', coupleId)
        throwIf(mErr)
        return {
          couple: mapCouple(couple as CoupleRow),
          members: ((members ?? []) as CoupleMemberRow[]).map(mapMember),
        }
      },
      async create() {
        // Couples are only created by accept_couple_invitation() — the RPC is
        // the single, transactional pairing path (spec §23).
        throw new Error('couples.create: use invitations.accept via the pairing service')
      },
      async updateStage(coupleId, _viewerUserId, stage) {
        const client = await db()
        const { error } = await client
          .from('couples')
          .update({ relationship_stage: stage })
          .eq('id', coupleId)
        throwIf(error)
      },
      async unpair() {
        const client = await db()
        const { error } = await client.rpc('unpair_couple')
        throwIf(error)
      },
    },

    invitations: {
      async create(invitation) {
        const client = await db()
        const { data, error } = await client
          .from('couple_invitations')
          .insert({
            id: invitation.id,
            inviter_user_id: invitation.inviterUserId,
            token_hash: invitation.tokenHash,
            code_hash: invitation.codeHash,
            relationship_stage: invitation.relationshipStage,
            expires_at: invitation.expiresAt,
          })
          .select()
          .single()
        throwIf(error)
        return mapInvitation(data as InvitationRow)
      },
      async getActiveForInviter(inviterUserId) {
        const client = await db()
        const { data, error } = await client
          .from('couple_invitations')
          .select('*')
          .eq('inviter_user_id', inviterUserId)
          .is('used_at', null)
          .is('revoked_at', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle()
        throwIf(error)
        return data ? mapInvitation(data as InvitationRow) : null
      },
      async findByTokenHash(tokenHash) {
        // Redemption goes through the RPC; this lookup exists for the
        // interface but stays inviter-scoped under RLS.
        const client = await db()
        const { data, error } = await client
          .from('couple_invitations')
          .select('*')
          .eq('token_hash', tokenHash)
          .maybeSingle()
        throwIf(error)
        return data ? mapInvitation(data as InvitationRow) : null
      },
      async findByCodeHash(codeHash) {
        const client = await db()
        const { data, error } = await client
          .from('couple_invitations')
          .select('*')
          .eq('code_hash', codeHash)
          .maybeSingle()
        throwIf(error)
        return data ? mapInvitation(data as InvitationRow) : null
      },
      async peekBySecretHash(secretHash) {
        // security-definer RPC (0006): safe for anonymous /join lookups —
        // returns only the inviter's display name and the stage.
        const client = await db()
        const { data, error } = await client.rpc('peek_couple_invitation', {
          p_secret_hash: secretHash,
        })
        throwIf(error)
        const row = (Array.isArray(data) ? data[0] : data) as
          | { inviter_name: string; stage: string }
          | undefined
        if (!row) return null
        return {
          inviterName: row.inviter_name,
          stage: row.stage as import('@/types/domain').RelationshipStage,
        }
      },
      async listActive() {
        const client = await db()
        const { data, error } = await client
          .from('couple_invitations')
          .select('*')
          .is('used_at', null)
          .is('revoked_at', null)
          .gt('expires_at', new Date().toISOString())
        throwIf(error)
        return ((data ?? []) as InvitationRow[]).map(mapInvitation)
      },
      async recordFailedAttempt(invitationId) {
        // Attempt counting happens inside accept_couple_invitation(); this
        // client-side path only reads the current count.
        const client = await db()
        const { data } = await client
          .from('couple_invitations')
          .select('attempt_count')
          .eq('id', invitationId)
          .maybeSingle()
        return (data?.attempt_count as number | undefined) ?? 0
      },
      async markUsed() {
        throw new Error('invitations.markUsed: handled by accept_couple_invitation RPC')
      },
      async revoke(invitationId, inviterUserId) {
        const client = await db()
        const { error } = await client
          .from('couple_invitations')
          .update({ revoked_at: new Date().toISOString() })
          .eq('id', invitationId)
          .eq('inviter_user_id', inviterUserId)
        throwIf(error)
      },
    },

    questions: {
      async getById(id) {
        const client = await db()
        const { data, error } = await client.from('questions').select('*').eq('id', id).maybeSingle()
        throwIf(error)
        return data ? mapQuestion(data as QuestionRow) : null
      },
      async listActive() {
        const client = await db()
        const { data, error } = await client.from('questions').select('*').eq('active', true)
        throwIf(error)
        return ((data ?? []) as QuestionRow[]).map(mapQuestion)
      },
    },

    assignments: {
      async getById(assignmentId) {
        const client = await db()
        const { data, error } = await client
          .from('question_assignments')
          .select('*')
          .eq('id', assignmentId)
          .maybeSingle()
        throwIf(error)
        return data ? mapAssignment(data as AssignmentRow) : null
      },
      async getTodayForCouple(coupleId, _viewerUserId, date) {
        const client = await db()
        const { data, error } = await client
          .from('question_assignments')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('source', 'daily')
          .eq('assigned_date', date)
          .maybeSingle()
        throwIf(error)
        return data ? mapAssignment(data as AssignmentRow) : null
      },
      async findByStep(coupleId, journeyStepId) {
        const client = await db()
        const { data, error } = await client
          .from('question_assignments')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('journey_step_id', journeyStepId)
          .maybeSingle()
        throwIf(error)
        return data ? mapAssignment(data as AssignmentRow) : null
      },
      async listForCouple(coupleId) {
        const client = await db()
        const { data, error } = await client
          .from('question_assignments')
          .select('*')
          .eq('couple_id', coupleId)
        throwIf(error)
        return ((data ?? []) as AssignmentRow[]).map(mapAssignment)
      },
      async create(assignment) {
        const client = await db()
        const { data, error } = await client
          .from('question_assignments')
          .insert({
            couple_id: assignment.coupleId,
            question_id: assignment.questionId,
            source: assignment.source,
            journey_step_id: assignment.journeyStepId,
            assigned_date: assignment.assignedDate,
            status: assignment.status,
            status_history: assignment.statusHistory,
          })
          .select()
          .single()
        throwIf(error)
        return mapAssignment(data as AssignmentRow)
      },
      async save(assignment) {
        const client = await db()
        const { data, error } = await client
          .from('question_assignments')
          .update({
            status: assignment.status,
            status_history: assignment.statusHistory,
            revealed_at: assignment.revealedAt,
            insight_error: assignment.insightError,
          })
          .eq('id', assignment.id)
          .select()
          .single()
        throwIf(error)
        return mapAssignment(data as AssignmentRow)
      },
    },

    answers: {
      async getForAssignment(assignmentId, viewerUserId) {
        const client = await db()
        // RLS already hides the partner's unrevealed row; the TS policy runs
        // again for defense in depth.
        const [{ data: rows, error }, assignment] = await Promise.all([
          client.from('answers').select('*').eq('assignment_id', assignmentId),
          repositories.assignments.getById(assignmentId, viewerUserId),
        ])
        throwIf(error)
        const answers = ((rows ?? []) as AnswerRow[]).map(mapAnswer)
        const mine = answers.find((a) => a.userId === viewerUserId) ?? null
        const partnerRaw = answers.find((a) => a.userId !== viewerUserId) ?? null
        const partner =
          assignment && partnerRaw && canViewAnswer(assignment, partnerRaw, viewerUserId)
            ? partnerRaw
            : null
        // partnerSubmitted must be visible pre-reveal even though the row is
        // not: derive it from the assignment's status history.
        const partnerSubmitted =
          partnerRaw?.submitted ??
          (assignment
            ? assignment.status === 'waiting_partner'
              ? !mine?.submitted
              : isRevealed(assignment.status)
            : false)
        return { mine, partner, partnerSubmitted }
      },
      async saveDraft(answer) {
        const client = await db()
        const { data, error } = await client
          .from('answers')
          .upsert(
            {
              assignment_id: answer.assignmentId,
              couple_id: answer.coupleId,
              user_id: answer.userId,
              value: answer.value,
              visibility: answer.visibility,
            },
            { onConflict: 'assignment_id,user_id' },
          )
          .select()
          .single()
        throwIf(error)
        return mapAnswer(data as AnswerRow)
      },
      async submit(answerId) {
        const client = await db()
        const { data: answer, error } = await client
          .from('answers')
          .select('assignment_id')
          .eq('id', answerId)
          .single()
        throwIf(error)
        if (!answer) throw new Error('[supabase] answer not found')
        const { error: rpcError } = await client.rpc('submit_answer_and_maybe_reveal', {
          p_assignment_id: answer.assignment_id,
        })
        throwIf(rpcError)
      },
      async listRevisions(answerId) {
        const client = await db()
        const { data, error } = await client
          .from('answer_revisions')
          .select('*')
          .eq('answer_id', answerId)
        throwIf(error)
        return ((data ?? []) as Array<{ id: string; answer_id: string; value: AnswerRow['value']; edited_at: string }>).map(
          (r) => ({ id: r.id, answerId: r.answer_id, value: r.value, editedAt: r.edited_at }),
        )
      },
      async addRevision(revision) {
        const client = await db()
        const { error } = await client.from('answer_revisions').insert({
          answer_id: revision.answerId,
          value: revision.value,
        })
        throwIf(error)
      },
      async listRevealedForCouple(coupleId) {
        const client = await db()
        // RLS returns own answers + revealed partner answers only.
        const { data, error } = await client.from('answers').select('*').eq('couple_id', coupleId)
        throwIf(error)
        return ((data ?? []) as AnswerRow[]).map(mapAnswer)
      },
      async listOwn(userId) {
        const client = await db()
        const { data, error } = await client.from('answers').select('*').eq('user_id', userId)
        throwIf(error)
        return ((data ?? []) as AnswerRow[]).map(mapAnswer)
      },
    },

    insights: {
      async findCurrent(assignmentId) {
        const client = await db()
        const { data, error } = await client
          .from('ai_insights')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('is_current', true)
          .maybeSingle()
        throwIf(error)
        return data ? mapInsight(data as InsightRow) : null
      },
      async findByInputHash(assignmentId, inputHash) {
        const client = await db()
        const { data, error } = await client
          .from('ai_insights')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('input_hash', inputHash)
          .order('attempt', { ascending: false })
          .limit(1)
          .maybeSingle()
        throwIf(error)
        return data ? mapInsight(data as InsightRow) : null
      },
      async create(record) {
        const client = await db()
        // claim RPC provides atomic dedupe under concurrency
        const { data: claimedId, error } = await client.rpc('claim_insight_generation', {
          p_assignment_id: record.assignmentId,
          p_input_hash: record.inputHash,
          p_schema_version: record.schemaVersion,
        })
        throwIf(error)
        if (!claimedId) {
          const existing = await repositories.insights.findByInputHash(
            record.assignmentId,
            record.inputHash,
          )
          if (existing) return existing
        }
        return { ...record, id: (claimedId as string) ?? record.id }
      },
      async save(record) {
        const admin = createSupabaseAdminClient()
        const { data, error } = await admin
          .from('ai_insights')
          .update({
            status: record.status,
            payload: record.payload,
            is_current: record.isCurrent,
          })
          .eq('id', record.id)
          .select()
          .single()
        throwIf(error)
        return mapInsight(data as InsightRow)
      },
    },

    journeys: {
      async listActive() {
        const client = await db()
        const { data, error } = await client
          .from('journeys')
          .select('*')
          .eq('active', true)
          .order('order')
        throwIf(error)
        return ((data ?? []) as JourneyRow[]).map(mapJourney)
      },
      async getBySlug(slug) {
        const client = await db()
        const { data, error } = await client
          .from('journeys')
          .select('*')
          .eq('slug', slug)
          .eq('active', true)
          .maybeSingle()
        throwIf(error)
        return data ? mapJourney(data as JourneyRow) : null
      },
      async stepsFor(journeyId) {
        const client = await db()
        const { data, error } = await client
          .from('journey_steps')
          .select('*')
          .eq('journey_id', journeyId)
          .order('order')
        throwIf(error)
        return ((data ?? []) as JourneyStepRow[]).map(mapJourneyStep)
      },
      async getProgress(coupleId, journeyId) {
        const client = await db()
        const { data, error } = await client
          .from('journey_progress')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('journey_id', journeyId)
          .maybeSingle()
        throwIf(error)
        return data ? mapJourneyProgress(data as JourneyProgressRow) : null
      },
      async listProgress(coupleId) {
        const client = await db()
        const { data, error } = await client
          .from('journey_progress')
          .select('*')
          .eq('couple_id', coupleId)
        throwIf(error)
        return ((data ?? []) as JourneyProgressRow[]).map(mapJourneyProgress)
      },
      async saveProgress(progress) {
        const client = await db()
        const { data, error } = await client
          .from('journey_progress')
          .upsert(
            {
              couple_id: progress.coupleId,
              journey_id: progress.journeyId,
              status: progress.status,
              completed_step_ids: progress.completedStepIds,
              started_at: progress.startedAt,
              completed_at: progress.completedAt,
            },
            { onConflict: 'couple_id,journey_id' },
          )
          .select()
          .single()
        throwIf(error)
        return mapJourneyProgress(data as JourneyProgressRow)
      },
    },

    checkins: {
      async getForWeek(coupleId, weekKey) {
        const client = await db()
        const { data, error } = await client
          .from('weekly_checkins')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('week_key', weekKey)
          .maybeSingle()
        throwIf(error)
        return data ? mapCheckin(data as CheckinRow) : null
      },
      async create(checkin) {
        const client = await db()
        const { data, error } = await client
          .from('weekly_checkins')
          .insert({ couple_id: checkin.coupleId, week_key: checkin.weekKey, status: checkin.status })
          .select()
          .single()
        throwIf(error)
        return mapCheckin(data as CheckinRow)
      },
      async save(checkin) {
        const client = await db()
        const { data, error } = await client
          .from('weekly_checkins')
          .update({ status: checkin.status, revealed_at: checkin.revealedAt })
          .eq('id', checkin.id)
          .select()
          .single()
        throwIf(error)
        return mapCheckin(data as CheckinRow)
      },
      async getAnswers(checkinId, viewerUserId) {
        const client = await db()
        const { data, error } = await client
          .from('weekly_checkin_answers')
          .select('*')
          .eq('checkin_id', checkinId)
        throwIf(error)
        const answers = ((data ?? []) as CheckinAnswerRow[]).map(mapCheckinAnswer)
        const mine = answers.find((a) => a.userId === viewerUserId) ?? null
        const partner = answers.find((a) => a.userId !== viewerUserId) ?? null
        return { mine, partner, partnerSubmitted: partner?.submitted ?? false }
      },
      async saveAnswers(answer) {
        const client = await db()
        const { data, error } = await client
          .from('weekly_checkin_answers')
          .upsert(
            {
              checkin_id: answer.checkinId,
              user_id: answer.userId,
              answers: answer.answers,
              submitted: answer.submitted,
              submitted_at: answer.submittedAt,
            },
            { onConflict: 'checkin_id,user_id' },
          )
          .select()
          .single()
        throwIf(error)
        return mapCheckinAnswer(data as CheckinAnswerRow)
      },
    },

    repair: {
      async getSession(sessionId) {
        const client = await db()
        const { data, error } = await client
          .from('repair_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle()
        throwIf(error)
        return data ? mapRepairSession(data as RepairSessionRow) : null
      },
      async listSessions(coupleId) {
        const client = await db()
        const { data, error } = await client
          .from('repair_sessions')
          .select('*')
          .eq('couple_id', coupleId)
        throwIf(error)
        return ((data ?? []) as RepairSessionRow[]).map(mapRepairSession)
      },
      async createSession(session) {
        const client = await db()
        const { data, error } = await client
          .from('repair_sessions')
          .insert({
            couple_id: session.coupleId,
            initiator_user_id: session.initiatorUserId,
            mode: session.mode,
            status: session.status,
            topic: session.topic,
          })
          .select()
          .single()
        throwIf(error)
        return mapRepairSession(data as RepairSessionRow)
      },
      async saveSession(session) {
        const client = await db()
        const { data, error } = await client
          .from('repair_sessions')
          .update({
            status: session.status,
            safety_level: session.safetyLevel,
            safety_categories: session.safetyCategories,
            partner_notified: session.partnerNotified,
            closed_at: session.closedAt,
          })
          .eq('id', session.id)
          .select()
          .single()
        throwIf(error)
        return mapRepairSession(data as RepairSessionRow)
      },
      async listOwnEntries(sessionId, viewerUserId) {
        const client = await db()
        const { data, error } = await client
          .from('repair_entries')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', viewerUserId)
        throwIf(error)
        return ((data ?? []) as RepairEntryRow[]).map(mapRepairEntry)
      },
      async listPartnerEntriesRedacted(sessionId, viewerUserId) {
        // RLS makes partner rows unreadable with the user token; the service
        // role reads them ONLY to apply the visibility redaction — raw text
        // still never crosses toward the partner.
        const admin = createSupabaseAdminClient()
        const { data, error } = await admin
          .from('repair_entries')
          .select('*')
          .eq('session_id', sessionId)
          .neq('user_id', viewerUserId)
          .eq('submitted', true)
        throwIf(error)
        return ((data ?? []) as RepairEntryRow[])
          .map(mapRepairEntry)
          .map(redactEntryForPartner)
          .filter((r): r is NonNullable<typeof r> => r !== null)
      },
      async listAiReadableEntries(sessionId) {
        const admin = createSupabaseAdminClient()
        const { data, error } = await admin
          .from('repair_entries')
          .select('*')
          .eq('session_id', sessionId)
          .eq('submitted', true)
        throwIf(error)
        return ((data ?? []) as RepairEntryRow[]).map(mapRepairEntry).flatMap((entry) => {
          const text = aiReadableText(entry)
          return text === null ? [] : [{ userId: entry.userId, promptId: entry.promptId, text }]
        })
      },
      async hasPartnerSubmitted(sessionId, viewerUserId) {
        const admin = createSupabaseAdminClient()
        const { count, error } = await admin
          .from('repair_entries')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .neq('user_id', viewerUserId)
          .eq('submitted', true)
        throwIf(error)
        return (count ?? 0) > 0
      },
      async saveEntry(entry) {
        const client = await db()
        const { data, error } = await client
          .from('repair_entries')
          .upsert(
            {
              session_id: entry.sessionId,
              user_id: entry.userId,
              prompt_id: entry.promptId,
              text: entry.text,
              visibility: entry.visibility,
              shared_excerpts: entry.sharedExcerpts,
              submitted: entry.submitted,
            },
            { onConflict: 'session_id,user_id,prompt_id' },
          )
          .select()
          .single()
        throwIf(error)
        return mapRepairEntry(data as RepairEntryRow)
      },
      async findInsight(sessionId, inputHash) {
        const client = await db()
        const { data, error } = await client
          .from('repair_insights')
          .select('*')
          .eq('session_id', sessionId)
          .eq('input_hash', inputHash)
          .order('attempt', { ascending: false })
          .limit(1)
          .maybeSingle()
        throwIf(error)
        return data ? mapRepairInsight(data as RepairInsightRow) : null
      },
      async findCurrentInsight(sessionId) {
        const client = await db()
        const { data, error } = await client
          .from('repair_insights')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_current', true)
          .maybeSingle()
        throwIf(error)
        return data ? mapRepairInsight(data as RepairInsightRow) : null
      },
      async saveInsight(record) {
        const admin = createSupabaseAdminClient()
        const { data, error } = await admin
          .from('repair_insights')
          .upsert(
            {
              id: record.id.startsWith('ri_') ? undefined : record.id,
              session_id: record.sessionId,
              schema_version: record.schemaVersion,
              input_hash: record.inputHash,
              attempt: record.attempt,
              is_current: record.isCurrent,
              status: record.status,
              payload: record.payload,
            },
            { onConflict: 'session_id,input_hash,attempt' },
          )
          .select()
          .single()
        throwIf(error)
        return mapRepairInsight(data as RepairInsightRow)
      },
      async listAgreements(sessionId) {
        const client = await db()
        const { data, error } = await client
          .from('repair_agreements')
          .select('*')
          .eq('session_id', sessionId)
        throwIf(error)
        return ((data ?? []) as RepairAgreementRow[]).map(mapRepairAgreement)
      },
      async saveAgreement(agreement) {
        const client = await db()
        const { data, error } = await client
          .from('repair_agreements')
          .insert({
            session_id: agreement.sessionId,
            couple_id: agreement.coupleId,
            text: agreement.text,
            agreed_by_user_ids: agreement.agreedByUserIds,
          })
          .select()
          .single()
        throwIf(error)
        return mapRepairAgreement(data as RepairAgreementRow)
      },
    },

    agreements: {
      async list(coupleId) {
        const client = await db()
        const { data, error } = await client.from('agreements').select('*').eq('couple_id', coupleId)
        throwIf(error)
        return ((data ?? []) as AgreementRow[]).map(mapAgreement)
      },
      async getById(agreementId) {
        const client = await db()
        const { data, error } = await client
          .from('agreements')
          .select('*')
          .eq('id', agreementId)
          .maybeSingle()
        throwIf(error)
        return data ? mapAgreement(data as AgreementRow) : null
      },
      async create(agreement) {
        const client = await db()
        const { data, error } = await client
          .from('agreements')
          .insert({
            couple_id: agreement.coupleId,
            category: agreement.category,
            title: agreement.title,
            background: agreement.background,
            decision: agreement.decision,
            starts_on: agreement.startsOn,
            review_on: agreement.reviewOn,
            status: agreement.status,
            created_by_user_id: agreement.createdByUserId,
          })
          .select()
          .single()
        throwIf(error)
        return mapAgreement(data as AgreementRow)
      },
      async save(agreement, revision) {
        const client = await db()
        const { error: rErr } = await client.from('agreement_revisions').insert({
          agreement_id: revision.agreementId,
          title: revision.title,
          background: revision.background,
          decision: revision.decision,
          comment: revision.comment,
          edited_by_user_id: revision.editedByUserId,
        })
        throwIf(rErr)
        const { data, error } = await client
          .from('agreements')
          .update({
            title: agreement.title,
            background: agreement.background,
            decision: agreement.decision,
            starts_on: agreement.startsOn,
            review_on: agreement.reviewOn,
            status: agreement.status,
          })
          .eq('id', agreement.id)
          .select()
          .single()
        throwIf(error)
        return mapAgreement(data as AgreementRow)
      },
      async listRevisions(agreementId) {
        const client = await db()
        const { data, error } = await client
          .from('agreement_revisions')
          .select('*')
          .eq('agreement_id', agreementId)
        throwIf(error)
        return ((data ?? []) as AgreementRevisionRow[]).map(mapAgreementRevision)
      },
    },

    timeline: {
      async list(coupleId) {
        const client = await db()
        const { data, error } = await client
          .from('timeline_events')
          .select('*')
          .eq('couple_id', coupleId)
          .order('date')
        throwIf(error)
        return ((data ?? []) as TimelineRow[]).map(mapTimeline)
      },
      async add(event) {
        const client = await db()
        const { data, error } = await client
          .from('timeline_events')
          .insert({
            couple_id: event.coupleId,
            kind: event.kind,
            title: event.title,
            date: event.date,
          })
          .select()
          .single()
        throwIf(error)
        return mapTimeline(data as TimelineRow)
      },
    },

    manual: {
      async list(coupleId) {
        const client = await db()
        const { data, error } = await client
          .from('relationship_manual_items')
          .select('*')
          .eq('couple_id', coupleId)
        throwIf(error)
        return ((data ?? []) as ManualItemRow[]).map(mapManualItem)
      },
      async save(item) {
        const client = await db()
        const { data, error } = await client
          .from('relationship_manual_items')
          .upsert({
            id: item.id.startsWith('mi_') ? undefined : item.id,
            couple_id: item.coupleId,
            subject_user_id: item.subjectUserId,
            category: item.category,
            statement: item.statement,
            source_type: item.sourceType,
            source_ids: item.sourceIds,
            confidence: item.confidence,
            confirmed_by_user_ids: item.confirmedByUserIds,
          })
          .select()
          .single()
        throwIf(error)
        return mapManualItem(data as ManualItemRow)
      },
      async remove(itemId) {
        const client = await db()
        const { error } = await client.from('relationship_manual_items').delete().eq('id', itemId)
        throwIf(error)
      },
    },

    notificationPreferences: {
      async get(userId) {
        const client = await db()
        const { data, error } = await client
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        throwIf(error)
        if (data) return mapNotificationPreference(data as NotificationPreferenceRow)
        return {
          userId,
          dailyQuestion: true,
          bothRevealed: true,
          weeklyCheckin: true,
          gratitudeReceived: true,
          preferredTime: '20:00',
          coupleTimeStart: null,
          coupleTimeEnd: null,
        }
      },
      async save(pref) {
        const client = await db()
        const { data, error } = await client
          .from('notification_preferences')
          .upsert({
            user_id: pref.userId,
            daily_question: pref.dailyQuestion,
            both_revealed: pref.bothRevealed,
            weekly_checkin: pref.weeklyCheckin,
            gratitude_received: pref.gratitudeReceived,
            preferred_time: pref.preferredTime,
            couple_time_start: pref.coupleTimeStart,
            couple_time_end: pref.coupleTimeEnd,
          })
          .select()
          .single()
        throwIf(error)
        return mapNotificationPreference(data as NotificationPreferenceRow)
      },
    },

    consents: {
      async list(userId) {
        const client = await db()
        const { data, error } = await client
          .from('consent_records')
          .select('*')
          .eq('user_id', userId)
          .order('recorded_at')
        throwIf(error)
        return ((data ?? []) as ConsentRow[]).map(mapConsent)
      },
      async record(consent) {
        const client = await db()
        const { error } = await client.from('consent_records').insert({
          user_id: consent.userId,
          kind: consent.kind,
          granted: consent.granted,
          version: consent.version,
        })
        throwIf(error)
      },
    },

    dataRequests: {
      async create(request) {
        const client = await db()
        const { data, error } = await client
          .from('user_data_requests')
          .insert({ user_id: request.userId, kind: request.kind, status: request.status })
          .select()
          .single()
        throwIf(error)
        return mapDataRequest(data as DataRequestRow)
      },
      async list(userId) {
        const client = await db()
        const { data, error } = await client
          .from('user_data_requests')
          .select('*')
          .eq('user_id', userId)
        throwIf(error)
        return ((data ?? []) as DataRequestRow[]).map(mapDataRequest)
      },
    },

    // Metadata-only tables are service-role writes: clients have no policies.
    safetyEvents: {
      async record(event) {
        const admin = createSupabaseAdminClient()
        const { error } = await admin.from('safety_events').insert({
          user_id: event.userId,
          couple_id: event.coupleId,
          context: event.context,
          level: event.level,
          categories: event.categories,
        })
        throwIf(error)
      },
    },
    aiLogs: {
      async record(log) {
        const admin = createSupabaseAdminClient()
        const { error } = await admin.from('ai_generation_logs').insert({
          request_id: log.requestId,
          user_id: log.userId,
          couple_id: log.coupleId,
          kind: log.kind,
          model: log.model,
          input_tokens: log.inputTokens,
          output_tokens: log.outputTokens,
          success: log.success,
          duration_ms: log.durationMs,
          schema_version: log.schemaVersion,
          error_code: log.errorCode,
        })
        throwIf(error)
      },
    },
    analytics: {
      async record(event) {
        const admin = createSupabaseAdminClient()
        const { error } = await admin
          .from('analytics_events')
          .insert({ name: event.name, props: event.props })
        throwIf(error)
      },
    },
  }

  return repositories
}

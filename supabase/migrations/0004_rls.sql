-- ────────────────────────────────────────────────────────────────
-- 0004_rls: Row Level Security on every table (spec §23).
-- Core invariants:
--  * only active couple members reach shared rows
--  * a partner's answer is unreadable until the assignment is revealed
--  * repair entries are author-only; partners get service-produced
--    summaries, never raw rows
--  * safety/audit/ai-log tables have NO client access at all
--  * admins manage content, never intimate text
-- ────────────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table couples enable row level security;
alter table couple_members enable row level security;
alter table couple_invitations enable row level security;
alter table relationship_stages enable row level security;
alter table question_packs enable row level security;
alter table questions enable row level security;
alter table question_assignments enable row level security;
alter table answers enable row level security;
alter table answer_revisions enable row level security;
alter table ai_insights enable row level security;
alter table journeys enable row level security;
alter table journey_steps enable row level security;
alter table journey_progress enable row level security;
alter table weekly_checkins enable row level security;
alter table weekly_checkin_answers enable row level security;
alter table weekly_summaries enable row level security;
alter table repair_sessions enable row level security;
alter table repair_entries enable row level security;
alter table repair_insights enable row level security;
alter table repair_agreements enable row level security;
alter table agreements enable row level security;
alter table agreement_revisions enable row level security;
alter table memories enable row level security;
alter table timeline_events enable row level security;
alter table relationship_manual_items enable row level security;
alter table relationship_summaries enable row level security;
alter table notification_preferences enable row level security;
alter table consent_records enable row level security;
alter table user_data_requests enable row level security;
alter table subscriptions enable row level security;
alter table entitlements enable row level security;
alter table referrals enable row level security;
alter table feature_flags enable row level security;
alter table safety_events enable row level security;
alter table audit_logs enable row level security;
alter table ai_generation_logs enable row level security;
alter table analytics_events enable row level security;

-- profiles: self read/update; partner may read display info
create policy profiles_self_select on profiles
  for select using (id = auth.uid()
    or exists (
      select 1 from couple_members m1
      join couple_members m2 on m1.couple_id = m2.couple_id and m2.active
      where m1.user_id = auth.uid() and m1.active and m2.user_id = profiles.id
    ));
create policy profiles_self_insert on profiles
  for insert with check (id = auth.uid());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- couples / members: member-read; writes only through definer functions
create policy couples_member_select on couples
  for select using (is_active_couple_member(id));
create policy couple_members_select on couple_members
  for select using (user_id = auth.uid() or is_active_couple_member(couple_id));

-- invitations: the inviter sees only their own rows (hashes, never secrets);
-- redemption happens via accept_couple_invitation()
create policy invitations_inviter_select on couple_invitations
  for select using (inviter_user_id = auth.uid());
create policy invitations_inviter_insert on couple_invitations
  for insert with check (inviter_user_id = auth.uid());
create policy invitations_inviter_update on couple_invitations
  for update using (inviter_user_id = auth.uid());

create policy relationship_stages_member on relationship_stages
  for select using (is_active_couple_member(couple_id));

-- content: readable by any signed-in user; managed by admins
create policy packs_read on question_packs for select using (auth.uid() is not null);
create policy questions_read on questions for select using (auth.uid() is not null);
create policy journeys_read on journeys for select using (auth.uid() is not null);
create policy journey_steps_read on journey_steps for select using (auth.uid() is not null);
create policy flags_read on feature_flags for select using (auth.uid() is not null);
create policy packs_admin on question_packs for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy questions_admin on questions for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy journeys_admin on journeys for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy journey_steps_admin on journey_steps for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy flags_admin on feature_flags for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin));

-- assignments: member-read; insert by members; status writes via RPC only
create policy assignments_member_select on question_assignments
  for select using (is_active_couple_member(couple_id));
create policy assignments_member_insert on question_assignments
  for insert with check (is_active_couple_member(couple_id));

-- ★ answers: THE reveal rule. Your own row always; the partner's row only
--   once the parent assignment is revealed. Network-level enforcement —
--   no client rendering trick can bypass this (spec §23).
create policy answers_select on answers
  for select using (
    user_id = auth.uid()
    or (is_active_couple_member(couple_id) and assignment_is_revealed(assignment_id))
  );
create policy answers_insert_own on answers
  for insert with check (
    user_id = auth.uid()
    and is_active_couple_member(couple_id)
    and not assignment_is_revealed(assignment_id)
  );
create policy answers_update_own on answers
  for update using (user_id = auth.uid() and not assignment_is_revealed(assignment_id))
  with check (user_id = auth.uid());

-- revisions: author-only (spec §4-3 keeps the history, privately)
create policy answer_revisions_own on answer_revisions
  for select using (
    exists (select 1 from answers a where a.id = answer_id and a.user_id = auth.uid())
  );
create policy answer_revisions_insert on answer_revisions
  for insert with check (
    exists (select 1 from answers a where a.id = answer_id and a.user_id = auth.uid())
  );

-- insights: readable once the assignment is revealed
create policy insights_member_select on ai_insights
  for select using (is_active_couple_member(couple_id) and assignment_is_revealed(assignment_id));

create policy journey_progress_member on journey_progress
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));

-- weekly check-in: same reveal discipline as answers
create policy checkins_member on weekly_checkins
  for select using (is_active_couple_member(couple_id));
create policy checkins_member_insert on weekly_checkins
  for insert with check (is_active_couple_member(couple_id));
create policy checkin_answers_select on weekly_checkin_answers
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from weekly_checkins c
      where c.id = checkin_id
        and is_active_couple_member(c.couple_id)
        and c.status in ('revealed','completed')
    )
  );
create policy checkin_answers_write on weekly_checkin_answers
  for insert with check (user_id = auth.uid());
create policy checkin_answers_update on weekly_checkin_answers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy weekly_summaries_member on weekly_summaries
  for select using (
    exists (select 1 from weekly_checkins c
            where c.id = checkin_id and is_active_couple_member(c.couple_id))
  );

-- repair sessions: members see together-sessions unless safety-paused;
-- solo and paused sessions are initiator-only (spec §4-5)
create policy repair_sessions_select on repair_sessions
  for select using (
    initiator_user_id = auth.uid()
    or (is_active_couple_member(couple_id)
        and mode = 'together'
        and status <> 'paused_for_safety')
  );
create policy repair_sessions_insert on repair_sessions
  for insert with check (initiator_user_id = auth.uid() and is_active_couple_member(couple_id));
create policy repair_sessions_update on repair_sessions
  for update using (is_active_couple_member(couple_id));

-- ★ repair entries: AUTHOR-ONLY at row level. The partner never selects the
--   raw row; anything partner-facing is produced by the service through
--   visibility redaction and stored in repair_insights / repair_agreements.
create policy repair_entries_author on repair_entries
  for select using (user_id = auth.uid());
create policy repair_entries_author_write on repair_entries
  for insert with check (user_id = auth.uid());
create policy repair_entries_author_update on repair_entries
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy repair_insights_member on repair_insights
  for select using (
    exists (select 1 from repair_sessions s
            where s.id = session_id
              and (s.initiator_user_id = auth.uid()
                   or (is_active_couple_member(s.couple_id)
                       and s.mode = 'together'
                       and s.status <> 'paused_for_safety')))
  );
create policy repair_agreements_member on repair_agreements
  for select using (is_active_couple_member(couple_id));
create policy repair_agreements_insert on repair_agreements
  for insert with check (is_active_couple_member(couple_id));

-- agreements & records: member-scoped
create policy agreements_member on agreements
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));
create policy agreement_revisions_member on agreement_revisions
  for select using (
    exists (select 1 from agreements a
            where a.id = agreement_id and is_active_couple_member(a.couple_id))
  );
create policy agreement_revisions_insert on agreement_revisions
  for insert with check (
    exists (select 1 from agreements a
            where a.id = agreement_id and is_active_couple_member(a.couple_id))
  );
create policy memories_member on memories
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));
create policy timeline_member on timeline_events
  for select using (is_active_couple_member(couple_id));
create policy timeline_member_insert on timeline_events
  for insert with check (is_active_couple_member(couple_id));
create policy manual_member on relationship_manual_items
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));
create policy summaries_member on relationship_summaries
  for select using (is_active_couple_member(couple_id));

-- personal settings
create policy notif_prefs_self on notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy consents_self on consent_records
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy data_requests_self on user_data_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- billing: member-read; writes via service role (webhooks)
create policy subscriptions_member on subscriptions
  for select using (is_active_couple_member(couple_id));
create policy entitlements_member on entitlements
  for select using (is_active_couple_member(couple_id));
create policy referrals_member on referrals
  for select using (
    (referrer_couple_id is not null and is_active_couple_member(referrer_couple_id))
    or (referred_couple_id is not null and is_active_couple_member(referred_couple_id))
  );

-- ★ safety_events / audit_logs / ai_generation_logs / analytics_events:
--   NO client policies at all — service-role only. Even admins cannot read
--   them through the API with a user token.

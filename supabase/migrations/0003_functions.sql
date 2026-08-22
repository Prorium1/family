-- ────────────────────────────────────────────────────────────────
-- 0003_functions: security-definer functions.
-- These are the ONLY write paths for pairing and answer submission,
-- so reveal simultaneity and invitation hashing are transactional
-- server-side guarantees, not client behavior (spec §23).
-- ────────────────────────────────────────────────────────────────

-- Membership helper used by nearly every RLS policy.
create or replace function is_active_couple_member(p_couple_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from couple_members
    where couple_id = p_couple_id
      and user_id = auth.uid()
      and active
  );
$$;

-- Reveal check for answers (mirrors src/server/policies/assignment-policy.ts).
create or replace function assignment_is_revealed(p_assignment_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from question_assignments
    where id = p_assignment_id
      and status in ('revealed','insight_generating','insight_ready','completed')
  );
$$;

-- Accept an invitation atomically. The client sends only the HASH of the
-- secret (hashing happens on the Next.js server with the pepper); raw
-- secrets never reach Postgres.
create or replace function accept_couple_invitation(p_secret_hash text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_invitation couple_invitations%rowtype;
  v_couple_id uuid;
begin
  select * into v_invitation
  from couple_invitations
  where (token_hash = p_secret_hash or code_hash = p_secret_hash)
    and used_at is null
    and revoked_at is null
    and expires_at > now()
  for update;

  if not found then
    -- count the failure against the caller's guessable invitations
    update couple_invitations
      set attempt_count = attempt_count + 1,
          revoked_at = case when attempt_count + 1 >= 5 then now() else revoked_at end
      where used_at is null and revoked_at is null and expires_at > now();
    raise exception 'invitation_not_found';
  end if;

  if v_invitation.attempt_count >= 5 then
    raise exception 'invitation_locked';
  end if;
  if v_invitation.inviter_user_id = auth.uid() then
    raise exception 'cannot_accept_own_invitation';
  end if;
  if exists (select 1 from couple_members where user_id = auth.uid() and active) then
    raise exception 'already_paired';
  end if;
  if exists (select 1 from couple_members where user_id = v_invitation.inviter_user_id and active) then
    raise exception 'inviter_already_paired';
  end if;

  insert into couples (status, relationship_stage, paired_at)
  values ('active', v_invitation.relationship_stage, now())
  returning id into v_couple_id;

  insert into couple_members (couple_id, user_id) values
    (v_couple_id, v_invitation.inviter_user_id),
    (v_couple_id, auth.uid());

  update couple_invitations
    set used_at = now(), used_by_user_id = auth.uid()
    where id = v_invitation.id;

  insert into timeline_events (couple_id, kind, title, date)
  values (v_couple_id, 'paired', '二人がアプリでつながった日', current_date);

  return v_couple_id;
end $$;

-- Submit an answer; when both members have submitted, advance
-- submitted → waiting_partner → ready_to_reveal → revealed in ONE
-- transaction with a single revealed_at. No half-revealed state exists.
create or replace function submit_answer_and_maybe_reveal(p_assignment_id uuid)
returns assignment_status
language plpgsql security definer set search_path = public as $$
declare
  v_assignment question_assignments%rowtype;
  v_both boolean;
  v_now timestamptz := now();
begin
  select * into v_assignment
  from question_assignments where id = p_assignment_id for update;
  if not found then raise exception 'assignment_not_found'; end if;
  if not is_active_couple_member(v_assignment.couple_id) then
    raise exception 'not_a_member';
  end if;
  if v_assignment.status in ('revealed','insight_generating','insight_ready','completed') then
    raise exception 'already_revealed';
  end if;

  update answers
    set submitted = true, submitted_at = v_now
    where assignment_id = p_assignment_id and user_id = auth.uid();
  if not found then raise exception 'no_draft_to_submit'; end if;

  select count(*) = 2 into v_both
  from answers a
  join couple_members m
    on m.couple_id = v_assignment.couple_id and m.user_id = a.user_id and m.active
  where a.assignment_id = p_assignment_id and a.submitted;

  if v_both then
    update question_assignments
      set status = 'revealed',
          revealed_at = v_now,
          status_history = status_history
            || jsonb_build_array(
                 jsonb_build_object('status','submitted','at',v_now),
                 jsonb_build_object('status','ready_to_reveal','at',v_now),
                 jsonb_build_object('status','revealed','at',v_now))
      where id = p_assignment_id;
    return 'revealed';
  else
    update question_assignments
      set status = 'waiting_partner',
          status_history = status_history
            || jsonb_build_array(
                 jsonb_build_object('status','submitted','at',v_now),
                 jsonb_build_object('status','waiting_partner','at',v_now))
      where id = p_assignment_id;
    return 'waiting_partner';
  end if;
end $$;

-- Idempotent claim for insight generation (dedupe, spec §10).
-- Returns the claimed row id, or null when an identical generation already
-- succeeded or is in flight.
create or replace function claim_insight_generation(
  p_assignment_id uuid, p_input_hash text, p_schema_version int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_couple uuid;
  v_id uuid;
begin
  select couple_id into v_couple from question_assignments where id = p_assignment_id;
  if v_couple is null or not is_active_couple_member(v_couple) then
    raise exception 'not_a_member';
  end if;
  if exists (
    select 1 from ai_insights
    where assignment_id = p_assignment_id
      and input_hash = p_input_hash
      and status in ('generating','succeeded')
  ) then
    return null;
  end if;
  insert into ai_insights (couple_id, assignment_id, input_hash, schema_version, attempt, is_current, status)
  values (
    v_couple, p_assignment_id, p_input_hash, p_schema_version,
    coalesce((select max(attempt) from ai_insights where assignment_id = p_assignment_id), 0) + 1,
    true, 'generating'
  )
  on conflict (assignment_id, input_hash, attempt) do nothing
  returning id into v_id;
  if v_id is not null then
    update ai_insights set is_current = false
      where assignment_id = p_assignment_id and id <> v_id;
  end if;
  return v_id;
end $$;

-- Unpair: deactivate memberships and kill open invitations at once.
create or replace function unpair_couple()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_couple_id uuid;
begin
  select couple_id into v_couple_id
  from couple_members where user_id = auth.uid() and active;
  if v_couple_id is null then return; end if;

  update couples set status = 'unpaired', unpaired_at = now() where id = v_couple_id;
  update couple_members set active = false, left_at = now() where couple_id = v_couple_id;
  update couple_invitations set revoked_at = now()
    where used_at is null and revoked_at is null
      and inviter_user_id in (select user_id from couple_members where couple_id = v_couple_id);
end $$;

-- lock down execution
revoke all on function accept_couple_invitation(text) from public;
revoke all on function submit_answer_and_maybe_reveal(uuid) from public;
revoke all on function claim_insight_generation(uuid, text, int) from public;
revoke all on function unpair_couple() from public;
grant execute on function accept_couple_invitation(text) to authenticated;
grant execute on function submit_answer_and_maybe_reveal(uuid) to authenticated;
grant execute on function claim_insight_generation(uuid, text, int) to authenticated;
grant execute on function unpair_couple() to authenticated;
grant execute on function is_active_couple_member(uuid) to authenticated;
grant execute on function assignment_is_revealed(uuid) to authenticated;

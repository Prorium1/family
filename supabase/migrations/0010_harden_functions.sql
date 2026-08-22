-- ────────────────────────────────────────────────────────────────
-- 0010_harden_functions: close what the database linter found.
--
-- 1. `set_updated_at` ran with a mutable search_path, so a role with a
--    schema of its own could shadow what the trigger resolves.
-- 2. Supabase's default privileges hand EXECUTE on new public functions to
--    `anon`. 0003 revoked PUBLIC but not that explicit grant, so every
--    pairing and reveal RPC was reachable without signing in. They are all
--    guarded by auth.uid() internally — an anonymous call could not have
--    paired anyone — but an endpoint that cannot be called is better than
--    one that fails safely.
--
-- `peek_couple_invitation` stays anonymous on purpose: the /join landing
-- shows an invited partner who invited them before they have an account,
-- and it returns nothing but a display name and a stage (0006).
-- ────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  new.updated_at = now();
  return new;
end $$;

revoke execute on function accept_couple_invitation(text) from anon;
revoke execute on function submit_answer_and_maybe_reveal(uuid) from anon;
revoke execute on function claim_insight_generation(uuid, text, int) from anon;
revoke execute on function unpair_couple() from anon;
-- These two are only ever called from inside RLS policies. 0003 granted them
-- to `authenticated` but never took them away from PUBLIC, which is how the
-- anon role still reached them.
revoke execute on function is_active_couple_member(uuid) from public, anon;
revoke execute on function assignment_is_revealed(uuid) from public, anon;
grant execute on function is_active_couple_member(uuid) to authenticated;
grant execute on function assignment_is_revealed(uuid) to authenticated;

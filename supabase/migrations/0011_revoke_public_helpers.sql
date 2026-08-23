-- ────────────────────────────────────────────────────────────────
-- 0011_revoke_public_helpers: RLS helper functions are for policies,
-- not for anonymous callers. (Applied to production 2026-08-22; this
-- file backfills the repo so the two histories match.)
-- ────────────────────────────────────────────────────────────────

revoke execute on function is_active_couple_member(uuid) from public, anon;
revoke execute on function assignment_is_revealed(uuid) from public, anon;
grant execute on function is_active_couple_member(uuid) to authenticated;
grant execute on function assignment_is_revealed(uuid) to authenticated;

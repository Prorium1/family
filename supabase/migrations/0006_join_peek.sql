-- ────────────────────────────────────────────────────────────────
-- 0006_join_peek: anonymous-safe invitation preview for the /join
-- landing page. Exposes ONLY the inviter's display name and the
-- relationship stage — never hashes, ids or expiry internals — and
-- only while the invitation is still redeemable.
-- ────────────────────────────────────────────────────────────────
create or replace function peek_couple_invitation(p_secret_hash text)
returns table (inviter_name text, stage relationship_stage)
language sql stable security definer set search_path = public as $$
  select p.display_name, i.relationship_stage
  from couple_invitations i
  join profiles p on p.id = i.inviter_user_id
  where (i.token_hash = p_secret_hash or i.code_hash = p_secret_hash)
    and i.used_at is null
    and i.revoked_at is null
    and i.expires_at > now()
    and i.attempt_count < 5
  limit 1;
$$;

revoke all on function peek_couple_invitation(text) from public;
grant execute on function peek_couple_invitation(text) to anon, authenticated;

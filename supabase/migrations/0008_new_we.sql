-- ────────────────────────────────────────────────────────────────
-- 0008_new_we: NEW WE — what the couple builds (docs/BRAND.md §0.2)
--
-- This is the product's asset, in place of a compatibility score: what they
-- newly learned about each other, the third answer they made together, what
-- they promised, and the future they found.
--
-- Every row is written by a person. The AI only ever drafts; nothing here is
-- created by a model, which is why created_by_user_id is not nullable.
-- ────────────────────────────────────────────────────────────────

create type we_entry_kind as enum ('discovery', 'answer', 'promise', 'future');
create type we_entry_source as enum ('daily', 'repair', 'agreement', 'journey', 'manual');

create table we_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  kind we_entry_kind not null,
  title text not null,
  body text not null default '',
  source_type we_entry_source not null,
  source_id text,
  created_by_user_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index we_entries_couple_created on we_entries (couple_id, created_at desc);

alter table we_entries enable row level security;

-- Shared by the couple, like every other record they made together.
create policy we_entries_member on we_entries
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));

comment on table we_entries is
  'NEW WE: the couple''s own answers, discoveries, promises and future. Never scored, never ranked.';

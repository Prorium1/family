-- ────────────────────────────────────────────────────────────────
-- 0012_couple_life: the couple's everyday layer — 予定・メモ・サイン・周期.
--
--   couple_dates    anniversaries, family events, memorial days, trips,
--                   one-shot reminders. Yearly repetition is a column, not
--                   an inference from the kind.
--   couple_notes    shared notes: everyday memos, trip plans, and the
--                   もしものときメモ (emergency note).
--   couple_signals  one-tap presence signs. A fixed vocabulary, a user and
--                   a timestamp — deliberately NOTHING else: no location,
--                   no free text, nothing to surveil with.
--   cycle_records   からだの周期. One row per person. The dates live in ONE
--                   encrypted text payload; sharing is off until the owner
--                   turns it on, and the RLS below makes an unshared row
--                   invisible to the partner even with a direct query.
--
-- title/note/body/payload are written by the app encrypted (AES-256-GCM,
-- docs/SECURITY.md §11) — the operator's console shows ciphertext.
-- ────────────────────────────────────────────────────────────────

create type couple_date_kind as enum
  ('anniversary', 'family_event', 'memorial', 'trip', 'reminder');

create table couple_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  kind couple_date_kind not null,
  title text not null,
  date date not null,
  repeats_yearly boolean not null default false,
  note text not null default '',
  -- belongs to the couple: the record survives its author (see 0009)
  created_by_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index couple_dates_couple_date on couple_dates (couple_id, date);

create table couple_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  kind text not null check (kind in ('memo', 'trip', 'emergency')),
  title text not null,
  body text not null default '',
  created_by_user_id uuid references profiles(id) on delete set null,
  updated_by_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index couple_notes_couple_updated on couple_notes (couple_id, updated_at desc);

create table couple_signals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  -- a sign is one person's tap: it leaves with them
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in
    ('good_morning', 'heading_out', 'got_home', 'work_done', 'good_night', 'thinking_of_you')),
  created_at timestamptz not null default now()
);

create index couple_signals_couple_created on couple_signals (couple_id, created_at desc);

create table cycle_records (
  -- one person's body, one row: it leaves with them
  user_id uuid primary key references profiles(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  shared_with_partner boolean not null default false,
  -- encrypted JSON ({"starts": [...]}) — text, never jsonb, so the database
  -- cannot index, preview, or accidentally expose what is inside
  payload text not null,
  updated_at timestamptz not null default now()
);

alter table couple_dates enable row level security;
alter table couple_notes enable row level security;
alter table couple_signals enable row level security;
alter table cycle_records enable row level security;

create policy couple_dates_member on couple_dates
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));

create policy couple_notes_member on couple_notes
  for all using (is_active_couple_member(couple_id))
  with check (is_active_couple_member(couple_id));

create policy couple_signals_member_read on couple_signals
  for select using (is_active_couple_member(couple_id));
create policy couple_signals_own_write on couple_signals
  for insert with check (user_id = auth.uid() and is_active_couple_member(couple_id));

-- からだの周期: the owner has full control; the partner can see the row only
-- while sharing is on. Nobody else, under any policy, sees it at all.
create policy cycle_records_owner on cycle_records
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_active_couple_member(couple_id));
create policy cycle_records_partner_read on cycle_records
  for select using (shared_with_partner and is_active_couple_member(couple_id));

comment on table couple_signals is
  'One-tap presence signs. No location, no free text — by design (privacy policy §1).';
comment on table cycle_records is
  'Cycle sharing: opt-in, per person, payload encrypted by the app. Health data — treat as 要配慮個人情報.';

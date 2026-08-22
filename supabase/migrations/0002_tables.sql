-- ────────────────────────────────────────────────────────────────
-- 0002_tables: full schema per spec §22
-- ────────────────────────────────────────────────────────────────

-- ユーザーとカップル ------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'ja',
  timezone text not null default 'Asia/Tokyo',
  age_confirmed boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

create table couples (
  id uuid primary key default gen_random_uuid(),
  status couple_status not null default 'active',
  relationship_stage relationship_stage not null default 'dating',
  anniversary date,
  paired_at timestamptz default now(),
  unpaired_at timestamptz,
  created_at timestamptz not null default now()
);

create table couple_members (
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (couple_id, user_id)
);
-- one ACTIVE couple per user
create unique index one_active_couple_per_user
  on couple_members (user_id) where active;

create table couple_invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  code_hash text not null,
  relationship_stage relationship_stage not null default 'dating',
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_user_id uuid references profiles(id),
  revoked_at timestamptz,
  attempt_count int not null default 0,
  created_at timestamptz not null default now()
);
create index invitations_code_hash on couple_invitations (code_hash);

create table relationship_stages (
  couple_id uuid not null references couples(id) on delete cascade,
  stage relationship_stage not null,
  changed_at timestamptz not null default now(),
  primary key (couple_id, changed_at)
);

-- 質問 --------------------------------------------------------------
create table question_packs (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  active boolean not null default true
);

create table questions (
  id text primary key,
  pack_id text not null references question_packs(id),
  format question_format not null default 'free_text',
  category text not null,
  stages text[] not null default '{}',  -- empty = all stages
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  sensitivity smallint not null default 0 check (sensitivity between 0 and 3),
  estimated_minutes smallint not null default 3,
  preferred_weekday smallint check (preferred_weekday between 0 and 6),
  prerequisite_question_id text references questions(id),
  locale text not null default 'ja',
  version int not null default 1,
  premium boolean not null default false,
  active boolean not null default true,
  ai_follow_up_allowed boolean not null default true,
  text text not null,
  helper text,
  options jsonb
);

create table question_assignments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  question_id text not null references questions(id),
  source text not null default 'daily' check (source in ('daily','journey','weekly_checkin')),
  journey_step_id text,
  assigned_date date not null,
  status assignment_status not null default 'assigned',
  status_history jsonb not null default '[]',
  revealed_at timestamptz,
  insight_error text,
  created_at timestamptz not null default now(),
  unique (couple_id, source, assigned_date, journey_step_id)
);
create index assignments_couple on question_assignments (couple_id, assigned_date);

create table answers (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references question_assignments(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value jsonb not null,
  visibility visibility_level not null default 'shared',
  submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, user_id)
);
create trigger answers_updated before update on answers
  for each row execute function set_updated_at();

create table answer_revisions (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  value jsonb not null,
  edited_at timestamptz not null default now()
);

create table ai_insights (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  assignment_id uuid not null references question_assignments(id) on delete cascade,
  kind text not null default 'daily',
  schema_version int not null default 1,
  input_hash text not null,
  attempt int not null default 1,
  is_current boolean not null default true,
  status generation_status not null default 'generating',
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (assignment_id, input_hash, attempt)
);

-- Journey -----------------------------------------------------------
create table journeys (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  stage_hint text[] not null default '{}',
  premium boolean not null default false,
  active boolean not null default true,
  "order" int not null default 0
);

create table journey_steps (
  id text primary key,
  journey_id text not null references journeys(id) on delete cascade,
  "order" int not null,
  title text not null,
  question_id text not null references questions(id)
);

create table journey_progress (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  journey_id text not null references journeys(id),
  status journey_progress_status not null default 'not_started',
  completed_step_ids text[] not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  unique (couple_id, journey_id)
);

-- 週間チェックイン ---------------------------------------------------
create table weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  week_key text not null,
  status text not null default 'open'
    check (status in ('open','waiting_partner','revealed','completed')),
  revealed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (couple_id, week_key)
);

create table weekly_checkin_answers (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references weekly_checkins(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null default '[]',
  submitted boolean not null default false,
  submitted_at timestamptz,
  unique (checkin_id, user_id)
);

create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references weekly_checkins(id) on delete cascade,
  schema_version int not null default 1,
  payload jsonb,
  status generation_status not null default 'generating',
  created_at timestamptz not null default now()
);

-- Repair ------------------------------------------------------------
create table repair_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  initiator_user_id uuid not null references profiles(id),
  mode repair_mode not null default 'solo',
  status repair_session_status not null default 'open',
  topic text,
  safety_level safety_level not null default 'none',
  safety_categories text[] not null default '{}',
  partner_notified boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table repair_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references repair_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id text not null,
  text text not null,
  visibility visibility_level not null default 'ai_summary',
  shared_excerpts text[] not null default '{}',
  submitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, user_id, prompt_id)
);
create trigger repair_entries_updated before update on repair_entries
  for each row execute function set_updated_at();

create table repair_insights (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references repair_sessions(id) on delete cascade,
  schema_version int not null default 1,
  input_hash text not null,
  attempt int not null default 1,
  is_current boolean not null default true,
  status generation_status not null default 'generating',
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, input_hash, attempt)
);

create table repair_agreements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references repair_sessions(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  text text not null,
  agreed_by_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 二人の未来と記録 ----------------------------------------------------
create table agreements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  category future_category not null,
  title text not null,
  background text not null default '',
  decision text not null,
  starts_on date,
  review_on date,
  status agreement_status not null default 'active',
  created_by_user_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agreements_updated before update on agreements
  for each row execute function set_updated_at();

create table agreement_revisions (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references agreements(id) on delete cascade,
  title text not null,
  background text not null default '',
  decision text not null,
  comment text,
  edited_by_user_id uuid not null references profiles(id),
  edited_at timestamptz not null default now()
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  title text not null,
  note text not null default '',
  date date not null,
  created_by_user_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  kind text not null,
  title text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create table relationship_manual_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  subject_user_id uuid not null references profiles(id),
  category text not null,
  statement text not null,
  source_type manual_source_type not null default 'ai_inference',
  source_ids text[] not null default '{}',
  confidence text not null default 'medium' check (confidence in ('low','medium','high')),
  confirmed_by_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger manual_items_updated before update on relationship_manual_items
  for each row execute function set_updated_at();

create table relationship_summaries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  summary text not null,
  source_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 設定 ---------------------------------------------------------------
create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  daily_question boolean not null default true,
  both_revealed boolean not null default true,
  weekly_checkin boolean not null default true,
  gratitude_received boolean not null default true,
  preferred_time text not null default '20:00',
  couple_time_start text,
  couple_time_end text
);

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind consent_kind not null,
  granted boolean not null,
  version text not null default '1.0',
  recorded_at timestamptz not null default now()
);

create table user_data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind data_request_kind not null,
  status data_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','couple_premium')),
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table entitlements (
  couple_id uuid not null references couples(id) on delete cascade,
  entitlement text not null,
  granted_at timestamptz not null default now(),
  primary key (couple_id, entitlement)
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_couple_id uuid references couples(id) on delete set null,
  referred_couple_id uuid references couples(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','completed')),
  created_at timestamptz not null default now()
);

create table feature_flags (
  key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 安全と監査 ----------------------------------------------------------
create table safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  couple_id uuid references couples(id) on delete set null,
  context text not null,
  level safety_level not null,
  categories text[] not null default '{}',
  -- metadata only: the triggering text is never stored
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  created_at timestamptz not null default now()
);

-- §22: metadata only — answer text must never appear in these columns.
create table ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  user_id uuid references profiles(id) on delete set null,
  couple_id uuid references couples(id) on delete set null,
  kind text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  success boolean not null,
  duration_ms int not null,
  schema_version int not null,
  error_code text,
  created_at timestamptz not null default now()
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);

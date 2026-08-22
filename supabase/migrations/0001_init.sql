-- ────────────────────────────────────────────────────────────────
-- 0001_init: extensions + enums mirroring src/types/domain.ts
-- ────────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

create type relationship_stage as enum (
  'dating', 'long_distance', 'cohabiting', 'considering_engagement',
  'engaged', 'married', 'preparing_for_children', 'parenting', 'long_term_partners'
);

create type couple_status as enum ('pending', 'active', 'unpaired');

create type assignment_status as enum (
  'assigned', 'draft', 'submitted', 'waiting_partner', 'ready_to_reveal',
  'revealed', 'insight_generating', 'insight_ready', 'completed'
);

create type question_format as enum (
  'free_text', 'single_choice', 'multi_choice', 'scale_5', 'ranking', 'binary', 'short_text'
);

create type visibility_level as enum (
  'private', 'ai_only', 'ai_summary', 'shared_excerpt', 'shared'
);

create type safety_level as enum ('none', 'needs_support', 'urgent');

create type manual_source_type as enum (
  'user_stated', 'shared_agreement', 'ai_inference', 'needs_confirmation'
);

create type future_category as enum ('marriage', 'money', 'family', 'work', 'dream');

create type agreement_status as enum ('draft', 'active', 'under_review', 'archived');

create type repair_session_status as enum (
  'open', 'waiting_partner', 'analyzing', 'insight_ready',
  'paused_for_safety', 'resolved', 'closed'
);

create type repair_mode as enum ('solo', 'together');

create type journey_progress_status as enum ('not_started', 'in_progress', 'completed', 'paused');

create type generation_status as enum ('generating', 'succeeded', 'failed');

create type consent_kind as enum ('terms', 'ai_processing', 'ai_training');

create type data_request_kind as enum ('export', 'deletion');
create type data_request_status as enum ('pending', 'completed', 'cancelled');

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

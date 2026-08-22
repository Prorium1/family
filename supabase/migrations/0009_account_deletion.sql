-- ────────────────────────────────────────────────────────────────
-- 0009_account_deletion: make deleting an account actually possible.
--
-- Deletion and export are promised to every user and are never paid
-- features (spec §27). But seven author columns referenced profiles with
-- NO ON DELETE action, so `delete from auth.users` failed with a foreign
-- key violation — the promise could not be kept.
--
-- The rule is: a record that belongs to the COUPLE survives, with its
-- author forgotten; a record that belongs to ONE PERSON leaves with them.
-- ────────────────────────────────────────────────────────────────

-- Belongs to the couple → keep the record, forget who wrote it.
alter table we_entries alter column created_by_user_id drop not null;
alter table we_entries drop constraint we_entries_created_by_user_id_fkey;
alter table we_entries add constraint we_entries_created_by_user_id_fkey
  foreign key (created_by_user_id) references profiles(id) on delete set null;

alter table agreements alter column created_by_user_id drop not null;
alter table agreements drop constraint agreements_created_by_user_id_fkey;
alter table agreements add constraint agreements_created_by_user_id_fkey
  foreign key (created_by_user_id) references profiles(id) on delete set null;

alter table agreement_revisions alter column edited_by_user_id drop not null;
alter table agreement_revisions drop constraint agreement_revisions_edited_by_user_id_fkey;
alter table agreement_revisions add constraint agreement_revisions_edited_by_user_id_fkey
  foreign key (edited_by_user_id) references profiles(id) on delete set null;

alter table memories alter column created_by_user_id drop not null;
alter table memories drop constraint memories_created_by_user_id_fkey;
alter table memories add constraint memories_created_by_user_id_fkey
  foreign key (created_by_user_id) references profiles(id) on delete set null;

alter table couple_invitations drop constraint couple_invitations_used_by_user_id_fkey;
alter table couple_invitations add constraint couple_invitations_used_by_user_id_fkey
  foreign key (used_by_user_id) references profiles(id) on delete set null;

-- Belongs to one person → it leaves with them.
-- A private repair session is the clearest case: it was never shared.
alter table repair_sessions drop constraint repair_sessions_initiator_user_id_fkey;
alter table repair_sessions add constraint repair_sessions_initiator_user_id_fkey
  foreign key (initiator_user_id) references profiles(id) on delete cascade;

-- A manual item is a statement ABOUT someone; it is meaningless once the
-- person it describes is gone.
alter table relationship_manual_items drop constraint relationship_manual_items_subject_user_id_fkey;
alter table relationship_manual_items add constraint relationship_manual_items_subject_user_id_fkey
  foreign key (subject_user_id) references profiles(id) on delete cascade;

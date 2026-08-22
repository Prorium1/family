-- ────────────────────────────────────────────────────────────────
-- 0005_storage_realtime: couple-scoped storage bucket (future photo
-- memories) + private realtime authorization (spec §23).
-- Paths: couple-media/couples/{couple_id}/...
-- ────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do nothing;

create policy couple_media_read on storage.objects
  for select using (
    bucket_id = 'couple-media'
    and is_active_couple_member(((storage.foldername(name))[2])::uuid)
  );

create policy couple_media_write on storage.objects
  for insert with check (
    bucket_id = 'couple-media'
    and is_active_couple_member(((storage.foldername(name))[2])::uuid)
  );

create policy couple_media_delete on storage.objects
  for delete using (
    bucket_id = 'couple-media'
    and is_active_couple_member(((storage.foldername(name))[2])::uuid)
  );

-- Realtime: private channels only. Channel name convention: couple:{couple_id}
create policy realtime_couple_channels on realtime.messages
  for select using (
    realtime.topic() like 'couple:%'
    and is_active_couple_member(split_part(realtime.topic(), ':', 2)::uuid)
  );
create policy realtime_couple_channels_write on realtime.messages
  for insert with check (
    realtime.topic() like 'couple:%'
    and is_active_couple_member(split_part(realtime.topic(), ':', 2)::uuid)
  );

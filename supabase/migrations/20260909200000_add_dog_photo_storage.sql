insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', false)
on conflict (id) do nothing;

drop policy if exists "Owners upload dog photos" on storage.objects;
create policy "Owners upload dog photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners view dog photos" on storage.objects;
create policy "Owners view dog photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners update dog photos" on storage.objects;
create policy "Owners update dog photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners delete dog photos" on storage.objects;
create policy "Owners delete dog photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'dog-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

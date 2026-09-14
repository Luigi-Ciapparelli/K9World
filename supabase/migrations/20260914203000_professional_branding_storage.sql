-- Public professional identity image / logo.
-- Public by design because it appears in public search/profile surfaces.
-- Only the authenticated owner may create, replace or delete objects in their folder.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'professional-branding',
  'professional-branding',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Professionals upload own branding" on storage.objects;
create policy "Professionals upload own branding"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'professional-branding'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'professional'
  )
);

drop policy if exists "Professionals update own branding" on storage.objects;
create policy "Professionals update own branding"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'professional-branding'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'professional-branding'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Professionals delete own branding" on storage.objects;
create policy "Professionals delete own branding"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'professional-branding'
  and (storage.foldername(name))[1] = auth.uid()::text
);

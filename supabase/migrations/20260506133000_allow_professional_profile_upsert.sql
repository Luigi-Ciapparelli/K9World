-- Allow a logged-in user with role professional/admin to create their own professionals row.
-- This fixes existing accounts that can access pro settings but do not yet have a professionals record.

grant insert on public.professionals to authenticated;

drop policy if exists "Professionals can create own onboarding profile" on public.professionals;

create policy "Professionals can create own onboarding profile"
on public.professionals
for insert
to authenticated
with check (
  auth.uid() = id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('professional', 'admin')
  )
);

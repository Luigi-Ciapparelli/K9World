-- Admin helper function.
-- Uses SECURITY DEFINER so RLS policies can safely check the current user's profile role.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;


-- Profiles admin policies
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- Professionals admin policies
drop policy if exists "Admins can view all professionals" on public.professionals;
drop policy if exists "Admins can update all professionals" on public.professionals;

create policy "Admins can view all professionals"
on public.professionals
for select
to authenticated
using (public.is_admin());

create policy "Admins can update all professionals"
on public.professionals
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- Dogs admin policies
drop policy if exists "Admins can view all dogs" on public.dogs;

create policy "Admins can view all dogs"
on public.dogs
for select
to authenticated
using (public.is_admin());


-- Services admin policies
drop policy if exists "Admins can view all services" on public.services;
drop policy if exists "Admins can update all services" on public.services;

create policy "Admins can view all services"
on public.services
for select
to authenticated
using (public.is_admin());

create policy "Admins can update all services"
on public.services
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- Bookings admin policies
drop policy if exists "Admins can view all bookings" on public.bookings;
drop policy if exists "Admins can update all bookings" on public.bookings;

create policy "Admins can view all bookings"
on public.bookings
for select
to authenticated
using (public.is_admin());

create policy "Admins can update all bookings"
on public.bookings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- Booking dogs admin policy
drop policy if exists "Admins can view all booking dogs" on public.booking_dogs;

create policy "Admins can view all booking dogs"
on public.booking_dogs
for select
to authenticated
using (public.is_admin());

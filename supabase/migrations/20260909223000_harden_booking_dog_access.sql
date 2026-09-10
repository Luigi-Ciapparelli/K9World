-- Harden booking and dog access.

-- A booking can be created only by its owner and only after email verification.
drop policy if exists "Owner create bookings" on public.bookings;

create policy "Owner create bookings"
on public.bookings
for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.email_verified = true
  )
);

-- An owner may attach only one of their own dogs to one of their own bookings.
drop policy if exists "Owner insert booking_dogs" on public.booking_dogs;

create policy "Owner insert booking_dogs"
on public.booking_dogs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bookings b
    join public.dogs d on d.id = dog_id
    where b.id = booking_id
      and b.owner_id = auth.uid()
      and d.owner_id = auth.uid()
  )
);

-- Professionals may see only dogs explicitly linked to their bookings.
drop policy if exists "Pro view booked dogs" on public.dogs;

create policy "Pro view booked dogs"
on public.dogs
for select
to authenticated
using (
  exists (
    select 1
    from public.booking_dogs bd
    join public.bookings b on b.id = bd.booking_id
    where bd.dog_id = dogs.id
      and b.professional_id = auth.uid()
      and b.status in ('pending', 'accepted', 'completed')
  )
);

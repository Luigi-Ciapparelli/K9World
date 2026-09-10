-- Create a booking and attach its dog atomically.
-- The client supplies only identifiers, start time and notes.
-- Price, duration and professional are taken from the database.

create or replace function public.create_booking_with_dog(
  p_service_id uuid,
  p_dog_id uuid,
  p_start_at timestamptz,
  p_notes text default ''
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_service public.services%rowtype;
  v_booking public.bookings%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Email verification is mandatory.
  if not exists (
    select 1
    from public.profiles p
    where p.id = v_user_id
      and p.email_verified = true
  ) then
    raise exception 'Email verification required';
  end if;

  -- The dog must belong to the authenticated owner.
  if not exists (
    select 1
    from public.dogs d
    where d.id = p_dog_id
      and d.owner_id = v_user_id
  ) then
    raise exception 'Invalid dog';
  end if;

  -- Service must exist, be active and belong to an approved professional.
  select s.*
  into v_service
  from public.services s
  join public.professionals pr
    on pr.id = s.professional_id
  where s.id = p_service_id
    and s.active = true
    and pr.approved = true
    and coalesce(pr.approval_status, 'approved') = 'approved';

  if not found then
    raise exception 'Service unavailable';
  end if;

  if p_start_at <= now() then
    raise exception 'Booking must be in the future';
  end if;

  if coalesce(v_service.duration_minutes, 0) <= 0 then
    raise exception 'Invalid service duration';
  end if;

  insert into public.bookings (
    owner_id,
    professional_id,
    service_id,
    start_at,
    end_at,
    status,
    price,
    notes
  )
  values (
    v_user_id,
    v_service.professional_id,
    v_service.id,
    p_start_at,
    p_start_at + make_interval(mins => v_service.duration_minutes),
    'pending',
    v_service.price,
    coalesce(p_notes, '')
  )
  returning *
  into v_booking;

  insert into public.booking_dogs (
    booking_id,
    dog_id
  )
  values (
    v_booking.id,
    p_dog_id
  );

  return v_booking;
end;
$$;

revoke all on function public.create_booking_with_dog(uuid, uuid, timestamptz, text)
from public;

grant execute on function public.create_booking_with_dog(uuid, uuid, timestamptz, text)
to authenticated;

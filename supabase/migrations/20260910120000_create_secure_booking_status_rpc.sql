-- Secure booking status transitions.
-- Owners and professionals cannot freely update booking rows.

create or replace function public.change_booking_status(
  p_booking_id uuid,
  p_new_status text
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_booking public.bookings%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;

  -- Owner: only pending -> cancelled.
  if v_booking.owner_id = v_user_id then
    if not (
      v_booking.status = 'pending'
      and p_new_status = 'cancelled'
    ) then
      raise exception 'Invalid owner booking transition';
    end if;

  -- Professional:
  -- pending -> accepted / declined
  -- accepted -> completed
  elsif v_booking.professional_id = v_user_id then
    if not (
      (v_booking.status = 'pending' and p_new_status in ('accepted', 'declined'))
      or
      (v_booking.status = 'accepted' and p_new_status = 'completed')
    ) then
      raise exception 'Invalid professional booking transition';
    end if;

  else
    raise exception 'Not authorized';
  end if;

  update public.bookings
  set status = p_new_status
  where id = p_booking_id
  returning *
  into v_booking;

  return v_booking;
end;
$$;

revoke all
on function public.change_booking_status(uuid, text)
from public;

grant execute
on function public.change_booking_status(uuid, text)
to authenticated;

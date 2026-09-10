-- All booking mutations must go through controlled RPC functions.
-- Authenticated clients retain SELECT access governed by RLS.

revoke insert, update, delete
on public.bookings
from authenticated;

revoke insert, update, delete
on public.booking_dogs
from authenticated;

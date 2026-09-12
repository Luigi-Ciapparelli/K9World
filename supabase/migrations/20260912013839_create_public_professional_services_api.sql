-- Safe public API for active services belonging to approved PawConnect professionals.
-- Keeps anonymous/public clients away from direct base-table access.

-- Anonymous clients must use the whitelisted RPC below instead of the base table.
revoke select on table public.services from anon;

create or replace function public.get_public_professional_services(
  p_professional_id uuid
)
returns table (
  id uuid,
  professional_id uuid,
  service_type text,
  name text,
  description text,
  price numeric,
  duration_kind text,
  duration_minutes integer,
  active boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    s.id,
    s.professional_id,
    s.service_type,
    s.name,
    s.description,
    s.price,
    s.duration_kind,
    s.duration_minutes,
    s.active
  from public.services as s
  join public.professionals as p
    on p.id = s.professional_id
  where s.professional_id = p_professional_id
    and s.active = true
    and p.approved = true
    and p.approval_status = 'approved'
  order by s.created_at desc;
$function$;

revoke all
on function public.get_public_professional_services(uuid)
from public;

revoke all
on function public.get_public_professional_services(uuid)
from anon, authenticated;

grant execute
on function public.get_public_professional_services(uuid)
to anon, authenticated;

comment on function public.get_public_professional_services(uuid) is
'Return the public whitelist of active services for one approved PawConnect professional without exposing the services or professionals base tables directly.';

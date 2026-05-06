-- Secure professional approval workflow.
-- Professionals can update their public onboarding/profile fields,
-- but cannot approve themselves.
-- Admin approval changes go through a SECURITY DEFINER RPC.

-- Remove broad update permission on professionals from authenticated users.
revoke update on public.professionals from authenticated;

-- Allow authenticated users to update only safe self-editable professional columns.
grant update (
  professional_type,
  bio,
  zone_text,
  latitude,
  longitude,
  coverage_radius_km,
  starting_price,
  cover_photo_url,
  business_name,
  vat_number,
  website_url,
  instagram_url,
  years_experience,
  qualification_summary,
  insurance_summary,
  updated_at
) on public.professionals to authenticated;

-- Keep select permission.
grant select on public.professionals to authenticated;
grant select on public.professionals to anon;

-- Function used by admins to approve/reject/set pending.
create or replace function public.admin_set_professional_approval(
  target_professional_id uuid,
  new_approval_status text,
  new_admin_notes text default null,
  new_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change professional approval status';
  end if;

  if new_approval_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid approval status';
  end if;

  update public.professionals
  set
    approval_status = new_approval_status,
    approved = (new_approval_status = 'approved'),
    admin_notes = new_admin_notes,
    rejection_reason = case
      when new_approval_status = 'rejected' then new_rejection_reason
      else null
    end,
    updated_at = now()
  where id = target_professional_id;
end;
$$;

grant execute on function public.admin_set_professional_approval(uuid, text, text, text) to authenticated;

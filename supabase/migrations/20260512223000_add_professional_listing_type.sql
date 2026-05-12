-- Add profile type fields for individual professionals, centers, businesses and boarding facilities.

alter table public.professionals
add column if not exists listing_type text not null default 'individual'
check (listing_type in ('individual', 'business', 'center', 'boarding_facility'));

alter table public.professionals
add column if not exists main_contact_name text;

alter table public.professionals
add column if not exists has_facility boolean not null default false;

alter table public.professionals
add column if not exists facility_description text;

alter table public.professionals
add column if not exists team_size integer not null default 1;

grant update (
  listing_type,
  main_contact_name,
  has_facility,
  facility_description,
  team_size
) on public.professionals to authenticated;

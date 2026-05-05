-- Improve professional onboarding and admin approval workflow.

alter table public.professionals
add column if not exists approval_status text not null default 'pending'
check (approval_status in ('pending', 'approved', 'rejected'));

alter table public.professionals
add column if not exists admin_notes text;

alter table public.professionals
add column if not exists rejection_reason text;

alter table public.professionals
add column if not exists business_name text;

alter table public.professionals
add column if not exists vat_number text;

alter table public.professionals
add column if not exists website_url text;

alter table public.professionals
add column if not exists instagram_url text;

alter table public.professionals
add column if not exists years_experience integer default 0;

alter table public.professionals
add column if not exists qualification_summary text;

alter table public.professionals
add column if not exists insurance_summary text;

alter table public.professionals
add column if not exists updated_at timestamptz default now();

-- Keep old approved boolean compatible with the new status.
update public.professionals
set approval_status = case
  when approved = true then 'approved'
  else 'pending'
end
where approval_status is null
   or approval_status = 'pending';

-- When a new professional registers, they should not appear publicly.
alter table public.professionals
alter column approved set default false;

alter table public.professionals
alter column approval_status set default 'pending';

-- Public search should show only approved professionals.
drop policy if exists "Public view approved pros" on public.professionals;

create policy "Public view approved pros"
on public.professionals
for select
to anon, authenticated
using (
  approved = true
  and approval_status = 'approved'
);

-- Professionals can view their own pending/rejected/approved row.
drop policy if exists "Professionals can view own professional profile" on public.professionals;

create policy "Professionals can view own professional profile"
on public.professionals
for select
to authenticated
using (auth.uid() = id);

-- Professionals can update their own public onboarding data, but not approval/admin fields.
drop policy if exists "Professionals can update own onboarding profile" on public.professionals;

create policy "Professionals can update own onboarding profile"
on public.professionals
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
);

-- Admin policies already exist from previous admin migration.

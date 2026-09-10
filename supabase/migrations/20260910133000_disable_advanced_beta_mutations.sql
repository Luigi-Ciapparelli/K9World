-- Advanced commercial/marketing features are disabled during beta.
-- Keep existing data and SELECT access governed by RLS,
-- but prevent direct client-side mutations.

revoke insert, update, delete
on public.membership_tiers
from authenticated;

revoke insert, update, delete
on public.client_memberships
from authenticated;

revoke insert, update, delete
on public.passes
from authenticated;

revoke insert, update, delete
on public.client_passes
from authenticated;

revoke insert, update, delete
on public.subscription_plans
from authenticated;

revoke insert, update, delete
on public.client_subscriptions
from authenticated;

revoke insert, update, delete
on public.email_campaigns
from authenticated;

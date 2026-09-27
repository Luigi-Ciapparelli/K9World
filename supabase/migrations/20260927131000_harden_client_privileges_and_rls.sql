-- Reviewed against the owner's database catalog export, 27 September 2026.
-- Public projections and authorized RPCs are intentionally preserved.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';
SET LOCAL search_path = public, pg_catalog;

-- Stop on schema drift before changing anything. This is not a blanket rewrite
-- of policies: only the 85 uncorrelated auth.uid() expressions in the audit.
DO $policies$
DECLARE
  item jsonb;
  actual record;
  clause text;
BEGIN
  FOR item IN SELECT value FROM jsonb_array_elements($manifest$[
  {
    "schema": "public",
    "table": "profiles",
    "policy": "Users view own profile",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy": "Users insert own profile",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy": "Users update own profile",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "professionals",
    "policy": "Pro insert own",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "professionals",
    "policy": "Pro update own",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "dogs",
    "policy": "Owners view dogs",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = owner_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "dogs",
    "policy": "Owners insert dogs",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = owner_id)"
  },
  {
    "schema": "public",
    "table": "dogs",
    "policy": "Owners update dogs",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = owner_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = owner_id)"
  },
  {
    "schema": "public",
    "table": "dogs",
    "policy": "Owners delete dogs",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = owner_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "services",
    "policy": "Pro insert services",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "services",
    "policy": "Pro update services",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "services",
    "policy": "Pro delete services",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "availability",
    "policy": "Pro insert availability",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "availability",
    "policy": "Pro update availability",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "availability",
    "policy": "Pro delete availability",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "resources",
    "policy": "Pro view resources",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "resources",
    "policy": "Pro insert resources",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "resources",
    "policy": "Pro update resources",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "resources",
    "policy": "Pro delete resources",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "bookings",
    "policy": "Owner view bookings",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = owner_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "bookings",
    "policy": "Pro view bookings",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "bookings",
    "policy": "Owner update own bookings",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = owner_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = owner_id)"
  },
  {
    "schema": "public",
    "table": "bookings",
    "policy": "Pro update own bookings",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "booking_dogs",
    "policy": "View booking_dogs",
    "roles": [
      "authenticated"
    ],
    "using": "(EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.id = booking_dogs.booking_id) AND ((b.owner_id = auth.uid()) OR (b.professional_id = auth.uid())))))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "booking_dogs",
    "policy": "Owner delete booking_dogs",
    "roles": [
      "authenticated"
    ],
    "using": "(EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.id = booking_dogs.booking_id) AND (b.owner_id = auth.uid()))))",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_groups",
    "policy": "Pro view groups",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_groups",
    "policy": "Pro insert groups",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "client_groups",
    "policy": "Pro update groups",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "client_groups",
    "policy": "Pro delete groups",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "membership_tiers",
    "policy": "Pro insert tiers",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "membership_tiers",
    "policy": "Pro update tiers",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "membership_tiers",
    "policy": "Pro delete tiers",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_memberships",
    "policy": "Client view memberships",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = client_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_memberships",
    "policy": "Pro view memberships",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_memberships",
    "policy": "Client insert membership",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = client_id)"
  },
  {
    "schema": "public",
    "table": "client_memberships",
    "policy": "Pro update memberships",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "passes",
    "policy": "Pro insert passes",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "passes",
    "policy": "Pro update passes",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "passes",
    "policy": "Pro delete passes",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_passes",
    "policy": "Client view passes",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = client_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_passes",
    "policy": "Pro view client passes",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_passes",
    "policy": "Client insert pass",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = client_id)"
  },
  {
    "schema": "public",
    "table": "client_passes",
    "policy": "Pro update client passes",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "subscription_plans",
    "policy": "Pro insert plans",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "subscription_plans",
    "policy": "Pro update plans",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "subscription_plans",
    "policy": "Pro delete plans",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_subscriptions",
    "policy": "Client view subs",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = client_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_subscriptions",
    "policy": "Pro view subs",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_subscriptions",
    "policy": "Client insert sub",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = client_id)"
  },
  {
    "schema": "public",
    "table": "client_subscriptions",
    "policy": "Client update own sub",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = client_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = client_id)"
  },
  {
    "schema": "public",
    "table": "client_subscriptions",
    "policy": "Pro update subs",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "email_campaigns",
    "policy": "Pro view campaigns",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "email_campaigns",
    "policy": "Pro insert campaigns",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "email_campaigns",
    "policy": "Pro update campaigns",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "email_campaigns",
    "policy": "Pro delete campaigns",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "booking_rules",
    "policy": "Pro insert rules",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "booking_rules",
    "policy": "Pro update rules",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = professional_id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = professional_id)"
  },
  {
    "schema": "public",
    "table": "chat_logs",
    "policy": "Users view chat",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = user_id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "chat_logs",
    "policy": "Users insert chat",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schema": "public",
    "table": "chat_logs",
    "policy": "Users delete chat",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = user_id)",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "services",
    "policy": "Public view active services",
    "roles": [
      "anon",
      "authenticated"
    ],
    "using": "(((active = true) AND (EXISTS ( SELECT 1\n   FROM professionals p\n  WHERE ((p.id = services.professional_id) AND (p.approved = true))))) OR (auth.uid() = professional_id))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy": "Users can create own profile",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy": "Users can view own profile",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "profiles",
    "policy": "Users can update own profile",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "professionals",
    "policy": "Professionals can view own professional profile",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "professionals",
    "policy": "Professionals can update own onboarding profile",
    "roles": [
      "authenticated"
    ],
    "using": "(auth.uid() = id)",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schema": "public",
    "table": "bookings",
    "policy": "Owner create bookings",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "((auth.uid() = owner_id) AND (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.email_verified = true)))))"
  },
  {
    "schema": "public",
    "table": "professionals",
    "policy": "Professionals can create own onboarding profile",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "((auth.uid() = id) AND (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['professional'::text, 'admin'::text]))))))"
  },
  {
    "schema": "public",
    "table": "booking_dogs",
    "policy": "Owner insert booking_dogs",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "(EXISTS ( SELECT 1\n   FROM (bookings b\n     JOIN dogs d ON ((d.id = booking_dogs.dog_id)))\n  WHERE ((b.id = booking_dogs.booking_id) AND (b.owner_id = auth.uid()) AND (d.owner_id = auth.uid()))))"
  },
  {
    "schema": "public",
    "table": "dogs",
    "policy": "Pro view booked dogs",
    "roles": [
      "authenticated"
    ],
    "using": "(EXISTS ( SELECT 1\n   FROM (booking_dogs bd\n     JOIN bookings b ON ((b.id = bd.booking_id)))\n  WHERE ((bd.dog_id = dogs.id) AND (b.professional_id = auth.uid()) AND (b.status = ANY (ARRAY['pending'::text, 'accepted'::text, 'completed'::text])))))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_notes",
    "policy": "Pro view related client notes",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_notes.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_notes",
    "policy": "Pro insert related client notes",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_notes.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))"
  },
  {
    "schema": "public",
    "table": "client_notes",
    "policy": "Pro update related client notes",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_notes.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_notes.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))"
  },
  {
    "schema": "public",
    "table": "client_notes",
    "policy": "Pro delete related client notes",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_notes.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_tags",
    "policy": "Pro view related client tags",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_tags.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "client_tags",
    "policy": "Pro insert related client tags",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_tags.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))"
  },
  {
    "schema": "public",
    "table": "client_tags",
    "policy": "Pro delete related client tags",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM bookings b\n  WHERE ((b.professional_id = auth.uid()) AND (b.owner_id = client_tags.client_id) AND (b.status = ANY (ARRAY['accepted'::text, 'completed'::text]))))))",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "professional_credentials",
    "policy": "Professional selects own credentials",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "professional_credentials",
    "policy": "Professional inserts own credentials",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'professional'::text)))))"
  },
  {
    "schema": "public",
    "table": "professional_credentials",
    "policy": "Professional updates own credentials",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))"
  },
  {
    "schema": "public",
    "table": "professional_credentials",
    "policy": "Professional deletes own credentials",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "professional_external_identities",
    "policy": "Professional selects own external identities",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))",
    "command": "SELECT",
    "permissive": "PERMISSIVE",
    "with_check": null
  },
  {
    "schema": "public",
    "table": "professional_external_identities",
    "policy": "Professional inserts own external identities",
    "roles": [
      "authenticated"
    ],
    "using": null,
    "command": "INSERT",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'professional'::text)))))"
  },
  {
    "schema": "public",
    "table": "professional_external_identities",
    "policy": "Professional updates own external identities",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))",
    "command": "UPDATE",
    "permissive": "PERMISSIVE",
    "with_check": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))"
  },
  {
    "schema": "public",
    "table": "professional_external_identities",
    "policy": "Professional deletes own external identities",
    "roles": [
      "authenticated"
    ],
    "using": "((professional_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::text)))))",
    "command": "DELETE",
    "permissive": "PERMISSIVE",
    "with_check": null
  }
]$manifest$::jsonb)
  LOOP
    SELECT * INTO actual FROM pg_catalog.pg_policies
      WHERE schemaname=item->>'schema' AND tablename=item->>'table'
        AND policyname=item->>'policy';
    IF NOT FOUND OR actual.qual IS DISTINCT FROM item->>'using'
      OR actual.with_check IS DISTINCT FROM item->>'with_check'
      OR actual.cmd IS DISTINCT FROM item->>'command'
      OR actual.permissive IS DISTINCT FROM item->>'permissive'
      OR to_jsonb(actual.roles) IS DISTINCT FROM item->'roles' THEN
      RAISE EXCEPTION 'Policy changed since audit: %.% / %. No changes applied.',
        item->>'schema', item->>'table', item->>'policy';
    END IF;
    clause := '';
    IF actual.qual IS NOT NULL THEN
      clause := clause || ' USING (' || replace(actual.qual, 'auth.uid()', '(SELECT auth.uid())') || ')';
    END IF;
    IF actual.with_check IS NOT NULL THEN
      clause := clause || ' WITH CHECK (' || replace(actual.with_check, 'auth.uid()', '(SELECT auth.uid())') || ')';
    END IF;
    EXECUTE format('ALTER POLICY %I ON %I.%I%s', actual.policyname, actual.schemaname, actual.tablename, clause);
  END LOOP;
END
$policies$;

-- This legacy policy is already absent from the online audit, but still exists
-- when replaying Git from zero. It exposes entire professional profile rows,
-- including private fields. Public consumers use the explicit projection.
DO $legacy_policy$
DECLARE p record;
BEGIN
  SELECT * INTO p FROM pg_catalog.pg_policies WHERE schemaname='public'
    AND tablename='profiles' AND policyname='View professional profiles';
  IF FOUND THEN
    IF p.cmd<>'SELECT' OR p.roles<>ARRAY['authenticated']::name[]
      OR p.qual IS DISTINCT FROM '(role = ''professional''::text)' THEN
      RAISE EXCEPTION 'Legacy profile policy changed; review required';
    END IF;
    DROP POLICY "View professional profiles" ON public.profiles;
  END IF;
END
$legacy_policy$;

-- Remove only proven duplicates. The remaining own-user/admin policies express
-- different authorizations and must not be removed to silence the linter.
DO $duplicates$
DECLARE pair record; old_policy record; keep_policy record;
BEGIN
  FOR pair IN SELECT * FROM (VALUES
    ('profiles', 'Users view own profile', 'Users can view own profile'),
    ('profiles', 'Users update own profile', 'Users can update own profile'),
    ('profiles', 'Users insert own profile', 'Users can create own profile'),
    ('professionals', 'Pro update own', 'Professionals can update own onboarding profile')
  ) AS pairs(table_name, remove_name, keep_name)
  LOOP
    SELECT * INTO STRICT old_policy FROM pg_catalog.pg_policy
      WHERE polrelid=format('public.%I',pair.table_name)::regclass AND polname=pair.remove_name;
    SELECT * INTO STRICT keep_policy FROM pg_catalog.pg_policy
      WHERE polrelid=old_policy.polrelid AND polname=pair.keep_name;
    IF old_policy.polcmd IS DISTINCT FROM keep_policy.polcmd
      OR old_policy.polpermissive IS DISTINCT FROM keep_policy.polpermissive
      OR old_policy.polroles IS DISTINCT FROM keep_policy.polroles
      -- Compare canonical SQL, not pg_node_tree's serialized representation:
      -- node metadata can differ across versions and parsing contexts.
      OR pg_catalog.pg_get_expr(old_policy.polqual,old_policy.polrelid,false)
           IS DISTINCT FROM pg_catalog.pg_get_expr(keep_policy.polqual,keep_policy.polrelid,false)
      OR pg_catalog.pg_get_expr(old_policy.polwithcheck,old_policy.polrelid,false)
           IS DISTINCT FROM pg_catalog.pg_get_expr(keep_policy.polwithcheck,keep_policy.polrelid,false) THEN
      RAISE EXCEPTION 'Policies no longer equivalent: % / %', pair.remove_name, pair.keep_name;
    END IF;
    EXECUTE format('DROP POLICY %I ON public.%I', pair.remove_name, pair.table_name);
  END LOOP;
END
$duplicates$;

-- Authenticated administrators retain their internal role check. Anonymous
-- requests no longer reach admin-only helpers through PUBLIC's EXECUTE grant.
REVOKE EXECUTE ON FUNCTION public.admin_set_professional_approval(uuid,text,text,text),
  public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_professional_approval(uuid,text,text,text),
  public.is_admin() TO authenticated, service_role;

-- Trigger execution is internal; client EXECUTE grants are unnecessary.
REVOKE EXECUTE ON FUNCTION public.handle_pawconnect_new_user(),
  public.set_pawconnect_signup_dog_birth_date(), public.sync_auth_email_verification()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_pawconnect_new_user(),
  public.set_pawconnect_signup_dog_birth_date(), public.sync_auth_email_verification()
  TO service_role;
DO $trigger_grants$
BEGIN
  -- Dashboard-managed event trigger: absent in the migration-only local schema.
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_proc
      WHERE oid=to_regprocedure('public.rls_auto_enable()') AND prorettype='event_trigger'::regtype) THEN
      RAISE EXCEPTION 'Unexpected signature for rls_auto_enable';
    END IF;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
  END IF;
END
$trigger_grants$;

-- Row-level security does not govern TRUNCATE. Client roles must not have
-- maintenance/DDL privileges, even where SELECT or limited DML are intentional.
-- Ordinary SELECT/INSERT/UPDATE/DELETE and column grants are not altered.
DO $table_grants$
DECLARE t record; privileges text;
BEGIN
  privileges := 'TRUNCATE, REFERENCES, TRIGGER';
  IF current_setting('server_version_num')::integer >= 170000 THEN
    privileges := privileges || ', MAINTAIN';
  END IF;
  FOR t IN SELECT c.relname FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('REVOKE %s ON TABLE public.%I FROM PUBLIC, anon, authenticated', privileges, t.relname);
  END LOOP;
END
$table_grants$;

-- Harden defaults for the migration owner and postgres (when applicable).
-- Managed supabase_admin defaults and service_role permissions are preserved.
-- The global PUBLIC function default must be revoked globally: a schema-local
-- REVOKE cannot cancel PostgreSQL's global default EXECUTE for PUBLIC.
DO $defaults$
DECLARE creator name;
BEGIN
  FOR creator IN SELECT rolname FROM pg_catalog.pg_roles
    WHERE rolname=current_user OR (rolname='postgres' AND pg_has_role(current_user,oid,'MEMBER'))
  LOOP
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated',creator);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated',creator);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated',creator);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated',creator);
  END LOOP;
END
$defaults$;

NOTIFY pgrst, 'reload schema';
COMMIT;

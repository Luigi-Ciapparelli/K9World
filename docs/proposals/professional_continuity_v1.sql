-- DRAFT / NOT A MIGRATION / DO NOT APPLY TO PRODUCTION.
-- Baseline: signup-dog-profile 5ef4903; remote migration history through
-- 20260912223818 verified by the user. Schema proposal only.
-- No grants or RPCs for application users: this does not enable a feature.
-- Execute only in a disposable test database after design review.
BEGIN;

-- Persistent historical identities. No independent public/person/dog profile.
-- Snapshot values must eventually be captured server-side from existing rows;
-- they must not be accepted as authoritative values supplied by a client.
CREATE TABLE public.professional_archive_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id uuid NOT NULL UNIQUE,
  live_profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name_at_capture text NOT NULL CHECK (char_length(display_name_at_capture) BETWEEN 1 AND 200),
  captured_at timestamptz NOT NULL DEFAULT now(),
  CHECK (live_profile_id IS NULL OR live_profile_id = source_profile_id)
);

CREATE TABLE public.professional_archive_dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dog_id uuid NOT NULL UNIQUE,
  live_dog_id uuid UNIQUE REFERENCES public.dogs(id) ON DELETE SET NULL,
  name_at_capture text NOT NULL CHECK (char_length(name_at_capture) BETWEEN 1 AND 200),
  captured_at timestamptz NOT NULL DEFAULT now(),
  CHECK (live_dog_id IS NULL OR live_dog_id = source_dog_id)
);

-- Initial use case is trainer only. This is not a backfill/replacement of
-- dogs.owner_id. Future handler/co-owner roles need their own reviewed rules.
-- Two-sided activation: owner authorization + professional acceptance.
CREATE TABLE public.person_dog_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_archive_id uuid NOT NULL REFERENCES public.professional_archive_dogs(id) ON DELETE RESTRICT,
  professional_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
  authorizing_owner_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
  relationship_type text NOT NULL DEFAULT 'trainer' CHECK (relationship_type = 'trainer'),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'ended', 'revoked', 'declined')),
  authorized_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  revoked_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (professional_actor_id <> authorizing_owner_actor_id),
  CHECK (accepted_at IS NULL OR accepted_at >= authorized_at),
  CHECK (started_at IS NULL OR (accepted_at IS NOT NULL AND started_at >= accepted_at)),
  CHECK (ended_at IS NULL OR (started_at IS NOT NULL AND ended_at >= started_at)),
  CHECK (revoked_at IS NULL OR revoked_at >= authorized_at),
  CHECK (declined_at IS NULL OR declined_at >= authorized_at),
  CHECK (
    (status = 'invited' AND accepted_at IS NULL AND started_at IS NULL AND ended_at IS NULL AND revoked_at IS NULL AND declined_at IS NULL)
    OR (status = 'active' AND accepted_at IS NOT NULL AND started_at IS NOT NULL AND ended_at IS NULL AND revoked_at IS NULL AND declined_at IS NULL)
    OR (status = 'ended' AND accepted_at IS NOT NULL AND started_at IS NOT NULL AND ended_at IS NOT NULL AND revoked_at IS NULL AND declined_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL AND declined_at IS NULL AND (started_at IS NULL OR ended_at IS NOT NULL))
    OR (status = 'declined' AND declined_at IS NOT NULL AND accepted_at IS NULL AND started_at IS NULL AND ended_at IS NULL AND revoked_at IS NULL)
  )
);
CREATE UNIQUE INDEX person_dog_relationships_one_open_trainer
ON public.person_dog_relationships(dog_archive_id, professional_actor_id)
WHERE status IN ('invited', 'active');
CREATE INDEX person_dog_relationships_author ON public.person_dog_relationships(professional_actor_id, created_at DESC);
CREATE INDEX person_dog_relationships_owner ON public.person_dog_relationships(authorizing_owner_actor_id, created_at DESC);

-- Session references relationship to derive the historical dog and author.
-- Removing a booking only clears an optional operational link.
CREATE TABLE public.professional_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.person_dog_relationships(id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  source_booking_id uuid,
  occurred_at timestamptz NOT NULL,
  activity text NOT NULL CHECK (char_length(btrim(activity)) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz,
  CHECK (booking_id IS NULL OR (source_booking_id IS NOT NULL AND booking_id = source_booking_id)),
  CHECK ((status = 'draft' AND finalized_at IS NULL) OR (status = 'finalized' AND finalized_at IS NOT NULL AND finalized_at >= created_at))
);
CREATE INDEX professional_sessions_relationship ON public.professional_sessions(relationship_id, occurred_at DESC);
CREATE INDEX professional_sessions_booking ON public.professional_sessions(booking_id) WHERE booking_id IS NOT NULL;

-- Phase one is PRIVATE ONLY. Sharing is deliberately not represented as a
-- boolean flag that might accidentally bypass the future grant model.
CREATE TABLE public.dog_professional_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.professional_sessions(id) ON DELETE RESTRICT,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz,
  CHECK ((status = 'draft' AND finalized_at IS NULL) OR (status = 'finalized' AND finalized_at IS NOT NULL AND finalized_at >= created_at))
);
CREATE INDEX dog_professional_notes_session ON public.dog_professional_notes(session_id, created_at);

CREATE TABLE public.professional_note_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.dog_professional_notes(id) ON DELETE RESTRICT,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  editor_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 20000),
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, revision_number),
  CHECK (revision_number = 1 OR (change_reason IS NOT NULL AND char_length(btrim(change_reason)) BETWEEN 1 AND 1000))
);
CREATE INDEX professional_note_revisions_editor ON public.professional_note_revisions(editor_actor_id);

-- Fail closed explicitly, independently of default privileges.
ALTER TABLE public.professional_archive_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_archive_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_dog_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_professional_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_note_revisions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.professional_archive_actors,
  public.professional_archive_dogs,
  public.person_dog_relationships,
  public.professional_sessions,
  public.dog_professional_notes,
  public.professional_note_revisions
FROM PUBLIC, anon, authenticated;

-- No policies, application RPCs, buckets, grants, backfills, jobs or changes
-- to current profiles/dogs/bookings/storage. PostgreSQL owners and privileged
-- server roles are NOT constrained by this application-level denial.
COMMIT;

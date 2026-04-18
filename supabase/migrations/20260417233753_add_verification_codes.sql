/*
  # Add verification codes table

  1. New Tables
    - `verification_codes`
      - `id` (uuid primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, 'email' or 'phone')
      - `target` (text, the email/phone being verified)
      - `code_hash` (text, SHA-256 of the 6-digit code)
      - `expires_at` (timestamptz, 10-minute expiry)
      - `consumed_at` (timestamptz, null until used)
      - `attempt_count` (integer, capped at 5)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Users can only view/insert their own codes
    - Edge functions (service role) handle verification logic
*/

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'email',
  target text NOT NULL DEFAULT '',
  code_hash text NOT NULL DEFAULT '',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed_at timestamptz,
  attempt_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own codes"
  ON verification_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own codes"
  ON verification_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own codes"
  ON verification_codes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_verification_user_type ON verification_codes(user_id, type, consumed_at);

DO $$
BEGIN
  UPDATE profiles SET email_verified = false WHERE email_verified = true;
  UPDATE profiles SET phone_verified = false WHERE phone_verified = true;
END $$;

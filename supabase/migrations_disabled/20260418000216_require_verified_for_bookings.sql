/*
  # Require verified email and phone for booking creation

  1. Security
    - Drops the existing permissive "Owner create bookings" INSERT policy on `bookings`
    - Replaces it with a stricter policy that requires the authenticated owner's profile
      to have both `email_verified = true` and `phone_verified = true`
    - This enforces verification at the database layer so the rule cannot be bypassed
      by calling the Supabase API directly even if the UI is circumvented

  2. Notes
    - Existing SELECT, UPDATE, and DELETE policies on `bookings` remain untouched
    - Already-created bookings are unaffected; this only governs INSERTs
*/

DROP POLICY IF EXISTS "Owner create bookings" ON bookings;

CREATE POLICY "Owner create bookings when verified"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.email_verified = true
        AND p.phone_verified = true
    )
  );

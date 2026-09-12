# Professional booking read API

Implemented by the new secure_professional_booking_read migration and the professional dashboard/bookings pages.

- get_professional_bookings() requires auth.uid() and a matching professionals row.
- Returns only bookings whose professional_id equals the authenticated account, including pending requests.
- Projection: booking ID, start, status, price, booking notes, requester name and ordering priority. No email, phone, unrelated dog data or general profile access.
- CRM remains restricted to accepted/completed relationships through get_professional_clients().
- Pending requests precede accepted bookings and history; booking dates are ascending within each group.
- Filters use the same Italian labels as StatusBadge; database status values do not change.
- Dashboard requests appear before navigation cards; notes preserve line breaks.
- Bookings page loads 20 rows at a time with a server-side count, status filter and name search.
- Mutations still use change_booking_status(); no new direct writes.

Deployment order: apply only the reviewed additive RPC migration, verify authenticated isolation, typecheck/build, test the professional UI, then deploy the frontend. Existing frontend code remains compatible with the additive migration.

Validation and release status: pending in the target environment when this document was generated. Record actual checks before release and regenerate CURRENT_STATE.md using the continuity protocol.

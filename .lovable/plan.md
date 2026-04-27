# Add sitter accounts (without disrupting current mock data)

The existing `sitters` rows stay exactly as they are — they remain the source of truth for the public catalog and admin tools. We only **add** the ability for a real person to claim/own a row by signing up with a sitter role.

## What changes

### 1. Database

- Add `'sitter'` to the `app_role` enum.
- Add a nullable `user_id uuid` column on `public.sitters`. Existing rows keep `user_id = NULL` (these are the unclaimed mock catalog entries). When a real sitter signs up, a row is either created or linked here.
- Add a unique constraint so one auth user can own at most one sitter row.
- Update `sitters` RLS:
  - Public can still read all rows (unchanged).
  - Admins can still do everything (unchanged).
  - **New:** a sitter can `UPDATE` only the row where `sitters.user_id = auth.uid()`.
  - **New:** a sitter can `INSERT` a row only with `user_id = auth.uid()` (used during signup if they don't claim an existing row).
- Update `scheduled_calls` RLS so sitters can `SELECT` calls where `sitter_id` belongs to them (read-only access to their incoming requests).

### 2. Sign-up flow

On `/auth`, the signup form gets a small role toggle: **"I'm a parent"** (default) / **"I'm a sitter"**. The choice is passed via `options.data.role` on `supabase.auth.signUp`.

The existing `handle_new_user` trigger is extended to:
- Always create the `profiles` row (unchanged).
- Insert into `user_roles` with the chosen role (`'parent'` or `'sitter'`). Defaults to `'parent'` if missing.
- If `role = 'sitter'`, also create a minimal `sitters` row owned by that user (name = display name, empty bio, defaults for the rest) so they have something to edit.

### 3. Sitter dashboard — new route `/sitter`

Mirrors the `/admin` pattern: a layout that checks the user has the `sitter` role, with two tabs:

- **`/sitter`** — Edit my profile. Pre-filled from their `sitters` row. They can edit bio, photo URL, hourly rate, postal code, availability, experience tags, and certifications. Verified status and admin-only fields stay read-only (only admins can flip `is_verified`).
- **`/sitter/requests`** — Read-only list of `scheduled_calls` where `sitter_id = my sitter row id`. Shows date, status, parent display name, meet link.

### 4. Navbar

The existing `useIsAdmin` hook gets a sibling `useIsSitter`. Navbar shows:
- "Admin" link if admin (existing).
- "My Sitter Profile" link if sitter.
- "My Bookings" stays for everyone (parents use it; sitters/admins just won't have bookings).

### 5. Mock data preservation

- No existing `sitters` rows are touched — they keep `user_id = NULL` and remain visible in the public catalog and the admin tool exactly as today.
- The home page filter, sitter detail page, and `ScheduleCallSheet` keep working unchanged.
- Admins can optionally link a mock sitter to a real account later by setting `sitters.user_id` from the admin sitter editor (small additional input field on each row).

## Out of scope for this step

- Sitters approving/declining call requests (currently parents schedule and the call is auto-confirmed). We can add accept/decline as a follow-up.
- Sitter-uploaded photos (we keep `photo_url` as a text URL field for now; storage bucket is a separate task).
- Email notifications when a sitter receives a request.

## Files touched

**New:**
- `supabase/migrations/<timestamp>_add_sitter_role.sql` — enum value, column, RLS, trigger update.
- `src/hooks/use-is-sitter.tsx`
- `src/routes/sitter.tsx` — layout + role guard.
- `src/routes/sitter.index.tsx` — profile editor.
- `src/routes/sitter.requests.tsx` — incoming call requests.

**Edited:**
- `src/routes/auth.tsx` — add role toggle on signup.
- `src/components/Navbar.tsx` — sitter link.
- `src/routes/admin.index.tsx` — small "linked user_id" field on each row.
- `src/lib/sitters.ts` — add `user_id` to `SitterRow` type and a `fetchMySitter()` helper.

## Risks / things to verify after migration

- The Supabase types regenerate so `SitterRow.user_id` is recognized.
- The updated `handle_new_user` trigger must remain `SECURITY DEFINER` and not break existing parent signups.
- Confirm no existing UI does `sitters.insert` from a non-admin context that would now be blocked by the tightened insert policy.

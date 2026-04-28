# Fix: sitter role not assigned on Google sign-up

## What's actually wrong

`breeandadrian@gmail.com` exists in the database with `role = 'parent'` and no `sitters` row. The sitter dashboard code is working correctly — it's hiding because this user genuinely isn't a sitter according to the database.

The root cause: **Google OAuth doesn't carry the Parent/Babysitter toggle** from the `/auth` page. Only the email/password signup path passes `role` into `raw_user_meta_data`, which the `handle_new_user` trigger reads. Google sign-ins always fall through to the default `'parent'`.

## Fix in two parts

### 1. Repair the existing account (one-time data fix)

Run a migration that:
- Inserts `('11e543bb-…', 'sitter')` into `user_roles` (keeps the existing 'parent' row or replaces it — recommend replacing so they're not both)
- Inserts a starter `sitters` row linked to that `user_id`, mirroring what `handle_new_user` would have created

### 2. Fix the OAuth signup flow so this stops happening

Two changes:

**a. Persist the chosen role before redirecting to Google.** On the `/auth` page, when the user clicks "Continue with Google", store the selected role (`parent` | `sitter`) in `localStorage` *before* calling `supabase.auth.signInWithOAuth`. Google OAuth strips custom `data` from the request, so we can't pass it through the OAuth call directly.

**b. Apply the chosen role after the OAuth callback completes.** In the auth callback handler (or a small effect on `/auth` / root that runs once a session appears), if `localStorage.pendingRole === 'sitter'` and the user currently has only the default `parent` role:
- Call a new edge function `claim-sitter-role` (security-definer, validates `auth.uid()`) that:
  - Deletes the `parent` row from `user_roles` for this user
  - Inserts a `sitter` row
  - Inserts a starter `sitters` row if none exists for this `user_id`
- Clear `localStorage.pendingRole`
- Invalidate the `is-sitter` and `my-sitter` queries so the navbar/dashboard update immediately

We use an edge function because RLS on `user_roles` only lets admins insert/delete roles — a regular user can't promote themselves from the client. The edge function uses the service role key but verifies the caller's JWT and only ever touches *their own* `user_id`.

### 3. Minor UX polish

- On the `/auth` page, show the role toggle above *both* the email form and the Google button (currently it visually reads as belonging only to the email form).
- After Google sign-in completes as a sitter, redirect to `/sitter` instead of `/`.

## Technical details

**Files to create**
- `supabase/migrations/<ts>_fix_breeandadrian_sitter.sql` — one-time data repair
- `supabase/functions/claim-sitter-role/index.ts` — verifies JWT, swaps role, ensures sitters row
- (optional) `src/lib/pending-role.ts` — tiny helper for the localStorage key

**Files to edit**
- `src/routes/auth.tsx` — write `localStorage.pendingRole` before `signInWithOAuth`; ensure the role toggle clearly applies to both signup paths
- `src/routes/__root.tsx` (or wherever the auth state listener lives) — on `SIGNED_IN` event, if `pendingRole === 'sitter'`, invoke `claim-sitter-role`, then `queryClient.invalidateQueries(['is-sitter'])` and `['my-sitter']`
- `supabase/config.toml` — register the new edge function (verify_jwt stays at default `true` so the function receives the caller's identity)

**Edge function logic (sketch)**
```ts
// Reads JWT → user.id
// If pendingRole !== 'sitter' → 400
// DELETE FROM user_roles WHERE user_id = $uid AND role = 'parent'
// INSERT INTO user_roles (user_id, role) VALUES ($uid, 'sitter') ON CONFLICT DO NOTHING
// INSERT INTO sitters (user_id, name, slug, …defaults…) 
//   SELECT $uid, $display_name, $slug, … 
//   WHERE NOT EXISTS (SELECT 1 FROM sitters WHERE user_id = $uid)
```

**Why not just update `handle_new_user` to read role from OAuth?**
Google's OAuth response doesn't include our app's custom field. The trigger fires before the client knows the user is back. The `localStorage` + post-callback claim pattern is the standard workaround.

## Outcome

- `breeandadrian@gmail.com` will immediately have the sitter role + a sitters row → dashboard appears.
- Future Google sign-ups that select "Babysitter" will land on `/sitter` with the correct role assigned.
- Email/password sitter signups continue working as they do today.

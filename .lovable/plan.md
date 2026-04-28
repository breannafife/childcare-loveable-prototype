I found that `breeandadrian@gmail.com` is correctly marked as a sitter in the backend and has a linked sitter profile. The issue appears to be the UI role check: when the backend was briefly recovering, the role request returned 503/400 errors, and the app treated that as “not a sitter,” so the sitter navigation/dashboard did not appear reliably.

Plan to fix:

1. Make role loading resilient
   - Update the sitter/admin role hooks so backend role-check errors do not silently become `false`.
   - Add retry behavior for transient backend errors.
   - Return an explicit `error` state so the UI can show “checking your role” or “couldn’t verify role” instead of hiding sitter UI.

2. Make `/sitter` access less fragile
   - On the sitter dashboard route, if the `user_roles` check fails temporarily, fall back to checking whether the signed-in user has a linked row in the `sitters` table.
   - Since this account already has a linked sitter profile, this should allow the dashboard to show even if the role table query has a temporary issue.
   - Keep backend row-level security as the real protection boundary.

3. Improve navigation visibility
   - Update `Navbar` to account for role/profile loading states.
   - Ensure the sitter link appears for users with either the `sitter` role or a linked sitter profile.
   - Add the sitter dashboard link to the mobile menu too, since it is currently only present in the desktop nav.

4. Fix sign-in redirect behavior for sitters
   - After sign-in, if the user is a sitter, route them to `/sitter` when appropriate instead of leaving them on parent-oriented pages like `/bookings`.
   - Keep explicit redirects working when they are already targeting `/sitter`.

Technical details:
- Files to update: `src/hooks/use-is-sitter.tsx`, `src/hooks/use-is-admin.tsx`, `src/components/Navbar.tsx`, `src/routes/sitter.tsx`, and likely `src/routes/auth.tsx`.
- No database change is needed for `breeandadrian@gmail.com`; I verified there is already a `sitter` role and linked sitter profile.
- I will not edit the generated backend client/type files or generated route tree manually.
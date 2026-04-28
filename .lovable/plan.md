## Goal
Mock all sitters as verified by default and remove the admin verification toggle.

## Changes

### Database (migration)
- Change `sitters.is_verified` default to `true`.
- Update existing rows: `UPDATE public.sitters SET is_verified = true WHERE is_verified = false;`
- Update `handle_new_user()` so newly created sitter rows insert `is_verified = true`.

### Admin UI (`src/routes/admin.index.tsx`)
- Remove the "Verified" checkbox from the editor.
- Remove `is_verified` from the draft state, dirty check, and update payload.

### Sitter dashboard (`src/routes/sitter.index.tsx`)
- Remove the "Awaiting verification" branch — always show the Verified badge (the data will back this up).

### Filters (`src/components/FilterBar.tsx` + `src/routes/index.tsx`)
- Keep the filter logic intact (everyone is verified, so it's a no-op), but since "Verified Only" is now meaningless, remove the toggle button from FilterBar and drop `verifiedOnly` from the index filter state and reset.

## Files edited
- `supabase/migrations/<new>.sql` (new)
- `src/routes/admin.index.tsx`
- `src/routes/sitter.index.tsx`
- `src/components/FilterBar.tsx`
- `src/routes/index.tsx`

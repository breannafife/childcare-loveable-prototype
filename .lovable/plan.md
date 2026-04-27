## Plan

Two changes: (1) make the hero "zip code" input a real postal-code filter wired to the sitter list, (2) move the hardcoded certifications list out of `FilterBar.tsx` into Supabase.

### 1. Hero postal-code search → filters sitters

Today the hero `<input>` in `HeroSection.tsx` is decorative — it doesn't update any state. Filtering already exists on `/` via `FilterBar` using `postalCode` and the first 3 chars of the sitter's `postal_code` (FSA prefix). We'll wire the hero to that same state.

- Rename label/placeholder from "zip code" → "postal code" (e.g., "Enter your postal code", e.g. `M5V`).
- Lift filter state: `HeroSection` becomes a controlled component receiving `postalCode` + `onPostalCodeChange` from `src/routes/index.tsx`.
- Sanitize input: uppercase, strip non-alphanumeric, cap length (same logic as `FilterBar`).
- Submitting the search (Enter or "Search" button) scrolls to the sitters section; typing already filters live (existing logic in `index.tsx` matches first 3 chars).
- The `FilterBar` postal input continues to work — both bind to the same `filters.postalCode`.
- Add a small "Showing sitters in {FSA}" hint above the grid when 3+ chars are typed.

No backend changes for this part — `sitters.postal_code` already exists and the prefix match is already implemented.

### 2. Certifications list from Supabase

Today `allCertifications` is a hardcoded array in `FilterBar.tsx`. We'll derive it from the database so adding a new certification on a sitter automatically shows up in the filter.

Two options — recommended: **derive from existing data** (no schema change, simplest, accurate by definition).

- In `src/lib/sitters.ts`, add `fetchCertifications()` that selects `certifications` from the `sitters` table, flattens, dedupes, and sorts.
- In `src/routes/index.tsx`, add a second `useQuery({ queryKey: ["certifications"], queryFn: fetchCertifications })`.
- Pass the list down to `FilterBar` as a `certifications` prop; remove the hardcoded `allCertifications` const.
- Show a small skeleton/disabled state in the dropdown while loading.

(If the user later wants admin-managed canonical list, we can add a `certifications` table — not needed now.)

### 3. Docs

- `PRD.md`: update the search section to say "postal code (FSA prefix match)" and note certifications are sourced from sitter profiles.
- `HANDOFF.md`: note hero search is now functional and certifications list is dynamic; remove the "hardcoded filter options" caveat.

### Files touched

- `src/components/HeroSection.tsx` — controlled input, postal-code copy
- `src/routes/index.tsx` — lift state, pass to hero, fetch certifications, pass to FilterBar
- `src/components/FilterBar.tsx` — accept `certifications` prop, drop hardcoded array
- `src/lib/sitters.ts` — add `fetchCertifications()`
- `PRD.md`, `HANDOFF.md` — reflect changes

No DB migrations, no auth changes.

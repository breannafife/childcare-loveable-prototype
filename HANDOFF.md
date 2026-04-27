# Engineering Handoff — TinyWatch Prototype

**What this is:** a clickable interactive prototype of a peer-to-peer babysitter marketplace, built to test whether a "book a video intro call" affordance lifts browse-to-book conversion for sitters with little or no review history. See [`PRD.md`](./PRD.md) for product context and [`README.md`](./README.md) for the short version.

**What this is not:** production code. There is no payments integration, no real video, no provider-side workflow. Sitter, review, and booking data live in a real Postgres database (Lovable Cloud) with auth, but availability slots and the Meet link are still mocked.

---

## Start Here (5-minute orientation)

If you're new to the repo, read this section first. Then skim §3 (component map) and open `src/routes/index.tsx`.

### 1. Run it

```bash
bun install
bun dev
```

The dev server prints a localhost URL. Open it.

### 2. The mental model

Four routes, a handful of components, one Postgres database, one auth provider. TanStack Query handles caching of all DB reads.

```
URL                          File                                         What it does
─────────────────────────────────────────────────────────────────────────────────────────
/                            src/routes/index.tsx                         Browse + filter sitters (from DB)
/sitters/:sitterName         src/routes/sitters.$sitterName.tsx           Sitter profile + reviews (from DB)
/bookings                    src/routes/bookings.tsx                      My scheduled video calls (signed-in user only)
/auth                        src/routes/auth.tsx                          Sign in / sign up (email + Google)
                             src/components/ScheduleCallSheet.tsx         Bottom-sheet scheduler (overlay)
                             src/lib/sitters.ts                           Supabase queries for sitters + reviews
                             src/lib/bookings-store.ts                    Supabase CRUD for scheduled_calls
                             src/hooks/use-auth.tsx                       Auth context (session, signIn, signOut)
```

### 3. The flow that matters

The whole prototype exists to make **this one path** real:

```
/  → filter by postal code → click "Intro Call" on a card
   → if signed out: redirect to /auth → after sign-in, return to flow
   → ScheduleCallSheet opens → pick a slot → confirm
   → INSERT into scheduled_calls (RLS scopes it to auth.uid())
   → /bookings re-fetches via TanStack Query and shows the new call
```

Everything else is supporting cast.

### 4. Where to make your first change

- **Edit a sitter's data** → run a SQL update against the `sitters` table (via Lovable Cloud) — there are no hardcoded sitter arrays anymore.
- **Add a sitter** → INSERT into `sitters` (and optionally `reviews`). The browse page and profile page will pick it up on next fetch.
- **Change card UI** → `src/components/BabysitterCard.tsx`.
- **Change the schedule sheet** → `src/components/ScheduleCallSheet.tsx`.
- **Change auth UX** → `src/routes/auth.tsx` and `src/hooks/use-auth.tsx`.
- **Add a new route** → drop a file in `src/routes/` (flat dot-separated naming). The TanStack Router Vite plugin auto-generates `routeTree.gen.ts` — **do not hand-edit it**.

### 5. Things that will bite you

- **RLS is enforced.** `scheduled_calls` rows are scoped to `auth.uid()`. A signed-out client will see zero rows. A signed-in client only sees their own.
- **Sitter slug = lowercased name.** The profile route looks up by `lower(name) = $slug`. If you add a sitter, ensure names are URL-friendly.
- **Availability is still mocked.** `generateWeekSlots()` in `bookings-store.ts` returns the same week of slots for every sitter. Real availability is the next backend step.
- **Don't edit `src/integrations/supabase/client.ts` or `types.ts`.** They are auto-generated.
- **Don't add `src/pages/`.** This is TanStack Start, not Next.js. Routes live in `src/routes/`.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **TanStack Start v1** | File-based routing in `src/routes/`. Vite plugin generates `routeTree.gen.ts`. |
| Build | **Vite 7** | `bun dev`, `bun build`. Cloudflare Workers target via `@cloudflare/vite-plugin`. |
| UI runtime | **React 19** | Function components + hooks only. |
| Data fetching | **TanStack Query v5** | `QueryClient` created per request in `getRouter()`, provided via `QueryClientProvider` in `__root.tsx`. |
| Styling | **Tailwind v4** | Configured via `src/styles.css` (no `tailwind.config.js`). Native `@import "tailwindcss"` + `@theme inline`. |
| Design tokens | OKLCH CSS variables | All colors are semantic tokens (e.g. `--primary`, `--trust`, `--verified`, `--warmth`, `--rebook`) — no hardcoded hex in components. |
| Component primitives | **shadcn/ui** in `src/components/ui/` | Radix-based. Most are unused — only what the prototype needs is wired up. |
| Icons | **lucide-react** | |
| Forms / validation | `react-hook-form` + `zod` | Installed; auth form uses light validation. |
| Server runtime target | Cloudflare Workers (edge) | Constrains what server-side code can do; see TanStack Start docs. |
| Backend | **Lovable Cloud** (Supabase) | Postgres + Auth. Tables: `sitters`, `reviews`, `scheduled_calls`, `profiles`. RLS enforced everywhere. |
| Auth | Email/password + Google OAuth | Auto-confirm signup enabled (no inbox round-trip in the prototype). |

Package manager: **bun** (`bunfig.toml`, `bun.lockb`).

---

## 2. Repository Layout

```
.
├── README.md                        Short product overview
├── PRD.md                           Full product requirements doc
├── HANDOFF.md                       (this file)
├── package.json                     Deps + scripts
├── vite.config.ts                   Vite + TanStack + Tailwind plugins
├── wrangler.jsonc                   Cloudflare Workers config (deploy target)
├── tsconfig.json                    Path alias: @/* → src/*
├── eslint.config.js
├── components.json                  shadcn config
├── public/                          Static assets served as-is
└── src/
    ├── styles.css                   Global styles + OKLCH design tokens
    ├── router.tsx                   Router factory (creates QueryClient + router per request)
    ├── routeTree.gen.ts             AUTO-GENERATED — do not edit
    ├── routes/
    │   ├── __root.tsx               HTML shell, head meta, fonts, QueryClientProvider, AuthProvider, global 404
    │   ├── index.tsx                /                    — Browse + filter (DB-backed)
    │   ├── sitters.$sitterName.tsx  /sitters/:sitterName — Profile detail (DB-backed)
    │   ├── bookings.tsx             /bookings            — My scheduled calls (signed-in user only)
    │   └── auth.tsx                 /auth                — Sign in / sign up
    ├── components/
    │   ├── Navbar.tsx               Top nav, mobile menu, sign-in / sign-out controls
    │   ├── HeroSection.tsx          Landing hero (decorative search input)
    │   ├── FilterBar.tsx            Verified / certs / postal-code filter
    │   ├── BabysitterCard.tsx       Sitter card (browse grid)
    │   ├── ScheduleCallSheet.tsx    Bottom-sheet scheduler (overlay)
    │   └── ui/                      shadcn primitives (mostly unused)
    ├── lib/
    │   ├── sitters.ts               Supabase queries for sitters + reviews
    │   ├── bookings-store.ts        Supabase CRUD for scheduled_calls + slot generation
    │   └── utils.ts                 cn() helper from shadcn
    ├── hooks/
    │   ├── use-auth.tsx             Auth context (session, signIn, signOut, signUp)
    │   └── use-mobile.tsx           shadcn-provided breakpoint hook
    ├── integrations/
    │   ├── supabase/                AUTO-GENERATED — client.ts, types.ts (do not edit)
    │   └── lovable/                 AUTO-GENERATED — managed OAuth helper
    └── assets/
        └── (sitter photos now live in /public so they can be referenced by URL from the DB)
```

```
public/
└── sitter-1.jpg … sitter-6.jpg     Sitter photos referenced by `sitters.photo_url`
supabase/
├── config.toml                      Lovable Cloud project config
└── migrations/                      Versioned SQL migrations
```

---

## 3. Component Map (every component, what it does, where it's used)

### Application components

| Component | File | Purpose | Used by |
|---|---|---|---|
| `Navbar` | `src/components/Navbar.tsx` | Fixed top nav. Logo links home, links to `/` and `/bookings`. Shows **Sign In** when signed out and a **Sign Out** control when signed in (uses `useAuth()`). Mobile hamburger menu. | All routes |
| `HeroSection` | `src/components/HeroSection.tsx` | Landing hero. Headline, "Every sitter is ID verified" trust banner, and a **functional** postal-code search bar. Controlled by `index.tsx` — typing updates the same `filters.postalCode` that `FilterBar` uses, so the sitter grid filters live (FSA prefix match on first 3 chars). The Search button smooth-scrolls to the sitters grid. | `/` only |
| `FilterBar` | `src/components/FilterBar.tsx` | Live filter controls. Verified-only toggle, certifications dropdown (multi-select, options sourced from Supabase via `fetchCertifications()` — deduped union of all sitters' `certifications` arrays), Canadian postal-code text input (sanitized to `[A-Z0-9 ]`, max 7 chars, matches by FSA = first 3 chars), and a "Clear all" button when any filter is active. Drives the `filters` state in `index.tsx`. | `/` only |
| `BabysitterCard` | `src/components/BabysitterCard.tsx` | Sitter card in the browse grid. Photo, ID-verified badge, hourly rate, name, rating (or `"No reviews"` when `rating === 0`), "Has babysat N kids in your area" (or `"New to your area"` when `kidsInArea === 0`), experience tags, "Rebooked by N families" callout, and two CTAs: **View Profile** (link to `/sitters/$sitterName`) and **Intro Call** (opens `ScheduleCallSheet` if signed in, otherwise routes to `/auth`). | `/` |
| `ScheduleCallSheet` | `src/components/ScheduleCallSheet.tsx` | Modal bottom sheet for scheduling a 15-minute Google Meet pre-screening call. Two steps: `select` (week of slots grouped by day, then by Morning/Afternoon/Evening) and `confirmed` (success state with date, time, and Meet link). Calls `scheduleCall()` (Supabase INSERT) on confirm and invalidates the bookings query. Resets state on close. | `BabysitterCard`, `/sitters/$sitterName` |

### Route components (also act as page components)

| Route | File | Purpose |
|---|---|---|
| `__root` | `src/routes/__root.tsx` | Root layout. Defines the HTML shell (`RootShell`), head meta + Google Fonts (DM Serif Display + DM Sans), wraps the app in `QueryClientProvider` + `AuthProvider`, global 404 page, and renders `<Outlet />`. |
| `Index` | `src/routes/index.tsx` | `/` — Browse page. Owns the `filters` state. Fetches sitters from Supabase via `useQuery(['sitters'])` (see `src/lib/sitters.ts`), derives `filteredSitters` via `useMemo`, and renders `Navbar` + `HeroSection` + `FilterBar` + the card grid (or empty state). |
| `SitterProfile` | `src/routes/sitters.$sitterName.tsx` | `/sitters/:sitterName` — Profile page. Fetches the sitter + reviews via `useQuery(['sitter', slug])`, renders the hero card with **Book** + **Schedule a call** CTAs, plus Experience / Certifications / Availability / At-a-Glance / Reviews sections. Renders its own `ScheduleCallSheet`. |
| `BookingsPage` | `src/routes/bookings.tsx` | `/bookings` — Requires auth (redirects to `/auth` if signed out). Fetches the signed-in user's calls via `useQuery(['scheduled-calls', userId])`. Splits calls into "Upcoming" (status ≠ `Completed`) and "Past" (status = `Completed`). Renders a placeholder "Confirmed Bookings" section that is currently always empty (no booking primitive exists yet — see §6). |
| `AuthPage` | `src/routes/auth.tsx` | `/auth` — Email/password sign-in and sign-up tabs plus a Google OAuth button (managed via `lovable.auth.signInWithOAuth`). Redirects to `/` on success. |

### `src/components/ui/` (shadcn primitives)

These are vendored shadcn/ui components. The prototype only actively uses a small handful (none of the schedule-sheet UI is built from them — `ScheduleCallSheet` is a custom component). Treat the rest as "available if needed" rather than "in use." Don't delete them blindly; some are imported transitively. If you want a lean bundle, run a usage audit before pruning.

---

## 4. Data Model

All persistent data lives in Postgres (Lovable Cloud). Schema is defined in `supabase/migrations/`. RLS is enabled on every table.

### 4.1 `sitters` (publicly readable)

```sql
sitters (
  id uuid pk,
  slug text,                  -- lowercased name; profile route looks up by this
  name text,
  photo_url text,             -- e.g. "/sitter-1.jpg" (served from /public)
  bio text,
  hourly_rate int,            -- USD/hr
  postal_code text,           -- Canadian, e.g. "M5V 1A1". Filter matches first 3 chars (FSA)
  distance_miles int,
  years_experience int,
  is_verified bool,           -- drives the "ID Verified" badge
  kids_in_area int,           -- 0 → "New to your area"
  rebooked_by_families int,   -- 0 → callout hidden
  rating numeric,             -- 0 → renders "No reviews"
  availability text[],        -- ["Mon", "Tue", ...]
  experience_tags text[],
  certifications text[],
  created_at timestamptz,
  updated_at timestamptz
)
```

**RLS:** anyone (signed in or out) can SELECT. No INSERT/UPDATE/DELETE from the client — sitter management is admin-only and done via SQL migrations.

### 4.2 `reviews` (publicly readable)

```sql
reviews (
  id uuid pk,
  sitter_id uuid,             -- references sitters.id (logical, not enforced)
  family_name text,
  text text,
  rating numeric,
  created_at timestamptz
)
```

**RLS:** anyone can SELECT. No client-side writes (review-prompting flow not built — see PRD §8).

### 4.3 `scheduled_calls` (per-user, RLS-scoped)

```sql
scheduled_calls (
  id uuid pk,
  user_id uuid,               -- = auth.uid() of the booking parent
  sitter_id uuid,
  sitter_name text,
  sitter_photo text,
  date_label text,            -- e.g. "Mon Apr 28"
  time_label text,            -- e.g. "10:30 AM"
  slot_label text,            -- "${date} · ${time}"
  meet_link text,             -- placeholder: "https://meet.google.com/abc-defg-hij"
  status text,                -- "Requested" (default) | "Confirmed" | "Completed" — never transitions today
  created_at timestamptz,
  updated_at timestamptz
)
```

**RLS:** users can SELECT/INSERT/UPDATE/DELETE only rows where `user_id = auth.uid()`. Signed-out clients see zero rows.

### 4.4 `profiles` (per-user, auto-created)

```sql
profiles (
  id uuid pk,
  user_id uuid unique,        -- references auth.users
  display_name text,          -- from signup metadata, OAuth full_name, or email local-part
  avatar_url text,            -- from OAuth provider when available
  created_at timestamptz,
  updated_at timestamptz
)
```

A `handle_new_user()` trigger on `auth.users` inserts a profile row on signup. **RLS:** users can SELECT/INSERT/UPDATE only their own profile.

### 4.5 Client-side TimeSlot (still mocked) — `src/lib/bookings-store.ts`

```ts
interface TimeSlot {
  id: string;
  date: string;                              // "Mon Apr 28"
  time: string;                              // "10:30 AM"
  label: string;                             // `${date} · ${time}`
  block: "Morning" | "Afternoon" | "Evening";
}
```

`generateWeekSlots()` is a pure function returning a deterministic 6-day window (today+1 … today+6), 6 slots/day. Same slots for every sitter. `scheduleCall(sitterId, name, photo, slot)` performs a Supabase INSERT into `scheduled_calls` and returns the new row.

---

## 5. Mocked vs. Real

| Area | Status | Where it lives | Notes |
|---|---|---|---|
| Sitter list & profiles | **Real** | `sitters` table | Single source of truth; no more drift between browse and profile |
| Sitter photos | **Static** | `public/sitter-*.jpg` | Referenced by `sitters.photo_url` |
| Postal codes | **Real (seeded)** | `sitters.postal_code` | Canadian FSA-based filter |
| Reviews | **Real** | `reviews` table | Joined to sitter via `sitter_id`; "No reviews" when count is 0 |
| Kids-watched counts | **Seeded mock** | `sitters.kids_in_area` | 0 for Amara/Jake to exercise zero-trust path |
| ID verification badge | **Seeded mock** | `sitters.is_verified` | No real verification pipeline |
| Availability slots | **Mocked**, generated client-side | `bookings-store.ts → generateWeekSlots()` | Same slots for every sitter |
| Scheduled calls | **Real** | `scheduled_calls` table | Persisted, RLS-scoped to the signed-in user |
| Authentication | **Real** | `src/hooks/use-auth.tsx`, `src/routes/auth.tsx` | Email/password + Google OAuth, auto-confirm enabled |
| User profiles | **Real** | `profiles` table + DB trigger | Auto-created on signup |
| Google Meet link | **Mocked** | Static string in `scheduleCall()` | |
| Hero postal-code search | **Real** | `HeroSection.tsx` | Wired to the same `filters.postalCode` as `FilterBar`; FSA-prefix match against `sitters.postal_code` |
| Certifications filter list | **Real** | `fetchCertifications()` in `src/lib/sitters.ts` | Derived live from the union of `sitters.certifications` |
| Profile "Book {name}" CTA | **Decorative** | `sitters.$sitterName.tsx` | No booking primitive exists yet |
| Bookings page "Confirmed Bookings" section | **Placeholder** | `bookings.tsx` | Always empty; no data source |
| Routing, head meta, error/404 boundaries | **Real** | `__root.tsx`, `router.tsx`, per-route configs | Production-quality TanStack patterns |
| Design system (tokens, typography) | **Real** | `src/styles.css` | OKLCH semantic tokens, ready to extend |
| Payments, messaging, notifications | **Not built** | — | Out of scope for the experiment |
| Provider-side workflows | **Not built** | — | Parent-side experiment first |
| Calendar integration | **Not built** | — | No real Google/Apple calendar write |
| Analytics / instrumentation | **Not built** | — | See PRD §7 for the proposed event spec |

---

## 6. Known Tech Debt (read before refactoring)

1. **`useState` inside an IIFE in `BabysitterCard`.** The card uses an inline `(() => { const [x, setX] = useState(...); return <>...</>; })()` pattern around the schedule-sheet state. This works because the IIFE is called on every render in a stable position, but it's confusing and a lint rule away from breaking. Lift `callOpen` to a top-level hook in the component body.
2. **Hero search input does nothing.** `HeroSection`'s zip-code input is decorative. Either wire it to the same filter state as `FilterBar`, or remove it to avoid misleading users (and stakeholders watching the demo).
3. **Two `ScheduleCallSheet` instances per page.** Cards each render their own sheet, and the profile renders one too. Fine at this scale; if you ever lift state to a route-level provider, also lift the sheet to avoid mounting N copies.
4. **`distance_miles` is unused on the card** but still in the dataset. Either surface it or drop the column.
5. **`scheduled_calls.status` never advances.** Every call is created `Requested` and stays there. The "Past Calls" / "Completed" branch is dead until a real lifecycle (cron job, provider acceptance UI, or post-call mark-complete) is added.
6. **Availability is still client-generated.** `generateWeekSlots()` returns the same week for every sitter. Real per-sitter availability needs an `availability_slots` table + RLS for sitter-side writes.
7. **No reviews write path.** `reviews` is read-only from the client. A post-call "leave a review" flow would need an INSERT policy plus a foreign key to `scheduled_calls`.
8. **`__root.tsx` head meta is generic.** Each leaf route already overrides title/description; consider tightening the root og:title to avoid stale social previews if the root ever wins a render.

---

## 7. Common Tasks

**Add a sitter.** Run an INSERT against the `sitters` table via Lovable Cloud SQL. Use a unique lowercased name as the `slug` (it becomes the URL). Drop the photo into `public/` and reference it as `/your-photo.jpg` in `photo_url`. The browse and profile routes pick it up on next fetch — no code changes needed.

**Add a new filter.** Extend the `filters` shape in `src/routes/index.tsx`, add a control to `FilterBar.tsx`, and add a predicate in the `useMemo(() => sitters.filter(...))` block. If the filter needs a new column, add it to the `sitters` table via migration first.

**Add a new route.** Create `src/routes/<name>.tsx` exporting `Route = createFileRoute("/<name>")({...})`. Add a `<Link to="/<name>">` in `Navbar.tsx`. Don't touch `routeTree.gen.ts`. Always include a `head()` with a unique title/description.

**Wire real availability.** Create an `availability_slots` table (sitter_id, starts_at, duration_min, is_booked). Replace `generateWeekSlots()` with a Supabase query keyed on sitter. Add RLS so sitters can manage their own slots and parents can read public slots.

**Wire real video.** The Meet link is a static string in `scheduleCall()`. Swap for a Calendar API insert (returns a real `hangoutLink`), or generate a Daily/Whereby/Zoom room. The `meet_link` field on `scheduled_calls` is the contract.

**Add analytics.** PRD §7 has the event spec. Likely insertion points: `Index` mount (`landing_view`), `BabysitterCard` mount (`sitter_card_impression`), `SitterProfile` mount (`profile_view`), `ScheduleCallSheet` open (`schedule_call_opened`), slot click (`call_slot_selected`), `handleConfirm` (`call_confirmed`), and the decorative "Book" buttons once they're wired (`booking_initiated` with `had_prior_call`).

**Add analytics.** PRD §7 has the event spec. Likely insertion points: `Index` mount (`landing_view`), `BabysitterCard` mount (`sitter_card_impression`), `SitterProfile` mount (`profile_view`), `ScheduleCallSheet` open (`schedule_call_opened`), slot click (`call_slot_selected`), `handleConfirm` (`call_confirmed`), and the existing decorative "Book" buttons once they're wired (`booking_initiated` with `had_prior_call`).

---

## 8. Deployment

Configured for **Cloudflare Workers** via `@cloudflare/vite-plugin` and `wrangler.jsonc`. Build with `bun build`, deploy via the Workers toolchain. The Worker runtime has constraints — no `child_process`, no native binaries, no real filesystem. Don't add Node-only dependencies to server functions.

The repo syncs bidirectionally with GitHub via Lovable's GitHub connector. Edits in either place propagate to the other. There is no CI/CD pipeline configured beyond what your hosting target sets up.

---

## 9. Where to ask questions

- **Product / hypothesis / metrics** → [`PRD.md`](./PRD.md)
- **Quick overview** → [`README.md`](./README.md)
- **TanStack Start patterns** → https://tanstack.com/start
- **Tailwind v4 (no config file flow)** → https://tailwindcss.com/docs/v4-beta
- **Lovable platform / Cloud / GitHub sync** → https://docs.lovable.dev/

Welcome to the codebase. Start at `src/routes/index.tsx` and follow the imports.

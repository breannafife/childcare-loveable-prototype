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
| `Navbar` | `src/components/Navbar.tsx` | Fixed top nav. Logo links home, links to `/` and `/bookings`, decorative "Sign Up" button (no auth wired). Mobile hamburger menu. | All three routes |
| `HeroSection` | `src/components/HeroSection.tsx` | Landing hero. Headline, "Every sitter is ID verified" trust banner, and a **decorative** zip-code search bar (the input is not wired to filtering — the real filter lives in `FilterBar`). | `/` only |
| `FilterBar` | `src/components/FilterBar.tsx` | Live filter controls. Verified-only toggle, certifications dropdown (multi-select), Canadian postal-code text input (sanitized to `[A-Z0-9 ]`, max 7 chars, matches by FSA = first 3 chars), and a "Clear all" button when any filter is active. Drives the `filters` state in `index.tsx`. | `/` only |
| `BabysitterCard` | `src/components/BabysitterCard.tsx` | Sitter card in the browse grid. Photo, ID-verified badge, hourly rate, name, rating (or `"No reviews"` when `rating === 0`), "Has babysat N kids in your area" (or `"New to your area"` when `kidsInArea === 0`), experience tags, "Rebooked by N families" callout, and two CTAs: **View Profile** (link to `/sitters/$sitterName`) and **Intro Call** (opens `ScheduleCallSheet`). Owns its own `callOpen` state via an inline IIFE — see §4 for the cleanup note. | `/` |
| `ScheduleCallSheet` | `src/components/ScheduleCallSheet.tsx` | Modal bottom sheet for scheduling a 15-minute Google Meet pre-screening call. Two steps: `select` (week of slots grouped by day, then by Morning/Afternoon/Evening) and `confirmed` (success state with date, time, and Meet link). Calls `scheduleCall()` from the bookings store on confirm. Resets state on close. | `BabysitterCard`, `/sitters/$sitterName` |

### Route components (also act as page components)

| Route | File | Purpose |
|---|---|---|
| `__root` | `src/routes/__root.tsx` | Root layout. Defines the HTML shell (`RootShell`), head meta + Google Fonts (DM Serif Display + DM Sans), global 404 page, and renders `<Outlet />`. |
| `Index` | `src/routes/index.tsx` | `/` — Browse page. Owns the `filters` state, defines the `babysitters` array, derives `filteredSitters` via `useMemo`, and renders `Navbar` + `HeroSection` + `FilterBar` + the card grid (or empty state). |
| `SitterProfile` | `src/routes/sitters.$sitterName.tsx` | `/sitters/:sitterName` — Profile page. Looks up the sitter in `babysittersData` by lowercase name, renders the hero card with **Book** + **Schedule a call** CTAs, plus Experience / Certifications / Availability / At-a-Glance / Reviews sections. Renders its own `ScheduleCallSheet`. |
| `BookingsPage` | `src/routes/bookings.tsx` | `/bookings` — Subscribes to the bookings store via `useSyncExternalStore`. Splits calls into "Upcoming" (status ≠ `Completed`) and "Past" (status = `Completed`). Renders a placeholder "Confirmed Bookings" section that is currently always empty (no booking primitive exists yet — see §4). Defines a local `CallCard` sub-component for each call. |

### `src/components/ui/` (shadcn primitives)

These are vendored shadcn/ui components. The prototype only actively uses a small handful (none of the schedule-sheet UI is built from them — `ScheduleCallSheet` is a custom component). Treat the rest as "available if needed" rather than "in use." Don't delete them blindly; some are imported transitively. If you want a lean bundle, run a usage audit before pruning.

---

## 4. Data Model

There is no database. All "data" is plain TypeScript values colocated with the components that use them. Three shapes matter:

### 4.1 Sitter (browse-card variant) — `src/routes/index.tsx`

```ts
{
  name: string;              // Used as the display name AND the URL slug (lowercased)
  photo: string;             // Imported asset URL
  isVerified: boolean;       // Drives the "ID Verified" badge
  kidsInArea: number;        // Local-area count. 0 → "New to your area"
  experienceTags: string[];  // Pills under the name
  certifications: string[];  // Used by FilterBar (must include all selected certs)
  rebookedByFamilies: number;// 0 → callout hidden
  rating: number;            // 0 → renders "No reviews"
  hourlyRate: number;        // USD, displayed as $N/hr
  distanceMiles: number;     // Imported but currently unused on the card
  postalCode: string;        // Canadian, e.g. "M5V 1A1". Filter matches first 3 chars (FSA)
}
```

### 4.2 Sitter (profile-detail variant) — `src/routes/sitters.$sitterName.tsx`

Superset of the above, **without** `postalCode` and **with**:

```ts
{
  bio: string;
  yearsExperience: number;
  availability: string[];                                 // ["Mon", "Tue", ...]
  reviews: { family: string; text: string; rating: number }[];
}
```

⚠️ **The two datasets are not synced.** Same sitter names, different field values (notably `kidsInArea`, `rating`, `rebookedByFamilies`). They were created independently. See "Known Tech Debt" below.

### 4.3 Scheduled call — `src/lib/bookings-store.ts`

```ts
type CallStatus = "Requested" | "Confirmed" | "Completed";

interface ScheduledCall {
  id: string;            // `call-${Date.now()}`
  sitterName: string;
  sitterPhoto: string;
  date: string;          // Display label, e.g. "Mon Apr 28"
  time: string;          // Display label, e.g. "10:30 AM"
  label: string;         // `${date} · ${time}`
  meetLink: string;      // Static placeholder: "https://meet.google.com/abc-defg-hij"
  status: CallStatus;    // Always created as "Requested"; never transitions today
}

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  label: string;
  block: "Morning" | "Afternoon" | "Evening";
}
```

The store is a tiny pub/sub:

- `generateWeekSlots()` — deterministic 6-day window (today+1 … today+6), 6 slots/day (2 morning, 2 afternoon, 2 evening). Pure, called from `ScheduleCallSheet`.
- `scheduleCall(name, photo, slot)` — appends a `ScheduledCall`, notifies listeners, returns the new call.
- `getScheduledCalls()` — snapshot getter (used as `getSnapshot` for `useSyncExternalStore`).
- `subscribeToBookings(listener)` — register/unregister listener (the `subscribe` for `useSyncExternalStore`).

State lives in **module-level `let` bindings**. Refreshing the page wipes everything. There is no `Confirmed` or `Completed` transition path today.

---

## 5. Mocked vs. Real

| Area | Status | Where it lives | Notes |
|---|---|---|---|
| Sitter list & profiles | **Mocked** (hardcoded) | `src/routes/index.tsx`, `src/routes/sitters.$sitterName.tsx` | Two separate, drift-prone datasets |
| Sitter photos | **Mocked** (bundled assets) | `src/assets/sitter-*.jpg` | |
| Postal codes | **Mocked** | Card-level `postalCode` field | Canadian FSA-based filter |
| Reviews | **Mocked** (inline per sitter) | Profile dataset | Card shows `"No reviews"` when `rating === 0` |
| Kids-watched counts | **Mocked** | Card field is local (1–7, plus 0 for Amara/Jake to exercise zero-trust path); profile field is lifetime | |
| ID verification badge | **Mocked** | `isVerified: boolean` flag | No real verification pipeline |
| Availability slots | **Mocked**, generated client-side | `bookings-store.ts → generateWeekSlots()` | Same slots for every sitter |
| Scheduled calls | **Mocked**, in-memory only | `bookings-store.ts` | Lost on refresh |
| Google Meet link | **Mocked** | Static string in `scheduleCall()` | |
| Hero zip-code search | **Decorative** | `HeroSection.tsx` | Input is not wired; real filter is in `FilterBar` |
| Navbar "Sign Up" | **Decorative** | `Navbar.tsx` | No auth |
| Profile "Book {name}" CTA | **Decorative** | `sitters.$sitterName.tsx` | No booking primitive exists yet |
| Bookings page "Confirmed Bookings" section | **Placeholder** | `bookings.tsx` | Always empty; no data source |
| Routing, head meta, error/404 boundaries | **Real** | `__root.tsx`, `router.tsx`, per-route configs | Production-quality TanStack patterns |
| Design system (tokens, typography) | **Real** | `src/styles.css` | OKLCH semantic tokens, ready to extend |
| Auth, payments, messaging, notifications | **Not built** | — | Out of scope for the experiment |
| Backend / database / API | **Not built** | — | No Lovable Cloud connected |
| Provider-side workflows | **Not built** | — | Parent-side experiment first |
| Calendar integration | **Not built** | — | No real Google/Apple calendar write |
| Analytics / instrumentation | **Not built** | — | See PRD §7 for the proposed event spec |

---

## 6. Known Tech Debt (read before refactoring)

1. **Duplicate sitter datasets.** Browse and profile maintain independent objects with overlapping fields. Consolidate into a single `src/data/sitters.ts` (or a real backend) with one canonical shape; derive both views from it.
2. **`useState` inside an IIFE in `BabysitterCard`.** Lines 98–126 of `BabysitterCard.tsx` use an inline `(() => { const [x, setX] = useState(...); return <>...</>; })()` pattern. This works because the IIFE is called on every render in a stable position, but it's confusing and a lint rule away from breaking. Lift `callOpen` to a top-level hook in the component body.
3. **Hero search input does nothing.** `HeroSection`'s zip-code input is decorative. Either wire it to the same filter state as `FilterBar`, or remove it to avoid misleading users (and stakeholders watching the demo).
4. **Two `ScheduleCallSheet` instances per page.** Cards each render their own sheet, and the profile renders one too. Fine at this scale; if you ever lift state to a route-level provider, also lift the sheet to avoid mounting N copies.
5. **`distanceMiles` is unused on the card** but still in the dataset. Either surface it or drop the field.
6. **Bookings store status never advances.** Every call is created `Requested` and stays there. The "Past Calls" / "Completed" branch is dead until a real lifecycle is added.
7. **`__root.tsx` head meta is generic** ("Lovable App"). Each leaf route already overrides title/description; consider stripping the placeholder root og:title to avoid stale social previews if the root ever wins a render.

---

## 7. Common Tasks

**Add a sitter.** Append to the array in `src/routes/index.tsx` *and* the object in `src/routes/sitters.$sitterName.tsx`. Add a photo to `src/assets/`. Use a unique lowercase name (it becomes the URL slug).

**Add a new filter.** Extend the `filters` shape in `src/routes/index.tsx`, add a control to `FilterBar.tsx`, and add a predicate in the `useMemo(() => babysitters.filter(...))` block.

**Add a new route.** Create `src/routes/<name>.tsx` exporting `Route = createFileRoute("/<name>")({...})`. Add a `<Link to="/<name>">` in `Navbar.tsx`. Don't touch `routeTree.gen.ts`. Always include a `head()` with a unique title/description.

**Persist bookings.** Replace `bookings-store.ts` internals with `localStorage` (quickest), or enable Lovable Cloud and back it with a Postgres table + RLS. The pub/sub interface (`subscribe`, `getSnapshot`, `scheduleCall`) is the boundary — keep it stable so consumers don't change.

**Wire real video.** The Meet link is a static string in `scheduleCall()`. Swap for a Calendar API insert (returns a real `hangoutLink`), or generate a Daily/Whereby/Zoom room. The `meetLink` field on `ScheduledCall` is the contract.

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

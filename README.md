# SitterTrust — Interactive Prototype

A clickable prototype for a peer-to-peer babysitter marketplace, built to test whether **video pre-screening calls** can unblock the browse-to-book funnel for providers with little or no review history.

---

## 🎯 Hypothesis

> **If** we enrich provider profiles with the ability to book video calls,
> **then** the browse-to-book rate will increase **10%** for those who use the video meet feature,
> **because** parents need a low-effort way to further screen and connect with sitters before they'll book a stranger to come to their home.

**Kill switch:** Parents won't book providers regardless of trust signals if they can't video call with them first.

**Validated if:** A parent browses an enriched provider profile and initiates a booking with a **zero-review** provider who offers a video call.

---

## 📊 Scenario

A peer-to-peer babysitter marketplace, 2 years old, pre-Series A.

| Metric | Value |
| --- | --- |
| Registered users | 50K |
| MAU | 8K |
| QoQ signup growth | +22% |
| Funnel bounce at provider selection | 71% |
| Providers with zero reviews | 64% |
| Median wait for new provider's first booking | 47 days |
| 90-day new-provider churn | 72% |
| Parents willing to pay a premium for "verified" providers | 73% |
| Bookings captured by top 10% of providers | 58% |
| Repeat booking rate | 41% |

**Core problem:** Bookings are flat despite signup growth. Profiles show only a name and photo — parents don't have enough signal to trust a stranger in their home, especially one with no reviews. The platform also never prompts for reviews, starving new providers of social proof.

---

## 🖼 Key Screens

1. **Landing / Browse (`/`)**
   - Hero with trust banner: *"Every sitter is ID verified."*
   - Filter bar with **Canadian postal code** search (filters by FSA — first 3 chars).
   - Grid of enriched sitter cards: photo, name, rate, postal area, review count (or *"No reviews"*), kids watched, and a **"Book intro call"** CTA.

2. **Sitter profile (`/sitters/$sitterName`)**
   - Full bio, experience, certifications, kids-watched count, reviews list.
   - Two primary CTAs: **Book** and **Schedule a call** (the experiment).

3. **Schedule-a-call bottom sheet**
   - Week of mock availability split into Morning / Afternoon / Evening blocks.
   - Confirmation screen with date, time, and a generated **Google Meet link**.

4. **My Bookings (`/bookings`)**
   - **Upcoming calls** section (new) — separate from confirmed bookings.
   - Shows sitter, date/time, status (Requested / Confirmed / Completed) and the Meet link.

---

## 🔁 Core User Flow (the experiment path)

```
Landing
  └─ Filter by postal code (e.g. M5V)
       └─ See sitter card with "Book intro call" CTA
            └─ Open profile (zero-review sitter)
                 └─ Tap "Schedule a call"
                      └─ Pick slot from week availability
                           └─ Confirm → Google Meet link generated
                                └─ Appears in "Upcoming calls" on /bookings
```

This flow directly exercises the **Validated If** condition: a parent reaching booking intent on a zero-review provider via the video-call affordance.

---

## 🏗 Main Build Decisions

### Stack
- **TanStack Start v1** (React 19, file-based routing, SSR-ready) on **Vite 7**.
- **Tailwind v4** via `src/styles.css` with semantic OKLCH design tokens (no hard-coded colors in components).
- **shadcn/ui** primitives, customized through tokens rather than overrides.
- **Lucide** icons. **Framer Motion** reserved for hero-level moments only.

### Data
- All data is **mocked in-memory** — this is a prototype, not a backend cut. A swap to Lovable Cloud is a one-step migration if we promote the experiment.
- `src/lib/bookings-store.ts` — minimal pub/sub store for scheduled calls and slot generation. Status enum: `Requested | Confirmed | Completed`.
- Sitter mock data lives in `src/routes/index.tsx` and includes:
  - **Realistic kids-watched counts (1–7)** — Amara and Jake intentionally set to **0** to test the zero-review / new-provider path.
  - **Canadian postal codes** (M5V, M4W, K1A, V6B, …) so postal-code filtering has meaningful clusters.

### UX choices tied to the hypothesis
- **"Book intro call" CTA on every card** — surfaces the experiment at the browse step, not buried on the profile, so we can measure whether it lifts profile-click rate too.
- **Zero-review handling** — cards show *"No reviews"* explicitly instead of `0 ⭐`, removing a negative trust signal while the video-call affordance does the trust work.
- **Bottom-sheet scheduler** — mobile-first, low-friction, mirrors native calendar pickers parents already trust.
- **Separate "Upcoming calls" section** in My Bookings — keeps the new primitive distinct from confirmed bookings so we can attribute downstream conversion cleanly.
- **Trust banner copy: *"Every sitter is ID verified"*** — pairs the new behavioral signal (video) with a baseline platform-level signal, since 73% of parents already say verification is worth a premium.

### What was deliberately *not* built
- Real auth, payments, messaging, calendar integration — out of scope for a directional test.
- Review-prompting flow — separate hypothesis; would muddy attribution.
- Provider-side scheduling UI — the experiment is parent-side first; sitters get mock availability.

---

## 🚀 Run locally

```bash
bun install
bun dev
```

Routes are auto-generated by the TanStack Router Vite plugin from files in `src/routes/`.

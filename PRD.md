# PRD — TinyWatch Video Pre-Screening Experiment

**Status:** Clickable interactive prototype (not production)
**Owner:** Product Manager Breanna Fife
**Stack:** TanStack Start v1 (React 19, Vite 7), Tailwind v4, shadcn/ui, TanStack Query — backed by Lovable Cloud (Postgres + Auth)
**Companion docs:** [`README.md`](./README.md)

---

## 1. Overview

TinyWatch is a peer-to-peer babysitter marketplace. This prototype tests a single, surgical hypothesis: **can a "book a video intro call" affordance unblock the browse-to-book funnel for sitters who have little or no review history?**

The prototype simulates the parent-side experience end-to-end — browsing sitters by Canadian postal code, opening an enriched profile, scheduling a video intro call, and seeing that call appear in "My Bookings." It is intentionally narrow: no auth, no payments, no provider-side workflow, no real video integration. Its sole purpose is to make the new behavior real enough to put in front of users and stakeholders so we can decide whether to invest in a production build.

---

## 2. Target Users

**Primary — Parents browsing for in-home babysitters.**
Especially first-time bookers in dense urban postal areas (Toronto M5V, M4W; Vancouver V6B; Ottawa K1A in the mock data). They are the source of the 71% bounce at provider selection and the audience the experiment is designed to convert.

**Secondary — New providers with zero or low review counts.**
They benefit indirectly: today they wait a median of 47 days for their first booking and 72% churn within 90 days. The video-call affordance is the trust shortcut that lets parents commit before social proof exists.

**Out of scope for this iteration.**
Provider-side onboarding, ops/admin tooling, and returning power-users (already converting at 41% repeat rate — not the bleeding edge of the funnel).

---

## 3. Problem & Hypothesis

### Problem

Bookings are flat despite +22% QoQ signup growth. The funnel breaks at provider selection:

- **71%** of parents bounce at the provider-selection step
- **64%** of providers have zero reviews
- **47 days** median wait for a new provider's first booking
- **72%** 90-day churn for new providers
- **73%** of parents say they would pay a premium for "verified" providers
- **58%** of bookings concentrate in the top 10% of providers

The platform shows little more than a name and photo, and never prompts for reviews. New providers are starved of social proof, parents have no signal to trust a stranger in their home, and the long tail of supply is wasted.

### Hypothesis

> **If** we enrich provider profiles with the ability to book video calls,
> **then** the browse-to-book rate will increase **10%** for parents who use the video meet feature,
> **because** parents need a low-effort way to further screen sitters on the platform and connect with sitters before they'll book a stranger to come to their home.

### Kill switch

Parents are less likely book providers regardless of trust signals if they can't video call with them first. If the call feature is available and adoption is real but bookings still don't move on zero-review providers, the hypothesis is wrong and we kill it.

### Validated if

A parent browses an enriched provider profile and **initiates a booking with a zero-review provider** who offered a video call. The directional read in the prototype is qualitative; the production read is quantitative (see §7).

---

## 4. Scope — What It Does

In scope for the prototype:

- Browse a grid of verified sitters on the landing page (data served from Postgres, anonymous browsing)
- Filter by **Canadian postal code** (FSA — first three characters), verification status, and certifications
- Open an enriched **sitter profile** with bio, experience tags, certifications, kids-watched count, and reviews (or an explicit "No reviews" state)
- **Sign up / sign in** with email + password or Google to gate the booking step
- **Book an intro call** from a sitter card or profile (sign-in required at the moment of booking)
- Pick a slot from a week of generated availability split into Morning / Afternoon / Evening
- Receive a confirmation with a placeholder **Google Meet link**
- See scheduled calls in **My Bookings** under "Upcoming calls", scoped to the signed-in user, with status (Requested / Confirmed / Completed)

Explicitly out of scope: payments, messaging, real video, real availability, real verification, provider-side scheduling, notifications, cancellation/reschedule flows.

---

## 5. Screens & Purpose

### 5.1 Landing / Browse — `/`

**Purpose.** Convert a curious visitor into a profile click — and, ideally, into an intro-call request before they even open a profile.

**Key elements.**
- Hero with the trust banner *"Every sitter is ID verified."* and a functional postal-code search (FSA prefix match) that filters the grid live and smooth-scrolls to results
- Filter bar: postal code text input (sanitized to alphanumeric, max 7 chars, shares state with the hero), verified-only toggle, certification multiselect (options sourced from sitter profiles in the database)
- Sitter card grid: photo, name, hourly rate, postal area, kids-watched count, reviews summary or *"No reviews"*, and a **"Book intro call"** CTA on every card

**Primary CTAs.** "Book intro call" (experiment surface), card click → profile.
**Empty state.** "No sitters match your filters" with a one-click clear.

### 5.2 Sitter profile — `/sitters/$sitterName`

**Purpose.** Give the parent enough trust signal to commit, with the video call as the lowest-friction way to do that.

**Key elements.** Full bio, years of experience, certifications, availability days, kids-watched count, reviews list (or empty state).
**Primary CTAs.** **Book** and **Schedule a call** — sitting side-by-side so the experiment is on equal footing with the existing booking action.

### 5.3 Schedule-a-call bottom sheet (component overlay)

**Purpose.** Make picking a time feel native and frictionless. Mobile-first bottom sheet, mirrors patterns parents already use in calendar apps.

**Key elements.** Week of mock slots grouped by Morning / Afternoon / Evening. Tap a slot → confirmation screen with date, time, and a generated Google Meet link.
**Success state.** "Call scheduled" confirmation with the Meet link and a path back to browsing.

### 5.4 My Bookings — `/bookings`

**Purpose.** Anchor the new primitive ("upcoming calls") in the user's account so it feels durable, and keep it visually distinct from confirmed bookings so we can attribute downstream conversion cleanly.

**Key elements.** Two sections: **Upcoming calls** (Requested / Confirmed) and past calls (Completed). Each card surfaces sitter, date/time, status badge, and the Meet link.
**Empty state.** "No upcoming calls yet" → link back to Browse.

---

## 6. Core User Flow

The experiment path — what every instrumentation, copy, and design decision is built to make easy:

```text
Landing
  └─ Filter by postal code (e.g. M5V)
       └─ See sitter card with "Book intro call" CTA
            └─ Open profile (zero-review sitter)
                 └─ Tap "Schedule a call"
                      └─ Pick slot from week availability
                           └─ Confirm → Google Meet link generated
                                └─ Appears in "Upcoming calls" on /bookings
```

**Alternate flows.**
- Browse without filter → card → profile → schedule (covers parents who don't yet know their FSA matters).
- Filter returns no matches → "Clear all filters" → re-browse (graceful empty state).
- Schedule directly from a card without opening the profile (tests whether the CTA can convert before the profile load — a stronger signal if it works).

---

## 7. Key Metrics & Instrumentation

### North-star

**Browse → book conversion lift of +10%** on the cohort that uses the video-call feature, vs. a control cohort that does not.

### Funnel (events to fire)

| # | Event | Required properties |
|---|---|---|
| 1 | `landing_view` | `fsa_filter?`, `is_returning` |
| 2 | `sitter_card_impression` | `sitter_id`, `review_count`, `position` |
| 3 | `profile_view` | `sitter_id`, `review_count`, `entry: card \| direct` |
| 4 | `schedule_call_opened` | `sitter_id`, `review_count`, `surface: card \| profile` |
| 5 | `call_slot_selected` | `sitter_id`, `slot_block: morning \| afternoon \| evening` |
| 6 | `call_confirmed` | `sitter_id`, `meet_link_generated: true`, `time_to_confirm_ms` |
| 7 | `booking_initiated` | `sitter_id`, `review_count`, `had_prior_call: bool`, `days_since_call?` |

### Supporting metrics

- **Video-call attach rate** = `call_confirmed` / `profile_view`
- **Zero-review profile → call rate** = `call_confirmed` / `profile_view` filtered to `review_count = 0`
- **Call → booking conversion** = `booking_initiated (had_prior_call=true)` / `call_confirmed`
- **Provider-side:** time from signup to first booking; 90-day new-provider churn (long-cycle, read after the experiment ends)

### Cohorts / segmentation

- Review-count bucket: **0**, **1–4**, **5+**
- FSA cluster (M5V, M4W, K1A, V6B, …)
- New vs. returning parent
- Surface that originated the call: card vs. profile

### Decision thresholds

- **Validated** — both must hold:
  1. ≥10% lift in browse → book on the call-feature cohort vs. control (statistically significant at p ≤ 0.05 over a sample sized for the baseline conversion rate)
  2. ≥1 confirmed booking on a `review_count = 0` provider where `had_prior_call = true`
- **Killed** — either holds:
  1. Call-feature cohort shows no statistically meaningful lift after the powered sample
  2. Zero-review-after-call booking rate stays at floor (≈baseline) for the duration

---

## 8. Mocked vs. Real

| Area | Status | Notes |
|---|---|---|
| Sitter list & profiles | **Real** | Stored in Postgres `sitters` table; seeded once with the original prototype data |
| Postal codes | **Real (seeded)** | Canadian FSA strings on each sitter row; filter matches first 3 chars |
| Reviews | **Real** | Stored in `reviews` table, joined to sitter on `sitter_id`; "No reviews" rendered when count is 0 |
| Kids-watched counts | **Seeded mock data** | Stored on the sitter row; values mirror the original prototype (Amara/Jake = 0) |
| Availability slots | **Mocked** | Generated client-side in `src/lib/bookings-store.ts` (current week, 6 slots/day) |
| Scheduled calls | **Real** | `scheduled_calls` table, scoped to the signed-in user via RLS |
| Authentication | **Real** | Email/password + Google OAuth via Lovable Cloud; auto-confirm signup enabled for the prototype |
| User profiles | **Real** | `profiles` table auto-populated on signup via DB trigger |
| Google Meet link | **Mocked** | Static placeholder URL on every confirmation |
| ID verification badge | **Seeded mock data** | Boolean flag on sitter row; no real verification pipeline |
| Payments, messaging | **Not built** | Out of scope for a directional test |
| Provider-side scheduling | **Not built** | Parent-side experiment first; sitters get mock availability |
| Calendar integration | **Not built** | No real Google/Apple calendar write |
| Notifications | **Not built** | No email/SMS/push |
| Review-prompting flow | **Not built** | Separate hypothesis; would muddy attribution |
| Analytics | **Not built** | §7 spec is the production target, not what fires today |

---

## 9. Out of Scope (explicit non-goals)

- Real payments, real auth, real messaging
- Provider onboarding & verification pipeline
- Notifications (email / SMS / push)
- Cancellation, rescheduling, no-show handling
- Search beyond FSA matching (no geo-radius, no map)
- Multi-language / multi-region beyond Canadian postal codes

---

## 10. Open Questions / Next Iteration

1. **Gating.** Currently anonymous browse, sign-in required at booking. Should we move the gate earlier (e.g. require sign-in to view profiles) to capture more signal, or push it later (book without account, claim after) to maximise top-of-funnel?
2. **Attribution.** With the CTA on both card and profile, how do we cleanly attribute booking lift to the call vs. the profile content?
3. **Provider acceptance.** Do sitters confirm slots manually, or is published availability authoritative? The answer changes the `Requested → Confirmed` state machine.
4. **Trust ladder.** If video calls work, does the verification badge still earn its place — or do we lean into the call as the primary trust primitive?
5. **Long-cycle metrics.** When do we read provider-side metrics (time-to-first-booking, 90-day churn) given they take a quarter to move?

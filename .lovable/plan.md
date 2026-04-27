## Goal

Create `PRD.md` at the repo root summarizing the prototype as a standard product requirements document (3–5 pages), including a proposed metrics & instrumentation section. The file lives alongside `README.md` so it syncs with GitHub automatically.

## Deliverable

A single new file: `PRD.md` (Markdown, no code changes elsewhere).

## PRD Structure

1. **Overview**
   - One-paragraph product description (TinyWatch / SitterTrust prototype)
   - Status: clickable interactive prototype, not production
   - Stack one-liner (TanStack Start, mocked data)

2. **Target Users**
   - Primary: parents browsing for in-home babysitters, especially first-time bookers in dense urban postal areas (M5V, M4W, etc.)
   - Secondary: new providers (zero-review sitters like Amara, Jake) who need a path to first booking
   - Excluded for this iteration: provider-side workflows, ops/admin

3. **Problem & Hypothesis**
   - Problem statement (71% bounce at provider selection, 64% zero-review providers, 47-day median to first booking, 72% 90-day new-provider churn)
   - Hypothesis (if/then/because) — video pre-screening calls
   - Kill switch
   - "Validated if" condition (zero-review provider booking initiated after a video call)

4. **Scope: What It Does**
   - Browse verified sitters by Canadian postal code (FSA match)
   - Filter by verification status and certifications
   - View enriched profile (bio, experience, certifications, kids watched, reviews or "No reviews")
   - Schedule a video intro call from a card or profile
   - View scheduled calls in "My Bookings"

5. **Screens & Purpose**
   For each: route, purpose, key elements, primary CTA, success state.
   - Landing / Browse — `/`
   - Sitter Profile — `/sitters/$sitterName`
   - Schedule-a-call bottom sheet (component overlay)
   - My Bookings — `/bookings`

6. **Core User Flow**
   ```text
   Landing → Postal-code filter (M5V) → Card with "Book intro call"
     → Profile (zero-review sitter) → "Schedule a call"
       → Pick slot (Morning/Afternoon/Evening across week)
         → Confirm → Google Meet link generated
           → Visible in /bookings under "Upcoming calls"
   ```
   Plus: alternate flow (browse without filter), empty-state flow (no matches → clear filters).

7. **Key Metrics & Instrumentation**
   - **North-star:** browse → book conversion lift of +10% on cohort that uses the video-call feature
   - **Funnel definition:**
     1. `landing_view`
     2. `sitter_card_impression` (per card)
     3. `profile_view` (with `sitter_id`, `review_count`)
     4. `schedule_call_opened`
     5. `call_slot_selected`
     6. `call_confirmed` (with `meet_link_generated: true`)
     7. `booking_initiated` (with `had_prior_call: bool`, `review_count`)
   - **Supporting metrics:** video-call attach rate, zero-review profile → call rate, call → booking conversion, time from signup to first booking (provider-side), 90-day new-provider churn
   - **Success thresholds:**
     - Validated: ≥10% lift in browse→book among call-feature users vs. control, AND ≥1 confirmed booking on a zero-review provider preceded by a call
     - Killed: video-call cohort shows no statistically meaningful lift OR zero-review-after-call booking rate stays flat
   - Cohort/segmentation: by review count bucket (0, 1–4, 5+), by FSA, by new vs. returning parent

8. **Mocked vs. Real**

   | Area | Status | Notes |
   |---|---|---|
   | Sitter list & profiles | Mocked | Hardcoded in `src/routes/index.tsx` and `sitters.$sitterName.tsx` |
   | Postal codes | Mocked | Canadian FSA strings on each sitter |
   | Reviews | Mocked | Inline per sitter; "No reviews" rendered when count is 0 |
   | Availability slots | Mocked | Generated client-side in `src/lib/bookings-store.ts` |
   | Scheduled calls | Mocked (in-memory) | Pub/sub store, lost on refresh |
   | Google Meet link | Mocked | Static placeholder URL |
   | ID verification badge | Mocked | Boolean flag on sitter object; no real verification |
   | Auth, payments, messaging | Not built | Out of scope for directional test |
   | Provider-side scheduling | Not built | Parent-side experiment first |
   | Calendar integration | Not built | No real Google/Apple calendar |
   | Review-prompting flow | Not built | Separate hypothesis; would muddy attribution |

9. **Out of Scope (explicit non-goals)**
   - Real payments, auth, messaging
   - Provider onboarding / verification pipeline
   - Notifications (email/SMS/push)
   - Cancellation, rescheduling, no-show handling
   - Search beyond FSA matching (no geo-radius, no map)

10. **Open Questions / Next Iteration**
    - Should the call CTA be gated behind sign-in?
    - How do we attribute booking lift cleanly when both card and profile expose the call CTA?
    - Provider acceptance UX: do sitters need to confirm slots, or is availability authoritative?

## Notes on Delivery

- File will be written to `/PRD.md` (project root) so it syncs to GitHub via the existing connector.
- No source code changes; existing prototype behavior is unchanged.
- Length target: ~3–5 pages rendered (~1,500–2,500 words).

## Core Prompt Template (Skill) — TinyWatch Prompt Pack

Create a single markdown artifact, `PROMPT_PACK.md`, in `/mnt/documents/`, pre-filled with TinyWatch-specific content for each of the three sections. This is a documentation deliverable (no code changes).

### Structure

**Step 1 — Expand: Product Context Block**
Universal context block pasted at the top of every prompt. Encodes:
- Product mission (TinyWatch: trust-first babysitter marketplace, intro-call-before-booking model)
- Tech anchors (TanStack Start v1, React 19, Tailwind v4, Lovable Cloud / Supabase, RLS-first security)
- Role model (parent / sitter / admin via `user_roles` + `has_role()`)
- Non-negotiables (no roles on profiles table, no auth.users FKs, never edit generated Supabase files)

**Step 2 — Behaviour: Knowledge Grounding (RAG) / Business Rules**
Hard-coded if/then triggers tethering the AI to functional truth:
- IF feature touches user roles → THEN use `user_roles` + `has_role()` security-definer pattern
- IF booking flow → THEN intro call (`scheduled_calls`) must precede paid `bookings`
- IF Google Calendar → THEN OAuth via `/api/public/google/oauth/*` with HMAC-signed state
- IF server function needs auth → THEN validate token via `sb.auth.getClaims()`, return benign result on miss (don't throw raw Response)
- IF sitter signup via OAuth → THEN call `claim-sitter-role` edge function post-SIGNED_IN
- IF new table → THEN enable RLS + write policies in same migration

**Step 3 — Refine: Design System Reference + Isolated-Change Prompt**
- Design system: shadcn/ui components in `src/components/ui/*`, Tailwind v4 tokens in `src/styles.css`, semantic color tokens (no raw hex in components)
- Isolated-change prompt template: scope guard ("only modify X, do not touch Y"), file allowlist, "preserve existing RLS / route structure / auth middleware" clauses

### Output

One file: `/mnt/documents/PROMPT_PACK.md` — copy-paste-ready prompts in fenced code blocks, with brief commentary between sections explaining when to use each.

No app code changes. No database changes.

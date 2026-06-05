# PUMP Build Spec v2 — Supabase Cutover + UI Fixes

> **Status (2026-06-05): Phase 1 ✅ done** on branch `supabase-cutover` —
> auth (§0–1), active-plan fetch (§2), session write + feel field (§3), and the
> UI fixes (§4a In-Progress, §4b reorder/supersets, §4c set-persistence audit).
> **Phase 2 (§5 — retire Upstash) is NOT started**: it's gated on verifying a
> session + plan round-trip on a second device first. Still pending before
> Phase 1 is "live": Supabase Auth redirect-URL allowlist, Vercel env vars +
> redeploy, and tightening the placeholder RLS to `auth.uid()` (§1).

Hand this to Claude Code. Supersedes v1. The `pump_migration.sql` schema is
already applied to the DD Health Supabase project (`eifcefpxttrijarsfjre`).

## Facts baked into this spec
- PUMP is **Next.js 16 App Router**, offline-first (localStorage), currently
  syncing to Upstash Redis via `src/app/api/data/route.ts`. Read `AGENTS.md`
  and the Next 16 docs before writing code.
- Env vars are **`NEXT_PUBLIC_*`** read through `process.env`. Not Vite,
  not `import.meta.env`.
- Supabase is **additive in Phase 1, authoritative in Phase 2**. Do not delete
  the Upstash sync until Phase 1 is verified on a second device.
- PUMP keeps its existing per-set Epley e1RM PR system (`checkAndUpdatePRs`,
  baselines in `useWorkout.ts`). The coach-owned `prs` table is separate. PUMP
  does **not** read it. Section 3 of v1 was wrong about this.

---

## 0. Environment and client

Rename the Vercel vars (and `.env.local`) from `VITE_` to:
```
NEXT_PUBLIC_SUPABASE_URL=https://eifcefpxttrijarsfjre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YS8Qo4HeE_JUatpp_dpXGg_n69Z0ygE
```
Redeploy after editing env vars (Vercel only applies them on a fresh build).

Client at `src/lib/supabase.ts` (browser client, app is client-rendered):
```ts
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
`npm i @supabase/ssr @supabase/supabase-js`. Plain `supabase-js` `createClient`
is acceptable for a pure client PWA if `@supabase/ssr` fights Next 16.

---

## 1. Auth (required, single user)

The migration's RLS policies require an authenticated user. The publishable key
is public, so RLS is the only thing protecting the data, and this is health data.

- Add Supabase Auth, magic-link sign-in. One user (you). The client persists the
  session to localStorage, so it is a one-time login that auto-restores.
- After your first login, tighten RLS in DD Health: replace `using (true)` with
  `using (auth.uid() = '<your-uid>')` on all eight tables. The migration shipped
  permissive `authenticated` policies as a placeholder.

---

## 2. Fetch the active plan (replaces the paste step)

```ts
const { data, error } = await supabase
  .from('plans').select('*').eq('is_active', true).single()
// data.json is the TrainerPlan, same shape PlanLoader already parses
```
- On app load / entering the Plan tab, fetch the active plan and save it through
  the existing plan-save path into the `dylan-workout-plan` localStorage key, so
  the rest of the app is untouched.
- Keep `PlanLoader` paste as a manual fallback. Supabase fetch is the primary path.
- Acceptance: coach publishes a new plan version, next app load picks it up. A plan
  change never alters a session already in progress.

---

## 3. Write the session on finish (additive, non-blocking)

In the finish path (`SessionSummary` / `useWorkout` completion), after the session
saves locally and the BRIEF is generated, write one row to `sessions`.

```ts
await supabase.from('sessions').insert({
  session_date: session.date,                 // 'YYYY-MM-DD'
  plan_id:      activePlan?.planId ?? null,
  plan_version: activePlan?.version ?? null,
  label:        session.name ?? null,          // plan session name if present
  duration_min: minutesBetween(session.startTime, session.endTime),
  total_volume: computedVolume,
  feel_score:   session.feelScore ?? null,     // null until the feel field ships
  exercises:    session.exercises,             // PUMP's native GymExercise[] incl sets[] + supersetGroupId
  raw_brief:    briefText,                      // verbatim
  processed:    false,
  // include useWorkout's computed newPRs / newBaselines so the coach
  // does not re-derive them; nest them on the payload, e.g.:
  // pr_summary: { prs: newPRs, baselines: newBaselines }
})
```
- Store `session.exercises` in its **native PUMP shape**. The coach parses that.
  Do not invent a new exercise schema.
- Non-blocking: if the insert fails (offline), queue and retry on next focus.
  Never block the local save. localStorage stays primary in Phase 1.
- Acceptance: every finished session lands as a row, `processed = false`,
  `raw_brief` verbatim.

Note: the "Session feel / notes field on summary" backlog item feeds `feel_score`
and the BRIEF. Worth building in this pass since the coach uses feel directly.

---

## 4. UI / bug fixes

### 4a. In Progress status bug (priority, ship first)
Finished sessions still render "In Progress" with `--` duration (Today, Jun 1,
May 23). The finish path is not setting `completed` / `endTime`. Fix it to set
`completed = true`, `endTime`, and a computed duration. Confirm a reload shows
the session completed with its duration.

### 4b. Reorder exercises + edit supersets mid-workout
Implement the approach already specified in `BACKLOG.md`:
- A dedicated reorder sheet, not inline drag (the live cards are full of number
  inputs and inline DnD fights typing on mobile). Compact cards: name, set count,
  superset badge, drag handle.
- Use framer-motion `Reorder.Group` / `Reorder.Item` (already a dependency).
- Reorder persists the order of `session.exercises[]`. Each exercise carries its
  own `sets[]`, so logged data travels with the card. Write back through the
  existing `saveSession` / `patchSession` path; `GymWorkout` re-reads on return.
- Supersets are modeled by `GymExercise.supersetGroupId`. Unlink clears the id,
  link assigns a shared id to adjacent exercises.
- Resolve the open question this way: moving a superset member out of adjacency
  **auto-unlinks it** (clears its `supersetGroupId`). That matches the real use
  case, breaking a pair when a station is contended. No separate "move the whole
  group" gesture for now.

### 4c. Partial-set recording bug
Audit the set-completion write path (`GymSet` status through `useWorkout` into
`storage`). Confirm a completed set persists as completed through save and reload.

---

## 5. Phase 2 — retire the Upstash sync (only after Phase 1 is verified)

Do not start this until a finished session and a plan change both round-trip
through Supabase on a second device. Never run Upstash and Supabase as competing
authoritative session stores at the same time.

1. Make Supabase the backbone: on load, hydrate from Supabase and reconcile with
   localStorage (localStorage becomes the offline cache, Supabase the source of
   truth).
2. Remove the Upstash path entirely:
   - delete `src/app/api/data/route.ts`
   - delete `src/lib/sync.ts`, `src/lib/sync-merge.ts`, `src/hooks/useCloudSync.ts`,
     `src/components/workout/CloudSyncCard.tsx`
   - remove the `useCloudSync` mount in `src/app/page.tsx`
   - drop the localStorage keys `pump-sync-token` and `pump-sync-last`
   - remove the Vercel vars: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`,
     `KV_REST_API_READ_ONLY_TOKEN`, `REDIS_URL`, `SYNC_TOKEN`
   - delete the Upstash store from the Vercel Marketplace so it stops billing

---

## 6. Out of scope (coach side, via MCP)
Analysis, PR curation (`prs`), plan versioning, `coaching_state`, and
`progress_notes` are written by the coach against the same tables. PUMP only
writes `sessions`, reads `plans`, and (Phase 2) hydrates sessions for display.

---

## Build order
1. Env rename + client + auth (0, 1)
2. In Progress bug (4a) — user-visible, independent, ship first
3. Fetch active plan (2)
4. Write session on finish (3)
5. Reorder + supersets (4b), partial-set audit (4c)
6. Verify on a second device
7. Phase 2: retire Upstash (5)

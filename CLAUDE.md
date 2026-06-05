@AGENTS.md

# PUMP — Claude Code Context

## What this app is
A mobile-first PWA workout tracker for Dylan's personal use, deployed at pump.dylandibona.com. It is one half of the **PUMP OS** — a training system where a Claude Health Project acts as a remote trainer and this app acts as the gym executor. See `../trainer-os/README.md` for the full system spec.

## Architecture in one line
Next.js 16 App Router, offline-first client (all data in localStorage), local-first with cloud sync — **mid-migration from Upstash Redis to Supabase** (DD Health project). Deployed via GitHub → Vercel. See `pump_build_spec_v2.md` for the cutover plan.

## Key files to know
- `src/lib/types.ts` — all data types including PUMP OS types (TrainerPlan, PlanSession, PlanExercise). `PersonalRecord` carries `e1rm` + `previousWeight`/`previousReps`. `WorkoutSession` carries `feelScore` + `prSummary` (for the Supabase session write).
- `src/lib/storage.ts` — localStorage operations + plan storage + next-session logic. Exports `computeE1RM` (Epley) and the canonical `isWorkingSet`. PRs commit once at completion via `finalizePRs`. Session finalization/abandonment helpers: `finalizeSession`, `finishOrDiscardSession`, `finalizeAbandonedSessions`, `dissolveBrokenSupersets`, `sessionDurationMin`.
- `src/lib/sounds.ts` — Web Audio API playback so PR/set-complete sounds mix over music instead of ducking iOS audio session.
- `src/hooks/useWorkout.ts` — central session hook. Tracks `newPRs[]` and `newBaselines[]` separately via pre-session e1RM snapshot.
- `src/app/page.tsx` — view state machine, plan state, tab-bar routing (`'workout' | 'history' | 'plan'`), in-file `PlanView` + `SessionDetailView` subcomponents.
- `src/components/workout/GymWorkout.tsx` — most complex component; handles exercises, supersets, bodyweight, inline cardio, plan pre-fill. Exercise cards use `.pump-card` / `--active` / `--superset`.
- `src/components/workout/SessionPreview.tsx` — editable preview between plan-session tap and GymWorkout.
- `src/components/workout/SessionSummary.tsx` — reads session from storage directly (not hook) to avoid stale state; generates BRIEF. Uses `.pr-badge`.
- `src/components/workout/BottomTabBar.tsx` — persistent root nav (Workout / History / Plan).
- `src/components/workout/RetrowaveScene.tsx` — **retired/orphaned.** The animated Monoton scene was the old brand hero; the dashboard now renders the neon `public/pump-header.png` banner directly (see `Dashboard.tsx`). Kept on disk in case we want to A/B it.
- `src/components/workout/PlanLoader.tsx` — parses trainer JSON, saves plan, shows plan details. Mounted inside the Plan tab view. Now a manual fallback to the Supabase plan fetch.
- `src/components/workout/ReorderExercisesSheet.tsx` — dedicated reorder surface (framer `Reorder`); commits new order via `useWorkout.reorderExercises`, which auto-unlinks supersets moved apart.
- `april 15/` — design package (DESIGN_SYSTEM.md, RETROWAVE_SCENE.html, palm_*.svg). Source of truth for theme decisions. (BUG_FIXES.md shipped → `_archive/`.)
- `_archive/` — historical docs (TECH_SPECS, REVIEW, UI-REVIEW, NOTES, original instructions, superseded fix specs). See `_archive/README.md`.

### Supabase cutover (Phase 1, June 2026) — see `pump_build_spec_v2.md`
- `src/lib/supabase.ts` — browser client (`@supabase/supabase-js`). `isSupabaseConfigured` gates everything; never constructs a client without env vars.
- `src/components/auth/AuthGate.tsx` — wraps the app in `layout.tsx`. **Hard-gates** behind magic-link login when `NEXT_PUBLIC_SUPABASE_*` are set; falls through (ungated, localStorage-only) when unset.
- `src/lib/plan-sync.ts` — `fetchActivePlan()` pulls the active plan (`plans` where `is_active`), validates, saves to the `dylan-workout-plan` key. Primary plan path; PlanLoader paste is the fallback.
- `src/lib/session-sync.ts` — `pushUnsyncedSessions()` reconciliation sweep: writes completed-but-unsynced sessions to the `sessions` table (native `GymExercise[]`, `raw_brief`, `feel_score`). Client-side dedup via `pump-synced-sessions`; first run baselines existing history as synced (forward-only); offline-tolerant retry on load/dashboard/focus.
- `src/components/workout/BloodPressureSheet.tsx` + `src/lib/bp-sync.ts` — **blood-pressure recorder** (non-workout). Dashboard "Log BP" card → bottom sheet (SYS/DIA/pulse, time, lisinopril toggle + how-long-ago buckets, notes, live AHA category). Local store (`pump-bp-readings`) via `storage.{getBPReadings,saveBPReading,classifyBP}`, swept to the Supabase `bp_readings` table by `pushUnsyncedBP()`.

### Cloud sync — Upstash Redis (legacy, Phase-2 removal pending)
- `src/app/api/data/route.ts` — sync endpoint. GET/PUT, bearer-token auth (`SYNC_TOKEN`), reads/writes one Redis key `pump:data`. Returns 503 until env vars are set, so it's an inert no-op when unconfigured.
- `src/lib/sync-merge.ts` — pure, isomorphic merge (shared by client + server). Union sessions by id, keep heavier PRs, last-writer-wins on settings/plan.
- `src/lib/sync.ts` — client layer. PUTs the local snapshot; server returns the merged union, which is applied back via `storage.applyRemote` (one round trip = bidirectional sync).
- `src/hooks/useCloudSync.ts` — app-wide bootstrap (initial sync, debounced push on `pump:changed`, throttled sync on focus). Mounted once in `page.tsx`; exposes `dataVersion` used as a remount key on the dashboard.
- `src/components/workout/CloudSyncCard.tsx` — dashboard sync status + token entry.

## localStorage keys
- `dylan-workout-tracker` — all sessions, PRs, templates, settings
- `dylan-workout-plan` — active TrainerPlan JSON (separate key, replaced on plan update)
- `pump-synced-sessions` / `pump-bp-synced` — ids already written to Supabase (sweep dedup)
- `pump-bp-readings` — blood-pressure readings (local store; synced to `bp_readings`)
- `pump-sync-token` / `pump-sync-last` — Upstash bearer token + last-sync timestamp (legacy)
- Supabase auth session — stored by `supabase-js` under its own `sb-*` key (one-time magic-link login auto-restores)

## Env vars (Vercel project)
- **Supabase (Phase 1+):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — inlined at build time (set in Vercel + **redeploy**). ⚠️ Setting these turns on the AuthGate hard-gate, so configure the **Supabase Auth → URL redirect allowlist** (localhost + pump.dylandibona.com) *first* to avoid lockout. Tighten the placeholder RLS to `auth.uid()` after first login.
- **Upstash (legacy):** `SYNC_TOKEN`, `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`). Removed in Phase 2.

## PUMP OS data flow
```
TRAINER (Claude Health Project / coach via MCP)
  → publishes active plan to Supabase `plans` (is_active = true)
  → PUMP fetchActivePlan() pulls it on load → saves to dylan-workout-plan
    (PlanLoader paste still works as a manual fallback)

User taps session → GymWorkout pre-fills exercises from PlanSession
  → logs actual sets (weight overrideable) → completes session

On completion:
  → SessionSummary generates BRIEF + captures feel (1–5)
  → session-sync sweep writes a row to Supabase `sessions` (raw_brief, feel_score, exercises)
  → BRIEF can still be copied to clipboard for manual paste into the Health Project
```

## Active design decisions
- **Miami Heat Wave theme** — light background (ice→warm gradient), hot-pink/cyan/purple accents, 14px card radius, spectrum-bar tops, card glow system. See `april 15/DESIGN_SYSTEM.md`. Replaced the earlier square-edge dark theme.
- **Bottom tab bar is root navigation** — Workout / History / Plan. Hidden on workflow views (start, preview, gym, cardio, summary, session-detail). See `BottomTabBar.tsx`.
- **Brand hero is the neon Pump banner** — the dashboard hero is `public/pump-header.png` (neon cursive "Pump" on a dark retrowave scene), rendered full-bleed and flush to the top. It replaced the CSS `RetrowaveScene` + Monoton mark. The same wordmark drives the app icon/favicon (`src/app/icon.png`, `apple-touch-icon.png`, `pump-icon-*.png`). Brand assets live in `public/pump-*.png`.
- **Auth gate (Supabase)** — `AuthGate` hard-gates the whole app behind magic-link login when `NEXT_PUBLIC_SUPABASE_*` are set; ungated/localStorage-only when unset. Single user. Health data, so RLS + an authed session are the only protection (publishable key is public).
- **Sessions finish reliably (4a)** — leaving an active session via Back **auto-finishes** it (endTime + completed) when anything was logged, else discards the empty shell; a cold-mount sweep (`finalizeAbandonedSessions`) cleans pre-existing orphans. `completeSession` reads fresh from storage so it never silently no-ops. Fixes the old "In Progress / --" rows (root cause was abandonment, not the finish path).
- **Mid-workout reorder (4b)** — dedicated reorder sheet (not inline drag); each exercise carries its own `sets[]` so logged data travels with the card. Moving a superset member out of adjacency auto-unlinks it (`dissolveBrokenSupersets`).
- **Session feel** — 1–5 rating on the summary; feeds `feel_score` (Supabase) and a `FEEL:` line in the BRIEF.
- **Cloud sync is offline-first + additive** — localStorage stays the source of truth. Supabase (Phase 1) is additive: auth + plan fetch + session writes. Upstash sync still runs alongside (Phase 2 retires it). Upstash merge is union-based with no tombstones, so a deleted item can reappear from another device (acceptable until Phase 2). Both layers are inert when their env vars are unset.
- **Script-font nav titles on root views** — Plan, History, New Workout render their nav title in Pacifico (title-case). Workflow views keep Outfit 800 uppercase.
- **PR logic: per-set Epley e1RM** — `e1RM = weight × (1 + min(reps,30)/30)`. The best set of a session (highest e1RM) is the candidate PR. First-ever exercises store a silent baseline (no sound, no banner). Legacy PR records are backfilled with e1RM on load.
- **No session type guard** — sessions have both `exercises[]` and `cardio[]` always initialized. Mixed sessions are supported.
- **Autocomplete opens upward** — `bottom-full` positioning so it clears the fixed bottom bar.
- **Session summary reads storage directly** — `getSession(activeSessionId)` at render time, not the hook's stale copy.
- **Sound uses Web Audio API** — AudioContext + BufferSource so PR/set-complete sounds layer over music instead of claiming iOS audio session.

## How to deploy
Push to `main` on GitHub. Vercel auto-deploys. No manual steps for code. Env-var changes (Upstash or Supabase keys) only take effect on a **fresh deploy** — redeploy after editing them. **Supabase rollout ordering:** configure the Auth redirect-URL allowlist *before* setting `NEXT_PUBLIC_SUPABASE_*` in Vercel, or the AuthGate locks you out. The Phase-1 work currently lives on branch `supabase-cutover` (not yet merged to `main`).

## Keeping docs current (standing directive)
Docs are part of the change, not an afterthought. End every session with the docs matching reality:
- Update **CLAUDE.md** in the same pass — architecture line, key files, active design decisions, localStorage keys, env vars.
- Tick/raise items in **BACKLOG.md**; keep **README.md**'s feature list + tech stack honest.
- Move shipped specs / superseded docs to **`_archive/`** with a one-line entry in `_archive/README.md`. Don't let stale docs sit in the root.
- When a UI fix or feature ships, reflect it here and in BACKLOG before considering the work done.

## Trainer OS docs
All system documentation lives in `../trainer-os/`. Don't duplicate that context here.

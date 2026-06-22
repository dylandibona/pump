@AGENTS.md

# PUMP — Claude Code Context

## What this app is
A mobile-first PWA workout tracker for Dylan's personal use, deployed at
**pump.dylandibona.com**. It is one half of the **PUMP OS** — a training system
where a Claude Health Project acts as a remote trainer and this app acts as the
gym executor. See `../trainer-os/README.md` for the full system spec.

## Architecture in one line
Next.js 16 App Router **static export** (`output: 'export'` → `out/`),
offline-first client (all data in localStorage), cloud layer is **Supabase**
(DD Health project — auth, plan, session, PR, BP). **Upstash sync retired** (the
static export can't host the `/api/data` route handler; `sync.ts` is now an inert
shim). The same static build deploys to Vercel as the PWA **and** bundles into a
Capacitor native iOS app (for COROS BLE heart-rate — in progress).

## Design / look & feel
See **`DESIGN.md`** at the project root for the Volume System (the current
design philosophy). `MOCKUP_AUDIT.md` is the living punch list of what's
shipped vs. open. The mockup gallery is at `/mockup` (dev route); the design
token reference is at `/design` (dev route). v1 *Miami Heat Wave* is archived
at `_archive/DESIGN_SYSTEM_v1.md`.

## Key files to know

### Data + state
- `src/lib/types.ts` — all data types incl. PUMP OS types. `PersonalRecord`
  carries `e1rm` + `previousWeight`/`previousReps`. `WorkoutSession` carries
  `feelScore` + `prSummary` (for the Supabase session write).
- `src/lib/storage.ts` — localStorage operations + plan storage + PR commit
  logic. Exports `computeE1RM` (Epley) and `isWorkingSet`. PRs commit once at
  completion via `finalizePRs`. Session finalization helpers:
  `finalizeSession`, `finishOrDiscardSession`, `finalizeAbandonedSessions`,
  `dissolveBrokenSupersets`, `sessionDurationMin`. `exportData()` / `importMergeData()`
  back the dashboard EXPORT / IMPORT buttons — import unions a backup into local
  via `mergeEnvelopes` (safe, full fidelity), the cross-device restore path since
  localStorage is per-container (Safari vs installed PWA).
- `src/lib/utils.ts` — pure helpers including `parseSessionDate` (avoids the
  UTC-rolling bug on YYYY-MM-DD strings) and **`sessionLabel(s, plan)`** — the
  one canonical display name for a session (prefers plan-session name via
  `planSessionId`, falls back to capitalized type). Used by Dashboard recent
  rows, History list, and Session detail.
- `src/lib/exercises.ts` — exercise library + `normalizeExerciseName()`. One
  source of truth applied at every entry point so names like "Curl standing
  curl" → "Standing Curl" canonicalize on write.
- `src/lib/brief.ts` — generates the trainer BRIEF from a session (resolves
  plan session by `planSessionId`).
- `src/lib/sounds.ts` — Web Audio API playback (sounds mix over music instead
  of ducking iOS audio session). **Explosion (`prAchieved`) is reserved for
  PRs only** — it used to be mapped to every cue, so it detonated on every set/
  rest-timer/interval. `setComplete` plays a generated 80s-synth asset
  (`/set-complete.mp3` via `SAMPLE_SOUNDS`); `timerDone` is a synthesized tone
  (`playTone` / `TONES`). Sample types decode to an `AudioBuffer`; tone types
  synthesize — the synth also stands in as a silent-safe fallback.

### Cloud / sync
- `src/lib/supabase.ts` — browser client (`@supabase/supabase-js`).
  `isSupabaseConfigured` gates everything; never constructs a client without
  env vars.
- `src/lib/plan-sync.ts` — `fetchActivePlan()` pulls the active plan from the
  Supabase `plans` table (where `is_active`), validates, saves to the
  `dylan-workout-plan` key. Primary plan path; PlanLoader paste is the
  fallback.
- `src/lib/session-sync.ts` — `pushUnsyncedSessions()` reconciliation sweep.
  Single-flight guard prevents concurrent double-fires. `client_session_id`
  (UUID minted on session start) is the idempotency key — duplicate writes
  hit the partial unique index, caught as `23505` and marked synced (first
  complete write wins, no second row). Native `GymExercise[]` shape preserved.
  Each row also carries a **`payload jsonb`** = the COMPLETE `WorkoutSession`
  (native client shape), so the coach gets cardio + intervals + notes
  structurally, not just as prose in `raw_brief` (the shaped columns are lossy).
  Additive + nullable; legacy rows have null payload.
- `src/lib/prs-sync.ts` — fetches the **curated `prs` Supabase table** (clean
  exercise / weight / reps / unit / kind / achieved_on). Cached locally for
  instant first paint. Dashboard Records read from here; local PersonalRecord
  store is kept only for in-session "NEW BEST" detection (labeled "best",
  not "PR", to avoid the offline latency gap).
- `src/lib/bp-sync.ts` — `pushUnsyncedBP()` mirror for blood-pressure
  readings → Supabase `bp_readings`.
- `src/components/auth/AuthGate.tsx` — wraps the app in `layout.tsx`.
  **Hard-gates** behind email login when `NEXT_PUBLIC_SUPABASE_*` are set; falls
  through (ungated, localStorage-only) when unset. **Two-phase, CODE-ONLY
  sign-in: email → 6-digit code (no magic link).** `signInWithOtp({ email,
  options: { shouldCreateUser: false } })` emails the code; the user types it and
  `verifyOtp({ email, token, type: 'email' })` completes sign-in *in this view*.
  This is the PWA-correct path — a tapped magic link opens in Safari, whose
  storage jar is separate from the installed standalone app, so it could never
  log the app in. There is **no magic-link redirect handling**:
  `detectSessionInUrl` is off (see `supabase.ts`) so nothing races the code path,
  and the email template omits `{{ .ConfirmationURL }}` (Supabase then sends an
  OTP only, no link).
  ⚠️ Requires the Supabase email template to render `{{ .Token }}` (the 6-digit
  code) — without it, no code arrives. Splash + sign-in
  both use `pump-scene-empty.png` (dark dumbbell scene) + `letspump3-transparent.png`
  (brushy "Let's Pump!" wordmark) so the loading→form transition is seamless.
  The `Splash` plays a **guaranteed ~1.2s beat on every launch** (a `minBeatDone`
  timer): even when auth resolves instantly for a returning user, the splash is
  held then crossfades (AnimatePresence) over the already-mounted app/sign-in
  beneath it. Launch-only — AuthGate mounts once per load, not on internal nav.

### Cloud sync — Upstash Redis (RETIRED — static export cutover)
- `src/app/api/data/route.ts` — **removed**. Route handlers that read the
  request can't be statically exported, so the Upstash sync endpoint is gone.
- `src/lib/sync.ts` — now an **inert shim**: `sync()` is a no-op returning
  `'unconfigured'`; token getters/setters kept so `useCloudSync` compiles.
- `src/lib/sync-merge.ts` — KEPT (still used by `storage.importMergeData` for
  the EXPORT/IMPORT cross-device restore).
- `src/hooks/useCloudSync.ts` — unchanged shape; `dataVersion` now stays 0
  (sync is a no-op), so the dashboard refresh is driven by `bootRefresh` only.
  `CloudSyncCard` is hidden; component still in the tree for cleanup.

### View state + nav
- `src/app/page.tsx` — view state machine, plan state, tab-bar routing
  (`'workout' | 'history' | 'plan'`), in-file `PlanView` + `SessionDetailView`
  + `FeelAndNotesEditor` subcomponents. **Floating glass-pill back button**
  (sticky, fades in on scroll past 60px) lives here so the back action is
  always reachable — but is **suppressed on `gym`/`cardio`** views (those have
  their own sticky cockpit header, and the pill overlapped it + invited an
  accidental mid-workout exit). `SessionDetailView` embeds `FeelAndNotesEditor`
  so **feel + session notes stay editable on a finished session** (the only
  path to set them on one auto-finished via Back, which never sees the summary
  editor); both write through `patchSession`.
- `src/app/layout.tsx` — root layout, font loading (Monoton + Pacifico +
  Outfit; **Space Mono retired** — `--font-mono` resolves to Outfit).

### Surfaces (components/workout/)
- `Dashboard.tsx` — home. Hero banner → plan chip + inline BP heart button
  → "Let's Go" CTA → 3 stat cards (warm-tint via `.surface-warm`, Records
  tile gets `.surface-warm--hot`) → Recent rows (via `sessionLabel`) →
  Latest PR dark-motif card (Pacifico + tabular weight + cyan horizon)
  followed by next-best PRs list. First-run empty state is a full-bleed
  `pump-scene-beach.png` scene card ("Ready when you are" / Pacifico "Log
  your first set") — taps through to start a workout. Once history exists that
  slot is recommissioned as `LastSessionCard` — a glanceable "Just finished /
  Last session" recap of the most recent workout (label + 3 key stats) atop
  the Recent list.
- `GymWorkout.tsx` — most complex. Exercises, supersets, bodyweight, inline
  cardio, plan pre-fill. Triggers `PRMomentScreen` when `newPRs` grows.
- `SessionPreview.tsx` — editable preview between plan-session tap and
  GymWorkout.
- `SessionSummary.tsx` — post-workout. "Synced to trainer" reassurance band,
  named feel rating (Brutal / Tough / OK / Good / Easy → `feel_score` +
  BRIEF), primary Pacifico "Done" CTA (honest — data's already in Supabase),
  secondary "Open with trainer" copies the brief.
- `PRMomentScreen.tsx` — V3 full-screen PR reward: `pump-pr-burst.png`
  backdrop + `new-PR.png` wordmark + Pacifico exercise name + Outfit-tabular
  weight overlay.
- `CardioWorkout.tsx` — multi-activity logger. Activity picker (run/bike/swim/
  row/elliptical/walk) stays; styling adopted Volume System tokens. Opens with
  `CardioSceneHeader` (cinematic cockpit, mockup §05) in place of the old inline
  countdown/stopwatch `Timer` card; owns the session-local renameable session
  name + computes the header's duration/distance totals.
- `CardioSceneHeader.tsx` — the **cinematic cardio cockpit** (mockup §05): a
  full-bleed `pump-scene-cardio.png` neon-highway band with cyan
  "CARDIO · \<activity\>" caps, an inline-editable Pacifico session name (cardio
  has no persisted name field — derived default, renamed via the pencil, held in
  CardioWorkout state), and a giant Outfit-tabular hero timer at the vanishing
  point = **total logged duration**, flanked by live distance + pace. The cardio
  counterpart to `WorkoutTimerBar`; the logger is unchanged below it.
- `BottomTabBar.tsx` — persistent root nav. Hidden on workflow views (start,
  preview, gym, cardio, summary, session-detail).
- `BloodPressureSheet.tsx` + `src/lib/bp-sync.ts` — non-workout BP recorder.
  Dashboard heart button → bottom sheet (LOG / RECENT toggle, SYS/DIA/pulse,
  time, lisinopril toggle + how-long-ago buckets, notes, live AHA category).
  **Doctor export is scoped** — a `New · 7d · 30d · All` toggle drives both the
  RECENT list and the "Copy for doctor" text; default **New = only readings
  since the last copy** (a `pump-bp-last-shared` ISO cursor, advanced on each
  copy via `setBPLastShared`). Fixes the old "copy re-sends the whole list every
  time" — you now send only what's new.
- `PlanLoader.tsx` — parses trainer JSON (manual fallback to the Supabase
  plan fetch), shows plan details. Mounted inside the Plan tab view.
- `ReorderExercisesSheet.tsx` — dedicated reorder surface (framer `Reorder`).
  **Drag starts only from the grip handle** (`useDragControls` +
  `dragListener={false}` + `touchAction:none`) so the card body scrolls — that's
  what lets you reach below-the-fold exercises (whole-card drag used to eat the
  scroll). Working order is seeded **only on open** (depending on `exercises`
  re-seeded mid-drag and reorders "didn't take"). Commits via
  `useWorkout.reorderExercises`, which auto-unlinks supersets moved out of
  adjacency.
- `WorkoutHistory.tsx` — month-grouped list. Calm white cards, sentence-case
  via `sessionLabel`, demoted Delete affordance. Opens with a **beach-scene
  header banner** (repurposes `pump-scene-beach.png`, formerly only on the
  dashboard first-run state) with the filter-aware topline totals overlaid
  (Workouts · This Month · Lbs Moved, or Miles under the cardio filter) — this
  replaced the old 2-up surface-warm stat cards.
- `WorkoutTimerBar.tsx` — the **atmospheric cockpit header** (mockup §02):
  a cropped `pump-scene-gym.png` band carrying the session meta (cyan caps,
  e.g. "Push Day · 2 of 6 done"), the up-next exercise in Pacifico, the live
  elapsed clock, and the rest controls — quick presets or a live countdown
  that pulses (`glow-state--urgent`) in its final seconds. Sticky to the top
  of the scroll container. All timer logic is unchanged from the old light
  bar; only the presentation moved onto the scene. (Props: `metaLabel`,
  `exerciseName`, computed in GymWorkout.)
- `Timer.tsx` — countdown + stopwatch. `RestTimerInline` exported for use
  inside GymWorkout.
- `IntervalFlow.tsx` — interval timer builder + runner.
- `RetrowaveScene.tsx` — **retired/orphaned.** Was the old brand hero before
  `pump-header.png`. Kept on disk for now. Asset references (palms +
  reference HTML) live in `_archive/`.

### UI primitives
- `src/components/ui/sheet.tsx` — base Sheet. **Overlay Contract enforced
  here:** bottom/top sheets inline-style height to `90dvh` so consumers
  inherit a viewport-clamped sheet by default. Default close button is a
  44px+ touch target at top-right (`z-10` above content).

### Dev surfaces (behind auth gate; not linked from UI)
- `src/app/mockup/page.tsx` — visual gallery of every designed screen.
  Source of truth for design intent.
- `src/app/design/page.tsx` — Volume System token reference (typography,
  surfaces, glow-as-state, status colors).

## localStorage keys
- `dylan-workout-tracker` — all sessions, PRs, templates, settings
- `dylan-workout-plan` — active TrainerPlan JSON (separate key, replaced on
  plan update)
- `pump-prs-cache` — curated `prs` snapshot for instant first paint
- `pump-synced-sessions` / `pump-bp-synced` — ids already written to Supabase
  (sweep dedup)
- `pump-bp-readings` — blood-pressure readings (local store; synced to
  `bp_readings`)
- `pump-bp-last-shared` — ISO cursor for the BP doctor-export "new since last
  shared" default (advanced on each copy; local-only, never synced)
- `pump-sync-token` / `pump-sync-last` — Upstash bearer token + last-sync
  timestamp (DEAD — Upstash retired; keys read only by the inert sync shim)
- Supabase auth session — stored by `supabase-js` under its own `sb-*` key
  (one-time code login auto-restores)

## Env vars (Vercel project)
- **Supabase (Phase 1+):** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` — inlined at build time (set in Vercel +
  **redeploy**).
  ⚠️ Setting these turns on the AuthGate hard-gate, so configure the
  **Supabase Auth → URL redirect allowlist** (localhost + pump.dylandibona.com)
  *first* to avoid lockout. Tighten the placeholder RLS to `auth.uid()` after
  first login.
  ⚠️ **Email templates (paste into the DD Health project — `eifcefpxttrijarsfjre`):**
  `signInWithOtp` picks the template by user state — **existing user → "Magic
  Link"**, **new/unconfirmed user → "Confirm signup"** — so paste the branded
  body into **BOTH** (Auth → Emails) and Save each, or you'll get the default
  (undesigned link) email on whichever path you hit. Both must include
  `{{ .Token }}` so the 6-digit code arrives — the PWA sign-in enters that code
  (`verifyOtp`). The default "Confirm signup" template has NO `{{ .Token }}`, so
  if your flow hits it untouched, no code is sent at all. The branded HTML body
  lives (version-controlled) at `supabase/email-templates/magic-link.html`; it
  renders **only** `{{ .Token }}` (code hero) and deliberately omits
  `{{ .ConfirmationURL }}` so Supabase sends an OTP only (no magic link).
  References the hosted `letspump-email.png` wordmark (an
  email-optimized 600px/82KB PNG — the app's full-res `letspump3-transparent.png`
  is left for `next/image` to optimize).
- **Upstash (RETIRED):** `SYNC_TOKEN`, `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  (or `UPSTASH_REDIS_REST_*`) are no longer used — the `/api/data` route was
  removed for the static-export cutover. Safe to delete from Vercel.

## PUMP OS data flow
```
TRAINER (Claude Health Project / coach via MCP)
  → publishes active plan to Supabase `plans` (is_active = true)
  → PUMP fetchActivePlan() pulls it on load → saves to dylan-workout-plan
    (PlanLoader paste still works as a manual fallback)
  → maintains the curated `prs` table; PUMP's dashboard Records reads from it

User taps session → SessionPreview (plan sessions) → GymWorkout pre-fills
  → logs actual sets (weight overrideable)
  → the instant a set sets a new best (newPRs grows): PRMomentScreen
    full-screen reward fires in-session (sound + burst + "up from")
  → completes session

On completion:
  → SessionSummary generates BRIEF + captures named feel (Brutal/…/Easy)
  → session-sync sweep writes a row to Supabase `sessions`
     (raw_brief, feel_score, native GymExercise[], client_session_id UUID,
      payload jsonb = complete WorkoutSession for lossless coach reads)
  → idempotent — duplicate writes hit unique index, caught as 23505
  → BRIEF copied to clipboard via "Open with trainer" (secondary action)
```

## Active design decisions (current)

- **Volume System (v2)** — every component belongs to a volume.
  - **V3 (rare, earned, loud):** hero, primary CTAs, PR moment, workout-complete.
  - **V2 (ambient chrome):** titles, labels, tab bar, tags, card trim — loud but flat.
  - **V1 (the cockpit):** set rows, inputs, list rows — calm + neon-trimmed.
  - **Glow is a state, not a texture.** Resting cards do not glow.
  - Full doc: **`DESIGN.md`**.
- **Type system: one family with three registers + two display fonts.**
  Monoton (brand mark only), Pacifico (named moments), Outfit (everything
  else: caps tracked for chrome, sentence-case for body, `tabular-nums` for
  numbers). **Space Mono retired.** `font-mono` className auto-falls-through
  to Outfit via `--font-mono`.
- **Brand assets** — dashboard hero is `pump-header.png` (neon cursive on a
  retrowave scene). Sign-in is `pump-scene-empty.png` + `letspump3-transparent.png`.
  PR moment is `pump-pr-burst.png` + `new-PR.png`. Inventory in `DESIGN.md §7`.
- **Auth gate (Supabase)** — `AuthGate` hard-gates the whole app behind email
  login when `NEXT_PUBLIC_SUPABASE_*` are set; ungated/localStorage-only when
  unset. Single user. Health data, so RLS + an authed session are the only
  protection (publishable key is public).
- **Sign-in is a 6-digit code — code-only, no magic link.** Installed PWAs have a
  storage jar separate from Safari, so a tapped magic link logs in the *browser*
  not the app. Sign-in is two-phase (email → code): `signInWithOtp({ email,
  options: { shouldCreateUser: false } })` then `verifyOtp({ type: 'email' })`
  completes login inside the standalone app. No magic link is involved:
  `detectSessionInUrl` is off (`supabase.ts`) and the email template omits
  `{{ .ConfirmationURL }}` (OTP-only). `shouldCreateUser: false` blocks stray
  signups (single-user app). Needs `{{ .Token }}` in the Supabase email template
  (see Env vars).
- **Floating back-button pill** — sticky in the top-left, fades in on scroll
  past 60px. Reachable on drill-down views — but **suppressed on `gym`/`cardio`**
  (it overlapped the sticky cockpit header and risked an accidental mid-workout
  exit; those views keep the in-flow nav-bar Back).
- **Bottom tab bar** — Workout / History / Plan. Hidden on workflow views.
- **`sessionLabel` is the canonical display name** — prefer plan-session
  name (matched by `planSessionId`), fall back to capitalized type. Applied
  on Dashboard recent rows, History list, Session detail.
- **Records read from curated Supabase `prs` table.** Local PRs are kept
  only for in-session detection ("NEW BEST" badge).
- **Sessions finish reliably (Pass 1 / "4a" fix)** — leaving an active
  session via Back **auto-finishes** it when anything was logged; empty
  shells are discarded; a cold-mount sweep cleans pre-existing orphans.
  `completeSession` reads fresh from storage so it never silently no-ops.
- **Mid-workout reorder** — dedicated reorder sheet (not inline drag);
  **handle-only drag** (grip starts the drag; body scrolls, so below-the-fold
  exercises are reachable). Each exercise carries its own `sets[]` so logged
  data travels with the card. Moving a superset member out of adjacency
  auto-unlinks it (`dissolveBrokenSupersets`).
- **Set logging is race-safe** — `useWorkout.logSet` resolves
  fill-planned-slot-vs-append **inside the `mutate` transform** (against fresh
  `sessionRef` state), not from a stale render snapshot. This closed the
  double-tap clobber where two rapid logs grabbed the same planned index,
  dropped a set, and made a completed exercise persist as PARTIAL.
- **Session feel** — named 1–5 rating (Brutal / Tough / OK / Good / Easy);
  feeds `feel_score` (Supabase) + a `FEEL:` line in the BRIEF. Editable on the
  post-workout summary **and** on the session-detail view (via
  `FeelAndNotesEditor` → `patchSession`), so a session finished without it —
  e.g. auto-finished via Back — can still get feel + notes after the fact.
- **Cardio cinematic moment = a cockpit header, not a separate splash.** The
  mockup's §05 cinematic cardio screen ships as `CardioSceneHeader` atop the
  multi-activity logger (mirroring the gym cockpit, §02), not as a transient
  start-splash. Its hero timer is the **total logged duration** (the cardio
  banked), not a wall clock — honest for the post-hoc, entry-by-entry logging
  model. Session name is session-local + renameable (no persisted field, no
  Supabase/BRIEF churn). The logger (activity picker + entries) is unchanged.
- **"Synced to trainer" reassurance** — workout-complete shows a band:
  "Your trainer sees this in their dashboard. No paste needed." The primary
  CTA is "Done" (honest — the Supabase write already happened); secondary
  "Open with trainer" copies the BRIEF for explicit conversation.
- **Cloud sync is offline-first + additive** — localStorage stays the source
  of truth. Supabase (Phase 1) is additive: auth + plan fetch + session writes.
  Upstash sync still runs alongside (Phase 2 retires it). Upstash merge is
  union-based with no tombstones, so a deleted item can reappear from another
  device (acceptable until Phase 2). Both layers are inert when their env
  vars are unset.
- **localStorage is per-container — now hydrated by a Supabase PULL.** A fresh
  container (native iOS app, installed PWA) starts with empty localStorage. As of
  the native cutover, `session-sync.pullRemoteSessions()` fetches the `sessions`
  table on load + dashboard return and merges it into local (prefer the lossless
  `payload`; reconstruct legacy shaped-only rows into gym sessions). Union-only by
  id + `client_session_id`; pulled ids are marked synced so the push sweep can't
  re-upload them. So sessions are now **bidirectional** (push on finish, pull on
  load) — `prs`/`plans` already pulled. The EXPORT / IMPORT buttons remain as a
  full-fidelity manual backup, but are no longer the only cross-device path.
- **Script-font nav titles on root views** — Plan, History, New Workout render
  their nav title in Pacifico (title-case). Workflow views keep Outfit 800
  uppercase.
- **PR logic: per-set Epley e1RM** — `e1RM = weight × (1 + min(reps,30)/30)`.
  Local detection only powers the in-session "NEW BEST" badge; the trainer
  curates the canonical PRs in the Supabase `prs` table.
- **Exercise names are canonicalized at every write site.**
  `normalizeExerciseName()` is applied to `addExercise`, `bulkAddExercises`,
  plan import, autocomplete commit, and `finalizePRs`. A one-time backfill
  on `getWorkoutData()` heals legacy malformed names on load.
- **Sound uses Web Audio API** — AudioContext + BufferSource so cues layer
  over music instead of claiming the iOS audio session. **The explosion is
  PR-only**; set-complete is its own 80s-synth asset (`/set-complete.mp3`) and
  timer-done is a synthesized tone — so logging a set no longer detonates.
- **Overlay Contract enforced at the `Sheet` primitive** — every bottom sheet
  inherits a viewport-clamped height (`90dvh`), pinned header/footer, single
  inner scroll region, and a ≥44px reachable close.

## How to deploy
Push to `main` on GitHub. Vercel auto-deploys. No manual steps for code.
Env-var changes (Supabase keys) only take effect on a **fresh deploy** —
redeploy after editing them. **Supabase rollout ordering:** configure the Auth
redirect-URL allowlist *before* setting `NEXT_PUBLIC_SUPABASE_*` in Vercel, or
the AuthGate locks you out. The web build is a static export — Vercel serves
`out/`; `ios/` and `capacitor.config.ts` are ignored by the web build.

## Native app (Capacitor — iOS)
PUMP ships as both the Vercel PWA and a Capacitor native iOS app from the SAME
static export, so it can talk to the COROS heart-rate strap over Bluetooth
(impossible in an iOS PWA — no Web Bluetooth). The native app is the web app +
native plugins; no rewrite.
- `capacitor.config.ts` — `appId: com.dylandibona.pump`, `appName: PUMP`,
  `webDir: 'out'`. Capacitor 8 (uses Swift Package Manager for plugins, no
  CocoaPods).
- `ios/` — the generated Xcode project (committed; build artifacts + the synced
  `App/App/public` web assets are gitignored via `ios/.gitignore`).
- **Dev workflow:** `npm run build` (→ `out/`) → `npx cap sync ios` (copies
  assets + plugins) → `npx cap open ios` (Xcode) → pick signing team → run on
  device/simulator. Distribution: paid Apple Developer → TestFlight.
- Supabase env (`NEXT_PUBLIC_SUPABASE_*`) is inlined at build time from
  `.env.local`, so the bundled app auth-gates + reads Supabase like the PWA.

## Keeping docs current (standing directive)
Docs are part of the change, not an afterthought. End every session with the
docs matching reality:
- Update **CLAUDE.md** in the same pass — architecture line, key files, active
  design decisions, localStorage keys, env vars.
- Tick/raise items in **BACKLOG.md**; keep **README.md**'s feature list +
  tech stack honest.
- Update **DESIGN.md** when a token, register, or volume rule changes.
- Update **MOCKUP_AUDIT.md** as items ship — it's the living punch list, not
  a one-time doc.
- Move shipped specs / superseded docs to **`_archive/`** with a one-line
  entry in `_archive/README.md`. Don't let stale docs sit in the root.

## Trainer OS docs
All system documentation lives in `../trainer-os/`. Don't duplicate that
context here.

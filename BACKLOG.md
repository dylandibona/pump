# Product Backlog

---

## Completed

### Jun 27 2026 session — weight unit toggle + superset polish + ultra-review bugfix pass
- [x] **lbs / kg toggle** — `weightUnit` state in GymWorkout, pill in
  `WorkoutTimerBar` cockpit header. Storage stays in lbs; `displayWeight` /
  `parseInputWeight` convert for display. Add-set field converts on toggle (not
  clears); inline set-weight edit uses local string state on blur (decimal safe).
  Persisted to `settings.weightUnit`.
- [x] **Superset chain-link connector** — gradient-faded vertical lines + Link2
  chain icon + purple glow SUPERSET label + hover-reveal Unlink2 break affordance.
- [x] **Ultra-review bugfix pass (10 confirmed issues):**
  - `bp-sync`: `bpSweepInFlight` single-flight guard; 23505 dedup; `changed` flag
  - `plan-sync`: `pump-plan-row-version` key replaces fragile `__rowVersion` mutation
  - `storage`: module-level `_dataCache`; bodyweight PR infinite-write loop fixed
  - `session-sync`: `.limit(500)` on `pullRemoteSessions`
  - `GymWorkout → page`: dual-useWorkout fixed — PRs flow via `onComplete` callback
    into `completedSessionPRs` state; `SessionSummary` now actually receives earned PRs
  - `SessionDetailView`: weight label respects unit setting (was hardcoded "lbs")

### Jun 17 2026 session — bug fixes + BP export + coach payload + splash
- [x] **Six june12 bugs** (see `bugs-june12.md`): reorder handle-only drag +
  scroll, back-button suppressed on gym/cardio, `LastSessionCard` recap, feel/
  notes editable on finished sessions, explosion sound PR-only (set-complete =
  `/set-complete.mp3`), PARTIAL-status race fixed via race-safe `logSet`.
- [x] **Smart BP doctor export** — "new since last shared" cursor +
  `New · 7d · 30d · All` toggle.
- [x] **Lossless session `payload` jsonb** for the coach (DD Health migration +
  `buildRow`).
- [x] **Launch splash beat** — `AuthGate` holds the branded splash ~1.2s on
  every launch, then crossfades. Launch-only.
- [x] **Repurposed the wasted beach asset** — `pump-scene-beach.png` (formerly
  first-run only) now backs a History page header banner with the topline
  totals overlaid (replaced the 2-up stat cards).
- [ ] **(bug, low pri) Lingering IN PROGRESS session** — an unfinished session
  survives because `finalizeAbandonedSessions` only runs on cold mount and iOS
  PWA resume skips the remount. Fix: also sweep on dashboard return (guarded).
  See `bugs-june12.md`.

### Jun 7 2026 session — Cardio cockpit + post-ship fixes
- [x] **Cardio cinematic cockpit** — `CardioSceneHeader` (mockup §05) atop the
  multi-activity logger.
- [x] **Dashboard load flashing** — was remounting on every boot data change
  (`key={dataVersion+bootRefresh}`); now a `refreshToken` prop re-derives data
  in place without replaying mount animations.
- [x] **Inline BP button off-screen** — decorative 600px halo overflowed the
  viewport → iOS sideways scroll. Fixed with `overflow-x: clip` (html/body) +
  `max-w-full` on the halo.
- [x] **PWA sign-in opened in browser** — magic link can't reach a standalone
  PWA's storage jar. Sign-in is now two-phase email → 6-digit code (`verifyOtp`)
  so login completes in-app; link kept as desktop fallback. _Needs `{{ .Token }}`
  in the Supabase Magic Link email template._
- [x] **Lint tidy (touched files)** — `AuthGate` ready-state now derived (no
  synchronous setState in effect); `page.tsx` scopes a single
  `react-hooks/set-state-in-effect` disable (legitimate external-store syncs in
  the view/boot controller); removed an unused import.
- [x] **Branded sign-in email** — `supabase/email-templates/magic-link.html`:
  dark neon template matching the sign-in screen, 6-digit code as the hero +
  "Let's Go" magic-link button (desktop fallback), responsive/fluid for phones.
  _Paste into Supabase Auth → Email Templates → Magic Link._

### Jun 6 2026 session — Design elevation (Pass 1–4) + tech fixes
- [x] **Volume System v2** — `DESIGN.md` ships as the design philosophy (three
  volumes / type registers / glow-as-state / Overlay Contract). v1 Miami Heat
  Wave moved to `_archive/DESIGN_SYSTEM_v1.md`.
- [x] **Foundation tokens** in `globals.css` — `.surface-warm`,
  `.surface-warm--hot`, `.text-body-quiet`, `.label-caps`, `.glow-state--*`,
  `.status-bp-*`.
- [x] **Space Mono retired** — `--font-mono` resolves to Outfit; existing
  `font-mono` className auto-cascades.
- [x] **Sheet primitive Overlay Contract** — viewport-clamped height +
  reachable 44px close enforced once at `src/components/ui/sheet.tsx`.
- [x] **`/design` dev route** — Volume System token reference.
- [x] **`/mockup` dev gallery** — every designed screen, source of truth for
  intent.
- [x] **Sign-in / splash** — `pump-scene-empty.png` + `letspump3-transparent.png` brushy
  logo + dark glass form.
- [x] **Floating glass-pill back button** — sticky, fades in past 60px scroll,
  always reachable mid-flow.
- [x] **Dashboard refresh** — stat cards on `.surface-warm`, Latest PR
  dark-motif card, plan chip + inline BP heart, calm Recent rows with
  `sessionLabel` (plan name).
- [x] **Workout complete** — "Synced to trainer" reassurance band, primary
  Pacifico "Done", secondary "Open with trainer", named feel rating
  (Brutal / Tough / OK / Good / Easy).
- [x] **PR full-screen reward** — `PRMomentScreen` component using
  `pump-pr-burst.png` backdrop + `new-PR.png` wordmark, triggered on
  in-session NEW BEST.
- [x] **BP sheet typography polish** + warm SYS/DIA card + Pacifico Save
  Reading.
- [x] **Cardio session token swap** — calmer stat numbers; activity picker
  preserved.
- [x] **History list refresh** — calm white cards, sentence-case via
  `sessionLabel`, demoted Delete affordance.
- [x] **Session detail refresh** — calmer header, white cards, `sessionLabel`.
- [x] **PlanLoader refresh** — sentence-case, calm cards, clean error block.
- [x] **MOCKUP_AUDIT.md** — living punch list, mockup vs. live.
- [x] **Exercise name normalization** (tech) — `normalizeExerciseName()`
  applied at 5 entry points + load-time backfill of legacy data.
- [x] **Records from curated `prs` table** (tech) — `prs-sync.ts` fetches
  Supabase, caches locally; dashboard reads from it; local PRs power only
  the in-session "NEW BEST" badge.
- [x] **Session-write idempotency** (tech) — `client_session_id` UUID minted
  on session start + single-flight sweep guard + `23505` unique-violation
  catch.
- [x] **Pacifico moment CTA universal** — Let's Go, Save Reading, Done, Open
  with trainer, Send magic link, Finish Workout.
- [x] **Pass 5 — closed the mockup-vs-live audit** (see `MOCKUP_AUDIT.md`):
  - Gym cockpit atmospheric header (`WorkoutTimerBar` rebuilt on
    `pump-scene-gym.png` + Pacifico up-next exercise + `glow-state--urgent`
    rest pulse + inline pink note panel); timer logic unchanged.
  - Workout-complete hero scene band (`pump-scene-complete.png`).
  - First-run empty state → `pump-scene-beach.png` scene card.
  - BP heart safe-area overflow fix.
  - `font-mono` className swept to `tabular-nums` across components.

### Jun 5 2026 session — Supabase cutover (Phase 1) + UI fixes
- [x] **Supabase auth** — magic-link sign-in gate (`AuthGate`), session persists to localStorage. App hard-gates when configured.
- [x] **Active-plan fetch** — pulls the coach's active plan from Supabase on load / Plan tab (`plan-sync.ts`); PlanLoader paste is now the fallback.
- [x] **Session write on finish** — reconciliation sweep writes finished sessions to Supabase `sessions` (`session-sync.ts`); dedup + offline retry; forward-only baseline.
- [x] **Session feel field** — 1–5 rating on the summary → `feel_score` + BRIEF.
- [x] **"In Progress" status bug (4a)** — root cause was Back-button abandonment; auto-finish-on-exit + cold-mount cleanup + hardened `completeSession`.
- [x] **Reorder exercises + edit supersets mid-workout (4b)** — dedicated reorder sheet (framer `Reorder`); superset members moved apart auto-unlink.
- [x] **Partial-set audit (4c)** — confirmed the local set-completion path persists through save + reload.
- [x] **Blood pressure recorder** — dashboard "Log BP" card + entry sheet (SYS/DIA/pulse, time, lisinopril toggle + how-long-ago buckets, notes, live AHA category). Local-first, swept to Supabase `bp_readings`.
- _Phase 2 done (Jun 22):_ Upstash retired via the static-export cutover (the
  `/api/data` route was dropped). Cutover spec archived to `_archive/`.

### May 21–22 2026 session
- [x] **Neon Pump wordmark** — replaced the Monoton/RetrowaveScene hero with the `pump-header.png` banner (full-bleed, flush to top); regenerated favicon + apple-touch + PWA icons from the new mark; brand kit saved as `public/pump-*.png`.
- [x] **Stale duplicate cleanup** — a 662 MB untracked `app/` copy was shadowing `src/app/` and breaking local build/dev (404s). Archived to `_Code Projects/_archive/`. All app code lives under `src/`.
- [x] **Cloud sync / multi-device** — offline-first sync to Upstash Redis. localStorage stays primary; full snapshot pushed to `/api/data`, server merges (union sessions, heavier PRs, LWW settings/plan) and returns the union. Bearer-token auth (`SYNC_TOKEN`). Survives a browser cache wipe; converges across devices.

### Apr 15 2026 session
- [x] **PR system rewrite** — per-set Epley e1RM, silent baselines for first-ever exercises, `previousE1rm` tracking, BRIEF annotation. Fixes the "90×15 frankenstein" bug.
- [x] **Session Preview screen** — plan sessions route through preview with editable target weight/reps before starting; freeform bypasses.
- [x] **Web Audio PR sound** — Spotify/podcasts no longer duck on set-complete or PR.
- [x] **Miami Heat Wave redesign** — light ice-tinted bg, hot-pink/cyan/purple accents, Monoton + Pacifico + Outfit + Space Mono typography, card glow system with spectrum-bar tops, 14px radius.
- [x] **Bottom tab bar** — Workout / History / Plan persistent root navigation with animated indicator.
- [x] **Dedicated Plan tab** — PlanLoader moved out of Dashboard into its own view.
- [x] **Retrowave dashboard hero** — full scene with Monoton PUMP mark, sun, palms, animated grid, scanlines.
- [x] **Script-font nav titles** — Plan / History / New Workout use Pacifico in the nav bar; in-page duplicate headings removed.

### Earlier
- [x] Core gym workout logging
- [x] Core cardio workout logging
- [x] PR tracking with celebrations (beats existing record only)
- [x] Exercise autocomplete with database
- [x] Rest timer (countdown) + stopwatch
- [x] Workout history with session detail
- [x] PWA manifest + icons
- [x] Sound + haptic feedback
- [x] **Bodyweight exercises** — BW toggle, 0-weight sets
- [x] **Mixed sessions** — cardio inline in gym view
- [x] **Supersets** — link exercises, visual grouping
- [x] **PUMP OS — Plan loading** — paste trainer JSON, sessions pre-fill
- [x] **PUMP OS — BRIEF generator** — Send to Trainer on session complete
- [x] **Autocomplete opens upward** — clears bottom bar
- [x] **Session summary stats fixed** — reads from storage, never shows 0

> _Design system note:_ The original "bold glass / neon / square-edge"
> dark theme was superseded in the April 15 2026 session by the
> Miami Heat Wave light theme from `april 15/DESIGN_SYSTEM.md`.

---

## High Priority

### Cross-device data sync (the real fix behind the "empty PWA" bug)
- [x] **Pull session history from the cloud on load** (shipped Jun 22, native
  cutover) — `session-sync.pullRemoteSessions()` fetches the `sessions` table on
  load + dashboard return and merges into local (prefer `payload`, reconstruct
  legacy shaped rows). Un-deprioritized because the native app starts with empty
  localStorage. Union-only by id + client_session_id; pulled ids marked synced.
  Sessions are now bidirectional. EXPORT/IMPORT remains as a manual backup.
- [x] **Lossless session `payload` for the coach** (shipped Jun 17) — added a
  nullable `payload jsonb` column on DD Health `sessions` (migration
  `add_sessions_payload_jsonb`) holding the COMPLETE `WorkoutSession`, written on
  push in `buildRow`. Coach now gets cardio + intervals + notes structurally, not
  just as prose in `raw_brief`. Additive — shaped columns untouched; legacy rows
  have null payload. Also the foundation if the cross-device pull is revived.

### Queued — scoped passes (deferred from Pass 5, by decision)
- [x] **Cardio cinematic splash** — shipped as `CardioSceneHeader`: a full-bleed
  `pump-scene-cardio.png` cockpit header atop the logger (mirroring how
  `WorkoutTimerBar` became the gym scene header). Cyan "CARDIO · \<activity\>"
  caps, inline-editable Pacifico session name, giant centered hero timer (total
  logged duration) flanked by live distance + pace. Replaced the old inline
  countdown/stopwatch `Timer` card; the multi-activity logger is untouched.

### Health (non-workout)
- [x] **Smart BP export** (shipped Jun 17) — "Copy for doctor" no longer dumps
  the whole list each time. Default **New = only readings since the last copy**
  (`pump-bp-last-shared` ISO cursor, advanced on copy), with a `New · 7d · 30d ·
  All` toggle driving both the RECENT list and the export. `BloodPressureSheet.tsx`
  + `getBPLastShared`/`setBPLastShared` in `storage.ts`.
- [ ] **BP reading edit/delete** — tap a past reading to correct or remove it (storage + sweep already support delete).
- [x] ~~BP history / trend view~~ — RETIRED (Jun 17). The RECENT list already
  shows past readings; a trend/average view is not wanted.

### PUMP OS
- [ ] Plan progress indicator — "Session 3 of 12" style tracking
- [ ] **"Up next" card on the home screen** — compute the next session by reading
  the most recent logged session's label and flipping Upper/Lower per the plan's
  weekly structure (e.g. last was Upper A → up next is Lower B). Client-side
  only, no schema change. Surfaces what the trainer infers so the rotation is
  obvious without asking. (`getNextPlanSession` in `storage.ts` already computes
  the next plan session by `planSessionId` rotation — mostly a matter of
  surfacing it on the dashboard. Supersedes the old "next session preview" line.)
- [ ] BRIEF share sheet — native iOS share instead of clipboard + open tab
- [ ] Superset auto-detection from plan (when `supersetWith` is set, auto-link on pre-fill)

### Core UX
- [x] **Clearer, breakable superset linkage (active workout)** (Jun 22) — linked
  cards now show a prominent centered SUPERSET pill (⚡ + connecting line) with a
  ✕ to break the bond in one tap (`unlinkSuperset`). Replaces the thin line +
  small text. `GymWorkout.tsx`.
- [ ] Swipe to delete sets
- [ ] Auto-start rest timer after logging a set (opt-in)
- [ ] Recently used exercises at top of search

---

## Medium Priority

### Cardio & heart rate (COROS HR monitor)
Goal: start a cardio session that tracks time + HR, finish with notes.
**Reality check — live HR in the iOS PWA is blocked:**
- **Web Bluetooth** (BLE Heart Rate Service `0x180D`) is the natural way to read
  a strap live, but Apple does **not** support it in Safari / iOS WKWebView — so
  the installed PWA can't talk to the COROS strap directly. (It *does* work in
  Chrome/Edge on Android/desktop — irrelevant to the iPhone use case.)
- **HealthKit** (COROS syncs HR there) is **native-only** — a PWA can't read it.
- ∴ "watch HR tick inside Pump during the run" needs a native wrapper; not doable
  in pure-PWA form.

Pragmatic paths, by effort:
- [ ] **Manual avg/max HR fields on cardio entries** (easy — ships now) — type
  the numbers off the COROS watch at the end, with notes. Fits the post-hoc
  logging model. _Supersedes "Heart rate zone (manual)"._
- [ ] **#2 — Strava import (COROS → Strava → Pump)** (medium — planned next step
  for HR) — once the activity syncs to Strava, pull duration / distance / avg+max
  HR via the Strava API to pre-fill a cardio entry. Post-hoc, not live; needs
  Strava OAuth + an edge function. _Supersedes "Strava integration for cardio"._
- [x] **#3 — Native wrapper (Capacitor) for live BLE HR** (Jun 22) — shipped the
  Capacitor iOS app (static-export cutover) + `@capacitor-community/bluetooth-le`.
  `useHeartRate` connects the standard HR service (0x180D) and streams live BPM;
  `HeartRateConnect` (in CardioWorkout) is the connect button + live readout.
  COROS strap broadcasts standard BLE HR, so no vendor SDK.
- [x] **Live cardio session w/ HR recording** (Jun 22, Phase 4) — `LiveCardio`
  (in CardioWorkout): connect → Start (stopwatch + live BPM, accumulating
  avg/max) → Stop logs a `CardioEntry` with `avgHr`/`maxHr`. Shows on the entry
  card + BRIEF + rides in the session `payload` → reaches the coach. Manual
  logger remains the fallback.
  - [x] Manual avg/max HR fields on the cardio add form (Jun 22) — for sessions
    logged without the strap; shows on the entry card + BRIEF + payload.
  - [x] Time-in-zone (Jun 22) — Dylan's trainer zones in `hr-zones.ts`; LiveCardio
    accumulates seconds/zone → `CardioEntry.zoneSeconds`, shown as a zone bar +
    in the BRIEF + payload. Live zone chip during the session.
  - [ ] Raw HR sample stream (per-second curve) — skipped for now; the zone
    breakdown + avg/max cover the coaching need. Add if finer analysis is wanted.
  - [ ] **HealthKit read** (still future) — a separate native capability if we
    later want Apple Health import; not needed for live BLE.

### Analytics & Dashboard
- [ ] Weekly volume chart (bar graph)
- [ ] PR progression timeline per exercise
- [ ] Streak tracking — consecutive training days/weeks
- [ ] Muscle group volume breakdown

### Timer
- [ ] Background timer with lock screen notification
- [ ] Per-exercise default rest time
- [ ] Auto-start rest timer after set

### Data
- [ ] Export session log as text (for pasting into Health Project history)
- [x] Full data export as JSON backup (dashboard EXPORT button)
- [x] Import from backup — dashboard IMPORT button; `importMergeData` unions a
  backup into local via `mergeEnvelopes` (safe, idempotent, full fidelity). This
  is the cross-device restore path (Safari → installed PWA).

---

## Low Priority

- [ ] **Fused superset block** _(parked — low priority, Jun 17)_ — one cockpit
  card with a single shared input toggling between the two paired exercises
  (mockup §02). Link/unlink already works; this is only an alternating-single-
  card logging UX, not a fix. Build only if the two-card view proves annoying.
- [ ] RPE per set
- [ ] Notes per set (not just per exercise)
- [ ] Failure indicator per set
- [ ] Tempo notation
- [ ] Calorie estimate for cardio
- [ ] Apple Watch companion (see "Cardio & heart rate" under Medium — native wrapper)
- _Heart rate / Apple Health / Strava → consolidated under_ **Cardio & heart rate (COROS HR monitor)** _in Medium Priority._

---

## Technical Debt

- [ ] **Codebase-wide lint debt** — the newer `react-hooks` rules
  (`set-state-in-effect`, `purity`) flag many pre-existing patterns across
  `useCloudSync`, `WorkoutTimerBar`, `useTimer`, etc. (~27 findings). The build
  does NOT gate on lint (Next 16), so it ships fine, but `npm run lint` is red.
  Sweep these deliberately in their own pass (mostly: derive initial state, or
  move `Date.now()`/`Math.random()` out of render). Don't bundle with feature work.
- [ ] Unit tests for useWorkout hook
- [ ] Virtualize long history lists
- [ ] Service worker for true offline (currently localStorage only)
- [ ] Error boundaries on workout views
- [ ] Loading skeletons

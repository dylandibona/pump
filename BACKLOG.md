# Product Backlog

---

## Completed

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
- _Pending Phase 2:_ retire Upstash (gated on second-device verification). See `pump_build_spec_v2.md`.

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

### Queued — scoped passes (deferred from Pass 5, by decision)
- [ ] **Fused superset block** — one cockpit card with a single shared input
  toggling between the two exercises (mockup §02). A logging-UX change that
  needs its own testing scope; not bundled with the Pass 5 visual refresh.
- [x] **Cardio cinematic splash** — shipped as `CardioSceneHeader`: a full-bleed
  `pump-scene-cardio.png` cockpit header atop the logger (mirroring how
  `WorkoutTimerBar` became the gym scene header). Cyan "CARDIO · \<activity\>"
  caps, inline-editable Pacifico session name, giant centered hero timer (total
  logged duration) flanked by live distance + pace. Replaced the old inline
  countdown/stopwatch `Timer` card; the multi-activity logger is untouched.

### Health (non-workout)
- [ ] **BP history / trend view** — the recorder shipped Jun 5 (entry only). Add a category-colored list of past readings + a 7-day average / simple trend; fits the History tab or a dedicated mini-view.
- [ ] **BP reading edit/delete** — tap a past reading to correct or remove it (storage + sweep already support delete).

### PUMP OS
- [ ] Plan progress indicator — "Session 3 of 12" style tracking
- [ ] Next session preview on dashboard — show what's coming up
- [ ] BRIEF share sheet — native iOS share instead of clipboard + open tab
- [ ] Superset auto-detection from plan (when `supersetWith` is set, auto-link on pre-fill)

### Core UX
- [ ] Swipe to delete sets
- [ ] Auto-start rest timer after logging a set (opt-in)
- [ ] Recently used exercises at top of search

---

## Medium Priority

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
- [ ] Full data export as JSON backup
- [ ] Import from backup

---

## Low Priority

- [ ] Apple Health integration (steps, HR)
- [ ] Strava integration for cardio
- [ ] RPE per set
- [ ] Notes per set (not just per exercise)
- [ ] Failure indicator per set
- [ ] Tempo notation
- [ ] Calorie estimate for cardio
- [ ] Heart rate zone (manual)
- [ ] Apple Watch companion

---

## Technical Debt

- [ ] Unit tests for useWorkout hook
- [ ] Virtualize long history lists
- [ ] Service worker for true offline (currently localStorage only)
- [ ] Error boundaries on workout views
- [ ] Loading skeletons

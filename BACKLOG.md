# Product Backlog

---

## Completed

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

### PUMP OS
- [ ] Session feel / notes field on summary screen (feeds into BRIEF)
- [ ] Plan progress indicator — "Session 3 of 12" style tracking
- [ ] Next session preview on dashboard — show what's coming up
- [ ] BRIEF share sheet — native iOS share instead of clipboard + open tab
- [ ] Superset auto-detection from plan (when `supersetWith` is set, auto-link on pre-fill)

### Core UX
- [ ] **Reorder exercises + edit supersets mid-workout** — let the user shuffle exercise order in an active session (to superset by equipment availability/feel) and link/unlink supersets on the fly.
  - **Recommended approach:** a dedicated "reorder" sheet/view (not inline drag). The live exercise cards are full of number inputs, so inline drag-and-drop fights with typing/scrolling on mobile. A focused surface shows compact cards (name + set count + superset badge) with drag handles.
  - **Why it's data-safe:** reordering only changes the order of `session.exercises[]`; each exercise object carries its own `sets[]`, so logged data travels with the card — nothing is lost on the round trip. Write back via the existing `saveSession`/`patchSession` path; GymWorkout re-reads on return. The rest timer / active-session state is untouched.
  - **Tooling:** use framer-motion `Reorder.Group`/`Reorder.Item` (already a dependency) for touch-friendly DnD — no new lib.
  - **Supersets:** modeled via `GymExercise.supersetGroupId`. Unlink = clear the id; link = assign a shared id to adjacent exercises. Open question to settle: when a superset member is moved, move the whole group together (keep members adjacent) or auto-unlink it.
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

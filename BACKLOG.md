# Product Backlog

---

## Completed

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
- [ ] Drag to reorder exercises within a session
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
- [ ] Cloud sync / multi-device
- [ ] Apple Watch companion

---

## Technical Debt

- [ ] Unit tests for useWorkout hook
- [ ] Virtualize long history lists
- [ ] Service worker for true offline (currently localStorage only)
- [ ] Error boundaries on workout views
- [ ] Loading skeletons

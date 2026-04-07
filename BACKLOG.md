# Product Backlog

---

## Completed

- [x] Core gym workout logging
- [x] Core cardio workout logging
- [x] PR tracking with celebrations (beats existing record only)
- [x] Exercise autocomplete with database
- [x] Rest timer (countdown) + stopwatch
- [x] Workout history with session detail
- [x] PWA manifest + icons
- [x] Bold design system — glass, neon, square edges
- [x] Sound + haptic feedback
- [x] **Bodyweight exercises** — BW toggle, 0-weight sets
- [x] **Mixed sessions** — cardio inline in gym view
- [x] **Supersets** — link exercises, visual grouping
- [x] **PUMP OS — Plan loading** — paste trainer JSON, sessions pre-fill
- [x] **PUMP OS — BRIEF generator** — Send to Trainer on session complete
- [x] **Autocomplete opens upward** — clears bottom bar
- [x] **Session summary stats fixed** — reads from storage, never shows 0

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

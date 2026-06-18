## recently seen bugs to fix — FIXED 2026-06-17

All six shipped together (commit on `main` → Vercel). Verified: `tsc` clean,
ESLint 0 errors, app boots. In-app interactions still want a device pass
(headless preview is auth-gated + can't drive framer transitions).

- [x] **Reorder card — can't scroll / can't grab / "below the fold" hidden.**
  Drag now starts ONLY from the grip handle (`useDragControls` +
  `dragListener={false}` + `touchAction:none`), so the card body scrolls and
  exercises past the fold are reachable. Reset effect seeds only on open (it
  was re-seeding mid-drag → reorders "didn't take").
  → `ReorderExercisesSheet.tsx`.
- [x] **Back button sitting on top of the in-workout cockpit header.**
  Floating glass-pill back button suppressed on `gym`/`cardio` views (they have
  their own sticky header + in-flow Back). Removes the overlap + accidental-exit
  risk. → `page.tsx`.
- [x] **"Log your first set" card wasted after first run.** Recommissioned: once
  history exists, that slot becomes `LastSessionCard` — a glanceable recap of
  the most recent / just-finished workout (label + 3 key stats), tapping into
  detail. First-run scene unchanged. → `Dashboard.tsx`.
- [x] **Couldn't add FEEL / wrap-up notes after re-entering a saved session.**
  `FeelAndNotesEditor` added to the session-detail view — feel + notes are now
  editable on any finished session (writes via `patchSession`). → `page.tsx`.
- [x] **Explosion sound firing at strange times.** Root cause: all 3 sound
  types mapped to the explosion MP3 and set-complete fired on every set / rest
  timer / interval. Explosion is now PR-only; set-complete plays
  `/set-complete.mp3` (80s synth), timer-done is a synthesized tone.
  → `sounds.ts`.
- [x] **Completed rounds persisting as PARTIAL ("3 saved as 2").** Root cause
  was a lost set, not the status threshold: `ExerciseCard` computed the planned
  slot index from a stale render snapshot, so two rapid Add taps clobbered the
  same slot. New `useWorkout.logSet` resolves the slot inside the `mutate`
  transform against fresh state. PARTIAL is then derived correctly.
  → `useWorkout.ts`, `GymWorkout.tsx`.

## Known issues (open)
- **Lingering IN PROGRESS session** (noted Jun 17, unconfirmed) — a session
  dated Jun 13 ("Session B") shows as IN PROGRESS in Recent/History though the
  user didn't back out of or start it accidentally. `finalizeAbandonedSessions`
  only runs on a cold mount (`useEffect([])`), but an installed iOS PWA often
  *resumes* without remounting, so an unfinished session can survive for days.
  Likely fix: also run the abandoned-session cleanup on return to the dashboard
  (guarded so it never touches a genuinely active session). Low priority for
  now; user can delete the row from History. Needs the row's contents inspected
  (real logged sets vs plan placeholders / duplicate) to confirm root cause.
- DD Health DB: `meta.value` stores as text, not jsonb. JSON operators
  (`->` / `->>`) need an explicit `::jsonb` cast until the column type is fixed.
  No functional impact (the trainer reads/writes meta, PUMP does not touch it).
  Fix the column type or just cast when next in the schema.

@AGENTS.md

# PUMP — Claude Code Context

## What this app is
A mobile-first PWA workout tracker for Dylan's personal use, deployed at pump.dylandibona.com. It is one half of the **PUMP OS** — a training system where a Claude Health Project acts as a remote trainer and this app acts as the gym executor. See `../trainer-os/README.md` for the full system spec.

## Architecture in one line
Next.js 16 App Router, client-side only, all data in localStorage, deployed via GitHub → Vercel.

## Key files to know
- `src/lib/types.ts` — all data types including PUMP OS types (TrainerPlan, PlanSession, PlanExercise). `PersonalRecord` now carries `e1rm` + `previousE1rm`.
- `src/lib/storage.ts` — localStorage operations + plan storage + next-session logic. Exports `computeE1RM` (Epley). Per-set PR evaluation in `checkAndUpdatePRs`.
- `src/lib/sounds.ts` — Web Audio API playback so PR/set-complete sounds mix over music instead of ducking iOS audio session.
- `src/hooks/useWorkout.ts` — central session hook. Tracks `newPRs[]` and `newBaselines[]` separately via pre-session e1RM snapshot.
- `src/app/page.tsx` — view state machine, plan state, tab-bar routing (`'workout' | 'history' | 'plan'`), in-file `PlanView` + `SessionDetailView` subcomponents.
- `src/components/workout/GymWorkout.tsx` — most complex component; handles exercises, supersets, bodyweight, inline cardio, plan pre-fill. Exercise cards use `.pump-card` / `--active` / `--superset`.
- `src/components/workout/SessionPreview.tsx` — editable preview between plan-session tap and GymWorkout.
- `src/components/workout/SessionSummary.tsx` — reads session from storage directly (not hook) to avoid stale state; generates BRIEF. Uses `.pr-badge`.
- `src/components/workout/BottomTabBar.tsx` — persistent root nav (Workout / History / Plan).
- `src/components/workout/RetrowaveScene.tsx` — dashboard hero scene with the only Monoton PUMP mark.
- `src/components/workout/PlanLoader.tsx` — parses trainer JSON, saves plan, shows plan details. Mounted inside the Plan tab view.
- `april 15/` — design package (DESIGN_SYSTEM.md, BUG_FIXES.md, RETROWAVE_SCENE.html, palm_*.svg). Source of truth for theme + spec decisions.

## localStorage keys
- `dylan-workout-tracker` — all sessions, PRs, templates, settings
- `dylan-workout-plan` — active TrainerPlan JSON (separate key, replaced on plan update)

## PUMP OS data flow
```
TRAINER (Claude Health Project)
  → outputs TrainerPlan JSON
  → user pastes into PlanLoader
  → plan saved to localStorage

User taps session → GymWorkout pre-fills exercises from PlanSession
  → logs actual sets (weight overrideable)
  → completes session

SessionSummary generates BRIEF
  → copies to clipboard
  → opens claude.ai
  → user pastes into Health Project
```

## Active design decisions
- **Miami Heat Wave theme** — light background (ice→warm gradient), hot-pink/cyan/purple accents, 14px card radius, spectrum-bar tops, card glow system. See `april 15/DESIGN_SYSTEM.md`. Replaced the earlier square-edge dark theme.
- **Bottom tab bar is root navigation** — Workout / History / Plan. Hidden on workflow views (start, preview, gym, cardio, summary, session-detail). See `BottomTabBar.tsx`.
- **Retrowave scene is dashboard-only** — the only place the Monoton PUMP brand mark appears. Not a splash, not a global header.
- **Script-font nav titles on root views** — Plan, History, New Workout render their nav title in Pacifico (title-case). Workflow views keep Outfit 800 uppercase.
- **PR logic: per-set Epley e1RM** — `e1RM = weight × (1 + min(reps,30)/30)`. The best set of a session (highest e1RM) is the candidate PR. First-ever exercises store a silent baseline (no sound, no banner). Legacy PR records are backfilled with e1RM on load.
- **No session type guard** — sessions have both `exercises[]` and `cardio[]` always initialized. Mixed sessions are supported.
- **Autocomplete opens upward** — `bottom-full` positioning so it clears the fixed bottom bar.
- **Session summary reads storage directly** — `getSession(activeSessionId)` at render time, not the hook's stale copy.
- **Sound uses Web Audio API** — AudioContext + BufferSource so PR/set-complete sounds layer over music instead of claiming iOS audio session.

## How to deploy
Push to `main` on GitHub. Vercel auto-deploys. No manual steps.

## Trainer OS docs
All system documentation lives in `../trainer-os/`. Don't duplicate that context here.

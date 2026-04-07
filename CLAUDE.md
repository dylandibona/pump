@AGENTS.md

# PUMP — Claude Code Context

## What this app is
A mobile-first PWA workout tracker for Dylan's personal use, deployed at pump.dylandibona.com. It is one half of the **PUMP OS** — a training system where a Claude Health Project acts as a remote trainer and this app acts as the gym executor. See `../trainer-os/README.md` for the full system spec.

## Architecture in one line
Next.js 16 App Router, client-side only, all data in localStorage, deployed via GitHub → Vercel.

## Key files to know
- `src/lib/types.ts` — all data types including PUMP OS types (TrainerPlan, PlanSession, PlanExercise)
- `src/lib/storage.ts` — localStorage operations + plan storage + next-session logic
- `src/hooks/useWorkout.ts` — central session hook; type guards removed, gym+cardio works in any session
- `src/app/page.tsx` — view state machine, plan state lives here
- `src/components/workout/GymWorkout.tsx` — most complex component; handles exercises, supersets, bodyweight, inline cardio, plan pre-fill
- `src/components/workout/SessionSummary.tsx` — reads session from storage directly (not hook) to avoid stale state; generates BRIEF
- `src/components/workout/PlanLoader.tsx` — parses trainer JSON, saves plan, shows plan details

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
- **Square edges** — `--radius: 0rem` in globals.css. Intentional.
- **No session type guard** — sessions have both `exercises[]` and `cardio[]` always initialized. Mixed sessions are supported.
- **PR celebrations only on beaten records** — first-time sets are silently recorded as baseline.
- **Autocomplete opens upward** — `bottom-full` positioning so it clears the fixed bottom bar.
- **Session summary reads storage directly** — `getSession(activeSessionId)` at render time, not the hook's stale copy.

## How to deploy
Push to `main` on GitHub. Vercel auto-deploys. No manual steps.

## Trainer OS docs
All system documentation lives in `../trainer-os/`. Don't duplicate that context here.

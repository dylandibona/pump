# PUMP — Workout Tracker

Mobile-first PWA workout tracker. Lives at **pump.dylandibona.com**.

Part of the **PUMP OS** — a training system where a Claude Health Project acts
as a remote trainer and this app acts as the gym executor. See `../trainer-os/`
for the full system.

---

## Features

### PUMP OS
- **Plan loading** — paste trainer-generated JSON, or fetch the active plan
  automatically from Supabase (`plans` table where `is_active`).
- **NEXT UP** — app knows which session is next based on your plan rotation.
- **Pre-filled exercises** — exercises, target weights, and form cues loaded
  from plan.
- **Sync to trainer** — finished sessions land in the Supabase `sessions`
  table automatically (idempotent via `client_session_id`). The session
  summary is honest about it: "Synced to trainer · Your trainer sees this
  in their dashboard. No paste needed." Optional "Open with trainer" copies
  the BRIEF for explicit conversation.
- **Curated PRs** — dashboard Records read from the trainer-curated `prs`
  Supabase table (one current-best row per exercise, kind = load / rep).

### Gym Workouts
- Exercise autocomplete (100+ exercises + custom)
- Name normalization — "Curl standing curl" canonicalizes to "Standing Curl"
- Set tracking with weight, reps, warmup flag
- Bodyweight exercises (situps, pull-ups, etc.)
- Supersets — link any two exercises with ⚡; reorder via dedicated sheet;
  members moved out of adjacency auto-unlink
- Inline cardio — log a run between sets
- **PR full-screen reward** (`PRMomentScreen`) — earned, rare, the loudest
  the app gets
- Local-detected "NEW BEST" badge during the session
- Exercise history per movement
- Quick duplicate last set
- Rest timer inline per exercise

### Cardio
- Run, bike, swim, row, elliptical, walk (activity picker)
- Distance, time, auto pace calculation
- Standalone or mixed into a gym session

### Blood pressure (non-workout)
- Dashboard heart-button → log SYS/DIA/pulse + time + lisinopril toggle +
  how-long-ago buckets + notes
- Live AHA category (Normal / Elevated / Stage 1 / Stage 2 / Crisis)
- Recent view: last 10 readings, color-coded
- "Copy last N for doctor" exports plain text for your PCP

### General
- Session summary with full stats + named feel rating (Brutal / Tough / OK /
  Good / Easy)
- Reorder exercises + edit supersets mid-workout
- Workout history browser (calm month-grouped list, sentence-case session
  labels)
- Personal records dashboard (curated)
- Floating glass-pill back button — always reachable on scroll
- Local-first: all data in localStorage, with cloud sync + magic-link login
  (Supabase; Upstash legacy)
- PWA — install to home screen

---

## Tech Stack

- **Next.js 16** — App Router, Turbopack
- **Tailwind CSS v4** — utility styling
- **shadcn/ui** + **base-ui** components
- **Framer Motion** — animations
- **Lucide React** — icons
- **localStorage** — primary persistence (local-first)
- **Supabase** — auth (magic link) + plan/session/PRs/BP cloud sync
  (mid-migration off Upstash Redis)

---

## Development

```bash
npm install
npm run dev        # localhost:3000
npm run build      # production build
```

Deploy: push to `main` → Vercel auto-deploys to pump.dylandibona.com.

When the auth gate gets in the way during local design work, the convention
is `mv .env.local .env.local.bak` to fall through to the ungated localStorage-
only mode. Restore the env (and restart `npm run dev`) before shipping.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css           # Theme, animations, Volume System tokens
│   ├── layout.tsx            # Root layout + fonts (AuthGate wrap)
│   ├── page.tsx              # View state machine, plan state,
│   │                         # floating back-pill, session-detail view
│   ├── design/page.tsx       # Volume System token reference (dev route)
│   └── mockup/page.tsx       # Visual gallery of every designed screen
├── components/
│   ├── auth/AuthGate.tsx     # Splash + magic-link sign-in
│   ├── ui/sheet.tsx          # Sheet primitive (Overlay Contract enforced)
│   └── workout/
│       ├── Dashboard.tsx     # Home, stats, BP heart, PR card
│       ├── PlanLoader.tsx    # PUMP OS — load/replace trainer plan
│       ├── SessionStart.tsx
│       ├── SessionPreview.tsx
│       ├── GymWorkout.tsx
│       ├── CardioWorkout.tsx
│       ├── SessionSummary.tsx          # named feel + synced reassurance
│       ├── PRMomentScreen.tsx          # V3 full-screen PR reward
│       ├── BloodPressureSheet.tsx      # LOG / RECENT + copy for doctor
│       ├── ReorderExercisesSheet.tsx
│       ├── WorkoutHistory.tsx
│       ├── WorkoutTimerBar.tsx
│       ├── Timer.tsx + IntervalFlow.tsx
│       └── ExerciseAutocomplete.tsx
├── hooks/
│   ├── useWorkout.ts         # Session management hook
│   ├── useCloudSync.ts       # Legacy Upstash bootstrap
│   └── useTimer.ts
└── lib/
    ├── types.ts              # All types incl. TrainerPlan
    ├── storage.ts            # localStorage + plan ops + PR commit logic
    ├── utils.ts              # parseSessionDate, sessionLabel (canonical name)
    ├── exercises.ts          # Library + normalizeExerciseName
    ├── brief.ts              # Trainer BRIEF generator
    ├── sounds.ts             # Web Audio feedback
    ├── supabase.ts           # Browser client
    ├── plan-sync.ts          # fetchActivePlan from Supabase
    ├── session-sync.ts       # pushUnsyncedSessions (idempotent)
    ├── prs-sync.ts           # Curated PR cache from Supabase
    ├── bp-sync.ts            # BP reading push
    ├── plan-validation.ts    # Trainer JSON validator
    ├── sync-merge.ts         # Legacy Upstash merge (Phase 2 retire)
    └── sync.ts               # Legacy Upstash client (Phase 2 retire)
```

---

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Context for Claude Code — architecture, decisions, key files, gotchas (the living reference) |
| `DESIGN.md` | Volume System — design philosophy: three volumes, type system, color, motion budget, Overlay Contract |
| `MOCKUP_AUDIT.md` | Living punch list — what's shipped vs. open against the `/mockup` spec |
| `pump_build_spec_v2.md` | Supabase cutover spec — Phase 1 done, Phase 2 (retire Upstash) pending |
| `BACKLOG.md` | Prioritized feature backlog |
| `AGENTS.md` | Next.js version note for agents writing code |
| `_archive/` | Historical docs (v1 design system, retrowave assets, old audits, session notes) — see `_archive/README.md` |
| `../trainer-os/` | PUMP OS system docs — trainer setup, formats, user guide |

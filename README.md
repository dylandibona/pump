# PUMP — Workout Tracker

Mobile-first PWA workout tracker. Lives at **pump.dylandibona.com**.

Part of the **PUMP OS** — a training system where a Claude Health Project acts as a remote trainer and this app acts as the gym executor. See `../trainer-os/` for the full system.

---

## Features

### PUMP OS
- **Plan loading** — paste trainer-generated JSON, sessions appear automatically
- **NEXT UP** — app knows which session is next based on your plan rotation
- **Pre-filled exercises** — exercises, target weights, and form cues loaded from plan
- **Send to Trainer** — one tap generates a formatted BRIEF, copies to clipboard, opens claude.ai

### Gym Workouts
- Exercise autocomplete (100+ exercises + custom)
- Set tracking with weight, reps, warmup flag
- Bodyweight exercises (situps, pullups, etc.)
- Supersets — link any two exercises with ⚡
- Inline cardio — log a run between sets
- PR detection and celebration
- Exercise history per movement
- Quick duplicate last set
- Rest timer inline per exercise

### Cardio
- Run, bike, swim, row, elliptical, walk
- Distance, time, auto pace calculation
- Standalone or mixed into a gym session

### General
- Session summary with full stats
- Workout history browser
- Personal records dashboard
- All data local — no account, no server
- PWA — install to home screen

---

## Tech Stack

- **Next.js 16** — App Router, Turbopack
- **Tailwind CSS v4** — utility styling
- **shadcn/ui** — base-ui components
- **Framer Motion** — animations
- **Lucide React** — icons
- **localStorage** — all persistence

---

## Development

```bash
npm install
npm run dev        # localhost:3000
npm run build      # production build
```

Deploy: push to `main` → Vercel auto-deploys to pump.dylandibona.com.

---

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Theme, animations, utilities
│   ├── layout.tsx           # Root layout + fonts
│   └── page.tsx             # View state machine, plan state
├── components/workout/
│   ├── Dashboard.tsx        # Home, stats, PlanLoader
│   ├── PlanLoader.tsx       # PUMP OS — load/replace trainer plan
│   ├── SessionStart.tsx     # Date picker + plan sessions
│   ├── GymWorkout.tsx       # Core workout UI
│   ├── CardioWorkout.tsx    # Cardio session
│   ├── SessionSummary.tsx   # Post-workout + BRIEF generator
│   ├── WorkoutHistory.tsx   # Past sessions
│   ├── ExerciseAutocomplete.tsx
│   └── Timer.tsx
├── hooks/
│   ├── useWorkout.ts        # Session management hook
│   └── useTimer.ts          # Timer/stopwatch
└── lib/
    ├── types.ts             # All types incl. TrainerPlan
    ├── storage.ts           # localStorage + plan ops
    ├── exercises.ts         # Exercise database
    └── sounds.ts            # Audio feedback
```

---

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Context for Claude Code — architecture, decisions, gotchas |
| `TECH_SPECS.md` | Full technical reference — schema, components, styling |
| `BACKLOG.md` | Prioritized feature backlog |
| `../trainer-os/` | PUMP OS system docs — trainer setup, formats, user guide |

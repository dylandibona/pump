# Technical Specifications

## Architecture Overview

Pump is a client-side single-page application built with Next.js 16. All data persists locally using the browser's localStorage API, making it a fully offline-capable PWA. It is the gym executor half of the PUMP OS — see `../trainer-os/README.md`.

## Technology Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.2 | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Turbopack | Built-in | Development bundler |

### Styling & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | Latest | Component library (base-ui primitives) |
| Framer Motion | 11.x | Animations and transitions |
| Lucide React | Latest | Icon library |

### Fonts (via next/font/google)
- **Bebas Neue** — Display/headings (weight: 400)
- **Outfit** — Body text (weights: 300-900)
- **Space Mono** — Monospace/numbers (weights: 400, 700)

---

## Data Architecture

### Storage Keys
| Key | Contents |
|-----|----------|
| `dylan-workout-tracker` | Sessions, PRs, templates, settings |
| `dylan-workout-plan` | Active TrainerPlan JSON (PUMP OS) |

### Core Data Schema

```typescript
// Session — always has both arrays initialized (mixed sessions supported)
interface WorkoutSession {
  id: string;
  type: 'gym' | 'cardio';       // Origin type; both arrays always present
  date: string;                  // YYYY-MM-DD
  startTime: string;             // ISO timestamp
  endTime?: string;
  completed: boolean;
  notes?: string;
  exercises: GymExercise[];      // Always initialized (not undefined)
  cardio: CardioEntry[];         // Always initialized (not undefined)
}

interface GymExercise {
  id: string;
  name: string;
  sets: GymSet[];
  notes?: string;
  supersetGroupId?: string;      // Shared ID links superset exercises
}

interface GymSet {
  weight: number;                // 0 = bodyweight
  reps: number;
  isWarmup?: boolean;
  isBodyweight?: boolean;
}

interface CardioEntry {
  id: string;
  activity: CardioActivity;
  distance: number;              // Miles
  duration: number;              // Seconds
  notes?: string;
}

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  sessionId: string;
}
```

### PUMP OS Schema

```typescript
// Loaded from trainer, stored separately
interface TrainerPlan {
  planId: string;
  name: string;
  version: number;
  createdDate: string;
  blockType?: string;
  weeklyStructure?: string[];    // Ordered session names for rotation
  progressionScheme?: string;
  sessions: PlanSession[];
  trainerNotes?: string;
}

interface PlanSession {
  id: string;
  name: string;
  exercises: PlanExercise[];
}

interface PlanExercise {
  name: string;
  sets: number;
  targetReps: string;            // "10-12" or "10"
  targetWeight?: number;         // undefined = no target
  isBodyweight?: boolean;
  notes?: string;                // Form cue shown in card header
  supersetWith?: string | null;  // Exercise name
}
```

### PR Calculation
- Uses Brzycki estimated 1RM: `weight × (36 / (37 - reps))`
- PR celebrated only when estimated 1RM exceeds existing record
- First-time sets recorded silently as baseline (no celebration)
- Warmup sets and bodyweight sets excluded from PR tracking

---

## Component Architecture

### View State Machine
```
dashboard ←→ start → gym/cardio → summary → dashboard
    ↓
  history ←→ session-detail
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `Dashboard` | Home screen, stats, recent sessions, PlanLoader |
| `PlanLoader` | Parse + store trainer JSON, show active plan details |
| `SessionStart` | Date picker, plan sessions with NEXT UP, free-form fallback |
| `GymWorkout` | Exercises, sets, supersets, bodyweight, inline cardio, plan pre-fill |
| `CardioWorkout` | Standalone cardio session |
| `SessionSummary` | Post-workout stats, BRIEF generation, Send to Trainer |
| `ExerciseAutocomplete` | Exercise search, opens upward to clear bottom bar |
| `WorkoutHistory` | Browse past sessions |
| `Timer` | Rest timer + stopwatch |

### Key Hook: `useWorkout`
- No type guards on session type — all operations work on any session
- `exercises[]` and `cardio[]` always initialized on session start
- Superset linking/unlinking via `linkSuperset` / `unlinkSuperset`
- PR check skips first-time exercises (silent baseline)

---

## Styling

### Design Tokens
```css
--primary: oklch(0.85 0.25 125)   /* Electric lime */
--accent:  oklch(0.7 0.25 350)    /* Hot pink */
--background: oklch(0.08 0.01 270) /* Deep black */
--radius: 0rem                     /* Square edges — intentional */
```

### Key Utility Classes
| Class | Effect |
|-------|--------|
| `.glass` | Glass morphism card |
| `.glass-strong` | Stronger glass for sheets |
| `.glow-neon` | Green neon box shadow |
| `.glow-hot` | Pink neon box shadow |
| `.text-glow-neon` | Green text glow |
| `.text-glow-hot` | Pink text glow |
| `.touch-target` | Min 52px touch area |
| `.font-display` | Bebas Neue |

---

## Deployment

- **Repo**: github.com/dylandibona/pump
- **CI/CD**: Push to `main` → Vercel auto-deploys
- **Live**: pump.dylandibona.com
- No environment variables, no backend, no auth

---

## Known Limitations

1. **Storage limit** — localStorage ~5MB; sufficient for years of logging
2. **Device-local** — no sync across devices
3. **Single user** — no accounts
4. **Units** — lbs and miles only (no kg/km toggle yet)

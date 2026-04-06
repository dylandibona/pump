# Technical Specifications

## Architecture Overview

Pump is a client-side single-page application built with Next.js 16. All data persists locally using the browser's localStorage API, making it a fully offline-capable PWA.

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
- **Bebas Neue** - Display/headings (weight: 400)
- **Outfit** - Body text (weights: 300-900)
- **Space Mono** - Monospace/numbers (weights: 400, 700)

## Data Architecture

### Storage Strategy
All data is stored in localStorage under the key `pump-workout-data`. The data is serialized as JSON.

### Data Schema

```typescript
interface WorkoutData {
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  templates: WorkoutTemplate[];
}

interface WorkoutSession {
  id: string;                    // UUID
  type: 'gym' | 'cardio';
  date: string;                  // ISO date (YYYY-MM-DD)
  startTime: string;             // ISO timestamp
  endTime?: string;              // ISO timestamp
  completed: boolean;
  notes?: string;
  exercises?: GymExercise[];     // For gym sessions
  cardio?: CardioEntry[];        // For cardio sessions
}

interface GymExercise {
  id: string;
  name: string;
  sets: GymSet[];
  notes?: string;
}

interface GymSet {
  weight: number;                // In pounds
  reps: number;
  isWarmup: boolean;
}

interface CardioEntry {
  id: string;
  activity: CardioActivity;      // 'run' | 'bike' | 'swim' | etc.
  distance: number;              // In miles
  duration: number;              // In seconds
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

### PR Calculation Logic
A new PR is detected when:
1. The set is NOT marked as warmup
2. The weight × reps value exceeds the previous record for that exercise
3. Comparison is case-insensitive on exercise name

## Component Architecture

### View State Machine
The app uses a simple state machine for navigation:

```
dashboard ←→ start → gym/cardio → summary → dashboard
    ↓           ↑
  history ←→ session-detail
```

### Key Components

#### `useWorkout` Hook
Central hook for workout session management:
- Creates/loads sessions from storage
- Manages exercise and set CRUD operations
- Detects and tracks PRs
- Calculates session statistics

#### `useTimer` Hook
Manages timer/stopwatch functionality:
- Countdown mode with configurable duration
- Count-up (stopwatch) mode
- Sound and vibration alerts
- Pause/resume/reset controls

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `Dashboard` | Home screen, stats overview, recent workouts |
| `SessionStart` | Date selection, workout type choice |
| `GymWorkout` | Exercise list, set management, rest timer |
| `CardioWorkout` | Activity logging, stopwatch |
| `SessionSummary` | Post-workout celebration, stats review |
| `WorkoutHistory` | Browse past sessions by month |
| `ExerciseAutocomplete` | Fuzzy search for exercises |
| `Timer` | Standalone timer component |

## Styling Architecture

### CSS Custom Properties
Theme colors use OKLCH color space for perceptually uniform colors:

```css
:root {
  --primary: oklch(0.85 0.25 125);      /* Electric lime */
  --accent: oklch(0.7 0.25 350);        /* Hot pink */
  --background: oklch(0.08 0.01 270);   /* Deep black */
}
```

### Utility Classes

| Class | Effect |
|-------|--------|
| `.glass` | Glass morphism card with blur |
| `.glass-strong` | Stronger glass effect |
| `.glow-neon` | Green neon box shadow |
| `.glow-hot` | Pink neon box shadow |
| `.text-glow-neon` | Green text shadow |
| `.text-glow-hot` | Pink text shadow |
| `.text-gradient` | Primary→accent gradient text |
| `.touch-target` | Min 52px touch area |

### Animation Keyframes
- `pulse-neon` - Pulsing glow effect
- `celebrate` - Bounce/rotate celebration
- `shimmer` - Background gradient sweep
- `float` - Gentle vertical float
- `countUp` - Number reveal animation

## PWA Configuration

### Manifest (`public/manifest.json`)
```json
{
  "name": "Pump - Workout Tracker",
  "short_name": "Pump",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f1419",
  "theme_color": "#0f1419"
}
```

### Viewport Configuration
- Width: device-width
- Initial scale: 1
- Maximum scale: 1 (prevents zoom on inputs)
- User scalable: false

## Performance Considerations

### Bundle Optimization
- Uses `next/font` for font loading (no FOUT)
- Lucide icons are tree-shaken
- Framer Motion animations use GPU-accelerated properties

### Runtime Performance
- localStorage operations are synchronous but fast
- Lists use React keys for efficient reconciliation
- AnimatePresence handles exit animations without layout thrash

## Browser Support

### Required APIs
- localStorage
- CSS backdrop-filter
- CSS oklch() colors
- Vibration API (optional, for timer alerts)

### Tested Browsers
- Chrome 90+ (desktop & mobile)
- Safari 15+ (desktop & iOS)
- Firefox 90+
- Edge 90+

## Known Limitations

1. **Storage Limit**: localStorage has ~5MB limit per origin
2. **No Sync**: Data is device-local only (no cloud backup)
3. **No Authentication**: Single-user, no accounts
4. **Units**: Weight in pounds only, distance in miles only

# Pump - Workout Tracker

A bold, mobile-first workout tracking PWA for logging gym sessions and cardio workouts.

## Features

### Gym Workouts
- **Exercise Autocomplete** - Search from 100+ common exercises or add custom ones
- **Set Tracking** - Log weight, reps, and mark warmup sets
- **PR Detection** - Automatic personal record tracking with celebrations
- **Exercise History** - View previous sessions for each exercise
- **Quick Duplicate** - One-tap to repeat your last set
- **Rest Timer** - Inline countdown timer between sets

### Cardio Workouts
- **Activity Types** - Run, Bike, Swim, Row, Elliptical, Walk
- **Distance & Time** - Log miles and duration
- **Pace Calculation** - Automatic pace display (min/mile)
- **Stopwatch** - Built-in timer for live tracking

### General
- **Session Summary** - Celebrate completed workouts with stats
- **Workout History** - Browse past sessions by month
- **Statistics** - Track total workouts, PRs, and volume lifted
- **PWA Ready** - Install on mobile for native-like experience
- **Offline Support** - All data stored locally in localStorage

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (base-ui primitives)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Bebas Neue (display), Outfit (body), Space Mono (mono)
- **Storage**: localStorage (client-side persistence)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Theme, animations, utilities
│   ├── layout.tsx       # Root layout with fonts
│   └── page.tsx         # Main app with view routing
├── components/
│   ├── ui/              # shadcn/ui components
│   └── workout/         # Workout-specific components
│       ├── Dashboard.tsx
│       ├── SessionStart.tsx
│       ├── GymWorkout.tsx
│       ├── CardioWorkout.tsx
│       ├── SessionSummary.tsx
│       ├── WorkoutHistory.tsx
│       ├── Timer.tsx
│       └── ExerciseAutocomplete.tsx
├── hooks/
│   ├── useWorkout.ts    # Workout session management
│   └── useTimer.ts      # Timer/stopwatch logic
└── lib/
    ├── types.ts         # TypeScript types
    ├── storage.ts       # localStorage utilities
    └── exercises.ts     # Exercise database
```

## Design System

### Colors
- **Primary**: Electric lime (`oklch(0.85 0.25 125)`)
- **Accent**: Hot pink (`oklch(0.7 0.25 350)`)
- **Background**: Deep black with subtle warmth

### Effects
- Glass morphism cards with backdrop blur
- Neon glow effects on primary elements
- Smooth view transitions with Framer Motion
- Progress bars and animated celebrations

## PWA Installation

1. Open the app in Chrome/Safari on mobile
2. Tap "Add to Home Screen" from the browser menu
3. Launch from your home screen for full-screen experience

## License

Private - Personal use only

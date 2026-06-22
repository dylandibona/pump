# PUMP — Workout Tracker

Mobile-first workout tracker. Ships as a **PWA** (pump.dylandibona.com) **and a
native iOS app** (Capacitor) from the same static-export build.

Part of the **PUMP OS** — a training system where a Claude Health Project acts
as a remote trainer and this app acts as the gym executor. See `../trainer-os/`
for the full system.

---

## Features

### PUMP OS
- **Plan loading** — fetch the active plan automatically from Supabase (`plans`
  table where `is_active`); pasting trainer JSON is the manual fallback.
- **NEXT UP** — app knows which session is next based on your plan rotation.
- **Pre-filled exercises** — exercises, target weights, and form cues from plan.
- **Sync to trainer** — finished sessions write to the Supabase `sessions` table
  automatically (idempotent via `client_session_id`), including a `payload`
  with the complete session so the coach gets cardio + HR + intervals + notes
  structurally. "Open with trainer" copies the BRIEF for explicit conversation.
- **Curated PRs** — dashboard Records read from the trainer-curated `prs`
  Supabase table (one current-best row per exercise, kind = load / rep).
- **Cross-device** — sessions push on finish AND pull on load, so a fresh
  device / the native app hydrates its history from Supabase.

### Gym Workouts
- Exercise autocomplete (100+ exercises + custom) with name normalization
- Set tracking (weight, reps, warmup), bodyweight exercises, quick duplicate
- **Supersets** — link two exercises; a prominent ⚡ SUPERSET pill with a ✕ to
  break the bond; reorder via a handle-drag sheet; members moved apart auto-unlink
- Inline cardio + interval timer
- **PR full-screen reward** (`PRMomentScreen`) — earned, rare, the loudest the
  app gets; local "NEW BEST" badge in-session
- Per-exercise history + inline rest timer

### Cardio + heart rate
- Run, bike, swim, row, elliptical, walk; distance, time, auto pace
- **Live HR session (native app)** — connects the COROS strap over Bluetooth
  (standard BLE Heart Rate Service), shows live BPM + current zone, and on stop
  records avg/max HR and **time-in-zone** onto the entry
- **HR zones** — trainer-defined zones (`lib/hr-zones.ts`); a colored zone bar
  on each entry + a "Time in zone" line in the BRIEF
- Manual avg/max HR fields for strap-less sessions
- Standalone or mixed into a gym session

### Blood pressure (non-workout)
- Dashboard heart-button → log SYS/DIA/pulse + time + lisinopril toggle +
  how-long-ago buckets + notes; live AHA category
- **Scoped doctor export** — `New · 7d · 30d · All` toggle; default "New" copies
  only readings since the last share (cursor-based), so you don't re-send the
  whole list each time

### General
- Session summary with full stats + named feel rating (Brutal…Easy); feel +
  notes also editable on a finished session from history
- Workout history (calm month-grouped list; beach-scene header with topline
  totals); "Last Session" recap card on the dashboard
- Local-first: all data in localStorage; Supabase is the cloud layer
- **Sign-in is a 6-digit email code** (code-only OTP — PWA/native correct; no
  magic link)
- Launch splash (branded ~1.2s beat); installable PWA + native iOS app

---

## Tech Stack

- **Next.js 16** — App Router, **static export** (`output: 'export'`), Turbopack
- **Capacitor 8** — native iOS shell (Swift Package Manager); same web build
  bundled in, plus native plugins
  - `@capacitor-community/bluetooth-le` — live HR from the strap
  - `@capacitor/status-bar` — safe-area handling
- **Tailwind CSS v4**, **shadcn/ui** + **base-ui**, **Framer Motion**, **Lucide**
- **localStorage** — primary persistence (local-first, offline-first)
- **Supabase** — auth (6-digit code) + plan/session/PR/BP cloud, with
  bidirectional session sync. _(Upstash Redis retired — the static-export
  cutover dropped the `/api/data` route.)_

---

## Development

```bash
npm install
npm run dev        # localhost:3000 (web)
npm run build      # static export → out/

# Native iOS:
npm run build && npx cap sync ios   # bundle the web build + plugins
npx cap open ios                    # Xcode → sign → run / archive → TestFlight
```

Deploy (web/PWA): push to `main` → Vercel auto-deploys to pump.dylandibona.com.
Native: archive in Xcode → upload to App Store Connect → TestFlight (bump the
build number each upload).

When the auth gate gets in the way during local design work, `mv .env.local
.env.local.bak` to fall through to ungated localStorage-only mode (restore +
restart before shipping).

---

## Project Structure

```
capacitor.config.ts          # Native app config (appId, webDir: 'out')
ios/                         # Generated Capacitor Xcode project
next.config.ts               # output: 'export' + unoptimized images
src/
├── app/
│   ├── layout.tsx           # Root layout, fonts, AuthGate + CapacitorInit
│   ├── page.tsx             # View state machine, plan state, session pull,
│   │                        # floating back-pill (hidden on gym/cardio)
│   ├── design/ + mockup/    # Dev routes (token reference, screen gallery)
├── components/
│   ├── auth/AuthGate.tsx    # Splash + 6-digit code sign-in
│   ├── native/CapacitorInit.tsx  # Native-only init (status bar safe-area)
│   ├── ui/sheet.tsx         # Sheet primitive (Overlay Contract)
│   └── workout/
│       ├── Dashboard.tsx · SessionStart · SessionPreview
│       ├── GymWorkout.tsx · CardioWorkout.tsx · LiveCardio.tsx  # live HR session
│       ├── SessionSummary · PRMomentScreen · WorkoutHistory
│       ├── BloodPressureSheet · ReorderExercisesSheet · WorkoutTimerBar
│       └── Timer · IntervalFlow · ExerciseAutocomplete
├── hooks/
│   ├── useWorkout.ts        # Session management
│   ├── useHeartRate.ts      # BLE HR (native-only)
│   ├── useCloudSync.ts      # Upstash bootstrap — inert shim (retired)
│   └── useTimer.ts
└── lib/
    ├── types.ts · storage.ts · utils.ts · exercises.ts · brief.ts
    ├── hr-zones.ts          # Trainer HR zones + time-in-zone helpers
    ├── sounds.ts            # Web Audio (explosion = PR only)
    ├── supabase.ts · plan-sync.ts · prs-sync.ts · bp-sync.ts
    ├── session-sync.ts      # push (on finish) + pull (cross-device hydrate)
    ├── sync.ts · sync-merge.ts  # Upstash retired (inert shim / merge kept for import)
    └── plan-validation.ts
```

---

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Context for Claude Code — architecture, decisions, key files, gotchas (the living reference) |
| `DESIGN.md` | Volume System — design philosophy: volumes, type system, color, motion, Overlay Contract |
| `MOCKUP_AUDIT.md` | Living punch list — shipped vs. open against the `/mockup` spec |
| `BACKLOG.md` | Prioritized feature backlog |
| `bugs-june12.md` | Bug log (resolved + open known issues) |
| `AGENTS.md` | Next.js version note for agents writing code |
| `_archive/` | Historical docs — v1 design system, retrowave assets, old audits/specs, the Supabase cutover spec — see `_archive/README.md` |
| `../trainer-os/` | PUMP OS system docs — trainer setup, formats, user guide |

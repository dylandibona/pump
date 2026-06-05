# PUMP Fix Specs

Five bugs/features, prioritized. Each section includes the problem, the fix, and pseudocode you can take straight into the codebase.

---

## 1. PR Calculation Is Broken (Critical)

**Problem:** The app computes PR by taking `max(weight)` across all sets and `max(reps)` across all sets, then combining them. This produces fabricated numbers. Screenshot example: sets of 70×15 and 90×10 produced a displayed PR of "90 × 15," which never happened.

**Fix:** Evaluate PR per individual set using estimated 1RM (e1RM). Compare each set's e1RM against the stored best e1RM for that exercise. The set with the highest e1RM is the best set. If that best set's e1RM exceeds the stored record, it is a PR.

**Formula (Epley):**

```
e1RM = weight × (1 + reps / 30)
```

For single-rep sets, e1RM = weight. For reps > 30, cap at 30 for the formula (high-rep sets are poor e1RM predictors).

**Display:** Show the actual set that produced the PR, e.g., "PR: 90 × 10" (the real set), not a frankenstein composite.

**Pseudocode:**

```javascript
function computeE1RM(weight, reps) {
  if (weight === 0 || reps === 0) return 0;
  const cappedReps = Math.min(reps, 30);
  return weight * (1 + cappedReps / 30);
}

function evaluatePR(exerciseName, currentSets, prHistory) {
  const previousBest = prHistory[exerciseName] || null;
  let sessionBest = null;

  for (const set of currentSets) {
    if (set.isWarmup) continue;
    const e1rm = computeE1RM(set.weight, set.reps);
    if (!sessionBest || e1rm > sessionBest.e1rm) {
      sessionBest = { weight: set.weight, reps: set.reps, e1rm };
    }
  }

  if (!sessionBest) return { isPR: false };

  // No previous record exists: this is a baseline, not a PR
  if (!previousBest) {
    return {
      isPR: false,
      isBaseline: true,
      best: sessionBest
    };
  }

  // Compare against stored best
  if (sessionBest.e1rm > previousBest.e1rm) {
    return {
      isPR: true,
      best: sessionBest,
      previousBest
    };
  }

  return { isPR: false, best: sessionBest };
}
```

**Storage:** For each exercise, persist:

```javascript
prHistory[exerciseName] = {
  weight: Number,
  reps: Number,
  e1rm: Number,
  date: ISO8601String
};
```

Update this record only when a true PR is confirmed (not on baseline establishment).

---

## 2. PR Fires on First-Ever Exercise (Critical)

**Problem:** Every set on a brand new exercise triggers the PR sound/badge because it "beats" a previous best of zero/null. Seated Cable Row had never been logged before. Every set was treated as a record.

**Fix:** The first session of any exercise establishes a baseline. PR notifications are suppressed until at least one prior session exists for that exercise.

This is handled in the pseudocode above via the `isBaseline` flag. The UI should:

- Save the best set as the stored record silently
- Display a "Baseline Set" badge (subtle, informational, no celebration)
- Never play the PR sound
- Never show the PR banner/animation

**Pseudocode (notification gate):**

```javascript
function handleSetCompletion(exerciseName, set, prHistory) {
  const result = evaluatePR(exerciseName, allSetsThisExercise, prHistory);

  if (result.isBaseline) {
    // First time doing this exercise
    // Store the baseline silently
    prHistory[exerciseName] = {
      weight: result.best.weight,
      reps: result.best.reps,
      e1rm: result.best.e1rm,
      date: new Date().toISOString()
    };
    showBaselineBadge(exerciseName, result.best);
    // NO sound, NO celebration
    return;
  }

  if (result.isPR) {
    // Genuine PR against established history
    prHistory[exerciseName] = {
      weight: result.best.weight,
      reps: result.best.reps,
      e1rm: result.best.e1rm,
      date: new Date().toISOString()
    };
    playPRSound();       // background audio, see spec #3
    showPRCelebration(exerciseName, result.best);
  }
}
```

---

## 3. PR Sound Interrupts Audio Playback

**Problem:** The PR celebration sound pauses or ducks whatever music/podcast is playing through the phone. On iOS this happens when an audio element uses the default audio session category, which takes exclusive control of the audio output.

**Fix:** Play the PR sound as a non-interrupting background sound that mixes with existing audio playback.

**Option A (Web Audio API, recommended for a PWA):**

```javascript
let audioContext = null;
let prSoundBuffer = null;

async function initPRSound() {
  // Create AudioContext with 'ambient' hint where supported
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch('/sounds/pr-chime.mp3');
  const arrayBuffer = await response.arrayBuffer();
  prSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
}

function playPRSound() {
  if (!audioContext || !prSoundBuffer) return;

  // Resume context if suspended (iOS requires user gesture first)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const source = audioContext.createBufferSource();
  source.buffer = prSoundBuffer;

  // Optional: reduce volume so it layers nicely over music
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.6;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}
```

Web Audio API plays through the existing audio session without interrupting other apps. The sound mixes on top of music/podcasts.

**Option B (if using Capacitor/native wrapper):**

Set the iOS audio session category to `AVAudioSessionCategoryAmbient` or use `AVAudioSessionCategoryPlayback` with the `.mixWithOthers` option before playing the sound. This is a native-level config that prevents the app from claiming exclusive audio.

**Sound design note:** Keep the PR chime short (under 2 seconds), mid-frequency, and distinct. A brief synth tone or a single clean bell hit works. Avoid bass-heavy sounds that compete with music.

---

## 4. No Workout Preview on Session Load

**Problem:** When you start a session, the app drops you into a blank workout with no visibility into what exercises are programmed, what weights and reps the trainer recommends, or how many sets to expect. You're flying blind until you manually add exercises.

**Fix:** Add a Session Preview screen that displays all programmed exercises from the imported plan JSON, including the trainer's recommended weights and rep targets. The user reviews the full session, can adjust target weights/reps before starting, then taps "Start Session" to begin logging.

**Data source:** The plan JSON already contains everything needed. Each exercise object has `name`, `sets`, `targetReps`, `targetWeight`, `isBodyweight`, `notes`, and `supersetWith`.

**Preview screen spec:**

```
┌─────────────────────────────────────────┐
│  SESSION B — Pull                       │
│  Reboot Block 1 — Push / Pull / Legs    │
│  5 exercises · ~35 min                  │
│─────────────────────────────────────────│
│                                         │
│  1. Barbell Row                         │
│     4 sets · 8-10 reps · 95 lbs  [edit] │
│     "Pull to lower chest. Control the   │
│      lowering."                         │
│                                         │
│  2. Lat Pulldown                        │
│     3 sets · 10-12 reps · 100 lbs [edit]│
│     "Wide grip. Pull to upper chest."   │
│                                         │
│  3. Cable Row                           │
│     3 sets · 12-15 reps · 100 lbs [edit]│
│     "Neutral grip. Drive elbows back."  │
│                                         │
│  4. Face Pull  ⚡ w/ Hammer Curl        │
│     3 sets · 15-20 reps · 30 lbs [edit] │
│                                         │
│  5. Hammer Curl  ⚡ w/ Face Pull        │
│     3 sets · 12-15 reps · 30 lbs [edit] │
│                                         │
│─────────────────────────────────────────│
│                                         │
│         [ START SESSION ]               │
│                                         │
└─────────────────────────────────────────┘
```

**Key behaviors:**

- Weights and reps shown are the trainer's recommendations from the plan JSON (`targetWeight`, `targetReps`)
- Each exercise row has an [edit] control that lets the user adjust weight and/or rep target before starting. This is for days when you know you need to go lighter (fatigue, injury flare) or want to push heavier. Adjustments are session-local and do not modify the stored plan.
- Superset pairings are visually grouped and labeled
- Trainer notes for each exercise are shown collapsed by default, expandable on tap
- Tapping "Start Session" creates the workout with all exercises pre-loaded at the displayed weights and rep targets. No more adding exercises one by one mid-workout.

**Pseudocode:**

```javascript
function SessionPreview({ session, plan }) {
  // session = the specific session object from plan.sessions[]
  // plan = the full plan object for metadata

  const [adjustedExercises, setAdjustedExercises] = useState(
    session.exercises.map(ex => ({
      ...ex,
      adjustedWeight: ex.targetWeight,
      adjustedReps: ex.targetReps
    }))
  );

  function handleWeightAdjust(index, newWeight) {
    const updated = [...adjustedExercises];
    updated[index].adjustedWeight = newWeight;
    setAdjustedExercises(updated);
  }

  function handleRepsAdjust(index, newReps) {
    const updated = [...adjustedExercises];
    updated[index].adjustedReps = newReps;
    setAdjustedExercises(updated);
  }

  function startSession() {
    // Create workout with all exercises pre-populated
    const workout = {
      sessionId: session.id,
      sessionName: session.name,
      planId: plan.planId,
      startTime: new Date().toISOString(),
      exercises: adjustedExercises.map(ex => ({
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.adjustedReps,
        targetWeight: ex.adjustedWeight,
        isBodyweight: ex.isBodyweight,
        supersetWith: ex.supersetWith,
        notes: ex.notes,
        completedSets: []  // empty, user fills during workout
      }))
    };

    navigateToActiveWorkout(workout);
  }

  return (
    // Render preview UI with exercise list,
    // editable weight/rep fields, and Start button
  );
}
```

**During the active workout:** Each exercise should show the target weight and rep range from the preview (or the user's adjusted values) as a reference line above the logging area. Something like:

```
BARBELL ROW
Target: 4 × 8-10 @ 95 lbs

SET   WEIGHT   REPS
 1     95       10    ✓
 2     95        8    ✓
 3     _        _
 4     _        _
```

This way the user always knows what the plan calls for while logging actuals.

---

## 5. Investigate Cumulative Volume PR Logic

**Problem (suspected):** The PR system may also be tracking total session volume (weight × reps summed across all sets) or total reps for an exercise, and triggering PRs based on those aggregate numbers rather than individual set quality. This would cause false PRs any time you add an extra set or do slightly more total reps.

**Fix:** PRs should only be tracked on a per-set basis using e1RM as defined in spec #1. Remove any cumulative volume or total-reps PR tracking from the notification/celebration system.

Volume tracking is still useful as a data point in the BRIEF export, but it should never trigger a PR notification. Volume PRs are a different category entirely and would need their own opt-in toggle if you ever want them.

**Audit checklist for the codebase:**

```
[ ] Find where PR is calculated — confirm it uses per-set e1RM
[ ] Search for any code that sums weight*reps across sets
[ ] Search for any code that takes max(weight) and max(reps) separately
[ ] Search for any code that compares total session volume
[ ] Remove or gate any of the above behind a separate "Volume PR" toggle
[ ] Confirm PR badge text matches the actual set (weight × reps from one set)
```

---

## Implementation Priority

1. **Fix PR calculation** (spec #1 + #2 + #5) — these are all the same system. Fix the core logic, add the baseline gate, and audit for volume-based false triggers. Ship together.
2. **Session Preview** (spec #4) — this changes the core UX loop and makes the app actually useful for following a plan.
3. **PR sound mixing** (spec #3) — quality of life, lower urgency but easy win.

---

## BRIEF Export Enhancement (Bonus)

Once the PR logic is fixed, update the BRIEF text export to reflect accurate PRs:

```
SEATED CABLE ROW (target: 3×12-15 @ 100lbs)
  Set 1: 70lbs × 15
  Set 2: 90lbs × 10
  Baseline established: 90×10 (e1RM: 117)
```

On subsequent sessions where a real PR occurs:

```
SEATED CABLE ROW (target: 3×12-15 @ 100lbs)
  Set 1: 100lbs × 12
  Set 2: 100lbs × 15 ⚡ PR (e1RM: 150, prev: 117)
```

This gives me (the TRAINER) clean, trustworthy data in the BRIEF instead of fabricated numbers.

# PUMP Bug Fixes and Feature Specs

Five fixes, prioritized. Implement specs 1, 2, and 5 together (same PR system). Then spec 4. Then spec 3.

---

## Fix 1: PR Calculation Is Broken (Critical)

**Bug:** PR is computed by taking `max(weight)` across all sets and `max(reps)` across all sets, then combining them. This produces numbers that never happened. Example: sets of 70x15 and 90x10 produce a displayed PR of "90 x 15."

**Fix:** Evaluate PR per individual set using estimated 1RM (e1RM).

**Formula (Epley):**

```
e1RM = weight * (1 + reps / 30)
```

Cap reps at 30 for the formula. Single-rep sets: e1RM = weight.

**Display:** Show the actual set that produced the PR. "PR: 90 x 10" (the real set), never a composite.

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

  if (!previousBest) {
    return { isPR: false, isBaseline: true, best: sessionBest };
  }

  if (sessionBest.e1rm > previousBest.e1rm) {
    return { isPR: true, best: sessionBest, previousBest };
  }

  return { isPR: false, best: sessionBest };
}
```

**Storage per exercise:**

```javascript
prHistory[exerciseName] = {
  weight: Number,
  reps: Number,
  e1rm: Number,
  date: ISO8601String
};
```

Update only on confirmed PR, not baseline.

---

## Fix 2: PR Fires on First-Ever Exercise (Critical)

**Bug:** Every set on a brand new exercise triggers the PR sound/badge because it "beats" a previous best of zero/null.

**Fix:** First session of any exercise = baseline. Suppress all PR notifications.

- Save the best set as the stored record silently
- Display a subtle "Baseline" badge (no celebration)
- Never play the PR sound
- Never show the PR animation

This is handled by the `isBaseline` flag in the evaluatePR function above.

```javascript
function handleSetCompletion(exerciseName, allSetsThisExercise, prHistory) {
  const result = evaluatePR(exerciseName, allSetsThisExercise, prHistory);

  if (result.isBaseline) {
    prHistory[exerciseName] = {
      weight: result.best.weight,
      reps: result.best.reps,
      e1rm: result.best.e1rm,
      date: new Date().toISOString()
    };
    showBaselineBadge(exerciseName, result.best);
    return;
  }

  if (result.isPR) {
    prHistory[exerciseName] = {
      weight: result.best.weight,
      reps: result.best.reps,
      e1rm: result.best.e1rm,
      date: new Date().toISOString()
    };
    playPRSound();
    showPRCelebration(exerciseName, result.best);
  }
}
```

---

## Fix 3: PR Sound Interrupts Audio Playback

**Bug:** PR sound pauses/ducks music or podcasts playing through the phone.

**Fix:** Use Web Audio API so the sound mixes with existing playback.

```javascript
let audioContext = null;
let prSoundBuffer = null;

async function initPRSound() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch('/sounds/pr-chime.mp3');
  const arrayBuffer = await response.arrayBuffer();
  prSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
}

function playPRSound() {
  if (!audioContext || !prSoundBuffer) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  const source = audioContext.createBufferSource();
  source.buffer = prSoundBuffer;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.6;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}
```

Call `initPRSound()` once on first user interaction (button tap). Web Audio API plays through the existing audio session without interrupting other apps.

Keep the chime under 2 seconds, mid-frequency, clean tone.

---

## Fix 4: No Workout Preview on Session Load

**Bug:** Starting a session drops the user into a blank workout. No visibility into what exercises are programmed, what weights the trainer recommends, or how many sets to expect.

**Fix:** Add a Session Preview screen.

### Data source

The plan JSON has everything needed. Each exercise object contains: `name`, `sets`, `targetReps`, `targetWeight`, `isBodyweight`, `notes`, `supersetWith`.

### Preview screen behavior

1. Show all exercises from the session with trainer-recommended weights and rep ranges
2. Each exercise row has an Edit control for pre-session weight/rep adjustment
3. Superset pairings are visually grouped
4. Trainer notes per exercise are collapsed by default, expandable on tap
5. "Let's Go" button creates the workout with all exercises pre-loaded at displayed weights

### Implementation

```javascript
function SessionPreview({ session, plan }) {
  const [exercises, setExercises] = useState(
    session.exercises.map(ex => ({
      ...ex,
      adjustedWeight: ex.targetWeight,
      adjustedReps: ex.targetReps
    }))
  );

  function handleWeightAdjust(index, newWeight) {
    const updated = [...exercises];
    updated[index].adjustedWeight = newWeight;
    setExercises(updated);
  }

  function startSession() {
    const workout = {
      sessionId: session.id,
      sessionName: session.name,
      planId: plan.planId,
      startTime: new Date().toISOString(),
      exercises: exercises.map(ex => ({
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.adjustedReps,
        targetWeight: ex.adjustedWeight,
        isBodyweight: ex.isBodyweight,
        supersetWith: ex.supersetWith,
        notes: ex.notes,
        completedSets: []
      }))
    };
    navigateToActiveWorkout(workout);
  }

  return (/* Preview UI */);
}
```

### During the active workout

Each exercise shows the target from the preview as a reference:

```
BARBELL ROW
Target: 4 x 8-10 @ 95 lbs

SET   WEIGHT   REPS
 1     95       10    ✓
 2     95        8    ✓
 3     _        _
 4     _        _
```

---

## Fix 5: Audit for Cumulative Volume PR Logic

**Bug (suspected):** PR system may also track total session volume or total reps, causing false PRs when you add an extra set or do more total reps.

**Fix:** PRs are per-set only, using e1RM. Remove any volume-based or total-reps PR logic from the notification system.

Volume tracking is useful in the BRIEF export, but never triggers a PR celebration.

**Codebase audit:**

```
[ ] Find where PR is calculated. Confirm per-set e1RM.
[ ] Search for code that sums weight*reps across sets.
[ ] Search for code that takes max(weight) and max(reps) separately.
[ ] Search for code that compares total session volume.
[ ] Remove or gate behind a "Volume PR" toggle.
[ ] Confirm PR badge text matches actual set data.
```

---

## BRIEF Export Enhancement

Update the BRIEF text export for accurate PR data:

First session of an exercise:
```
SEATED CABLE ROW (target: 3x12-15 @ 100lbs)
  Set 1: 70lbs x 15
  Set 2: 90lbs x 10
  Baseline established: 90x10 (e1RM: 117)
```

Subsequent session with real PR:
```
SEATED CABLE ROW (target: 3x12-15 @ 100lbs)
  Set 1: 100lbs x 12
  Set 2: 100lbs x 15 ⚡ PR (e1RM: 150, prev: 117)
```

# PUMP — Comprehensive Code Review

**Scope:** `src/**` (lib, hooks, components/workout), `src/app/page.tsx`, `src/app/layout.tsx`, config files.
**Commit range:** through `a5eb913`.
**Audit date:** 2026-04-20.

## Executive summary

The app is small, coherent, and generally well-written for a personal client-side PWA. The PR rewrite to per-set Epley e1RM is solid, and the Miami Heat Wave redesign is visually consistent. However, there are **several recurring structural issues** that the recent plan-preload race was a symptom of — not an isolated incident.

**Top 5 by severity:**

1. **BLOCKER (systemic):** Every mutator in `useWorkout` uses `useCallback(..., [session])`, which means any two mutations dispatched in the same tick (or within a single render cycle before `setSession` flushes) race against each other and clobber state. `bulkAddExercises` fixed *one* instance of this pattern, but the footgun is still present everywhere — e.g. `addSet` followed by `addCardioEntry` in quick succession, or rest-timer auto-advances. **Needs a functional-updater refactor.**
2. **BLOCKER:** Referenced asset `/timer-complete.mp3` (in `useTimer.ts:36`) does not exist in `public/`. The `Timer` / `RestTimerInline` components silently swallow the 404 — **timer-completion audio is broken in production**. Vibration still works. `sounds.ts` correctly uses the Web Audio asset, but `useTimer` uses a separate HTMLAudioElement path with a broken URL.
3. **BLOCKER:** Orphan audio asset `public/Short But Big Action Movie Explosion.mp3` vs the referenced `public/Short But Huge, Very Action Bomb Movie Explosion.mp3`. Untracked by git. Either replace or remove.
4. **MAJOR:** `checkAndUpdatePRs` runs on **every** `saveSession` call, not just at session-complete. Because every keystroke in a weight/reps Input writes to storage (via `updateSet` → `saveSession`), PRs can be set from in-progress half-typed sets. More importantly: **removing a set that was a PR does not roll the PR back.** False PRs can become permanent.
5. **MAJOR:** PWA manifest `background_color`/`theme_color` are `#0f1419` (legacy dark theme), but `layout.tsx` declares `themeColor: '#F0FCFB'` (Miami Heat Wave light) and `appleWebApp.statusBarStyle: 'default'`. iOS standalone shows the dark color on launch splash while the browser chrome gets light. **Visually inconsistent when installed as PWA.**

---

## Findings by severity

### BLOCKER

#### B1. `useWorkout` mutators share a stale-closure / write-race pattern (systemic)
**File:** `src/hooks/useWorkout.ts` lines 75–393
**What:** All mutators (`addExercise`, `addSet`, `updateSet`, `removeSet`, `removeExercise`, `updateExerciseNotes`, `updateExerciseWeightType`, `linkSuperset`, `unlinkSuperset`, `addCardioEntry`, `updateCardioEntry`, `removeCardioEntry`, `logInterval`, `completeSession`, `updateSessionNotes`) read `session` from closure, build an updated object, then call `setSession(updatedSession)` + `saveSession(updatedSession)`.
**Why it matters:** If two mutations dispatch from the same `session` snapshot (e.g. React 18 auto-batching, a `setTimeout` pair, a rapid double-tap, or an effect that triggers a follow-up mutation), the second uses the first's stale `session`. The second `saveSession` clobbers the first in localStorage. This is exactly the bug that `bulkAddExercises` was created to work around — but the same hazard exists across *every* mutator.
**Fix (architectural):** Convert every mutator to the functional `setSession(prev => ...)` form, and call `saveSession` using the *computed next state* (either inside the updater or via an `useEffect(() => saveSession(session), [session])` that syncs storage to state monotonically). Alternatively, make `saveSession` itself a read-merge-write that accepts a session patch rather than a full replacement.

#### B2. `/timer-complete.mp3` does not exist in `public/`
**File:** `src/hooks/useTimer.ts:36`
**What:** `audioRef.current = new Audio('/timer-complete.mp3')`. The asset was never added; `.play()` rejects and the `.catch(() => {})` swallows it. Rest timer completion chime is silently broken.
**Why it matters:** Mid-lift audio cue is a core feature — user relies on it without looking at the phone.
**Fix:** Route `useTimer` completion through `playSound('timerDone')` from `sounds.ts` (Web Audio path — also avoids iOS audio-session ducking that the current HTMLAudioElement path triggers).

#### B3. Orphan audio asset
**Files:** `public/Short But Big Action Movie Explosion.mp3` vs `public/Short But Huge, Very Action Bomb Movie Explosion.mp3`
**What:** Two similarly-named files; only the "Huge" one is referenced. The other is untracked per `git status`.
**Fix:** Delete orphan or replace if intended.

### MAJOR

#### M1. PR evaluation runs on every micro-edit; no rollback on set removal
**Files:** `src/lib/storage.ts` `saveSession` (line 74) → `checkAndUpdatePRs` (line 131)
**What:** `saveSession` unconditionally runs `checkAndUpdatePRs`. Every keystroke in `updateSet` (weight/reps Input `onChange`) calls `saveSession`. Intermediate typed values (e.g. "2" → "22" → "225") pass through PR logic. If a user logs a PR set, then realizes a typo and *removes* the set via `removeSet`, the PR record already stored in `personalRecords` is **not reversed**.
**Fix:** Move PR commit to `completeSession` only (a `finalizePRs(sessionId)` that re-derives the single best set per exercise from the completed session and commits atomically). In-progress `saveSession` should never touch `personalRecords`.

#### M2. PWA manifest color mismatch
**Files:** `public/manifest.json` (`background_color`/`theme_color: #0f1419`), `src/app/layout.tsx:58` (`themeColor: '#F0FCFB'`)
**What:** Manifest still carries the old dark-theme colors. Metadata `viewport.themeColor` is the Miami Heat Wave light background. They disagree.
**Fix:** Update `manifest.json` to `"background_color": "#F0FCFB"` and `"theme_color": "#F0FCFB"`. Also consider adding a 180×180 PNG `apple-touch-icon` for iOS home-screen install.

#### M3. Concurrent `setInterval` leak in `useTimer.resume`
**File:** `src/hooks/useTimer.ts:100–118`
**What:** `resume()` builds a new `setInterval` and assigns to `intervalRef.current` without first calling `clearTimer()`. If caller hits `resume` while `isRunning` is already true (double-tap, state desync), the previous interval keeps ticking — we leak it. Cleanup on unmount only clears the current ref.
**Fix:** Call `clearTimer()` on the first line of `resume()`.

#### M4. `prSnapshotRef` not populated when editing an existing session
**Files:** `src/components/workout/GymWorkout.tsx:86–92`; `src/hooks/useWorkout.ts:46–58`
**What:** `prSnapshotRef` is set in `startSession` but **not** in the `useEffect` that loads a session by id (edit-from-history flow). Editing a completed session and logging a new top set reads `preSessionBest === undefined`, marks it as a baseline (silent), and misses the celebration — and could interfere with `checkAndUpdatePRs` ordering.
**Fix:** In the `sessionId`-load effect, also populate `prSnapshotRef.current` from `getPRs()`.

#### M5. `updateSet` persists on every keystroke → storage thrash
**File:** `src/hooks/useWorkout.ts:159–178`, called by `GymWorkout.tsx:649` `onChange`
**What:** Every character typed into a weight or reps Input triggers `parseFloat(...)||0`, a full `saveSession` (deep clone + JSON-stringify the entire `WorkoutData`), and a PR recheck. For a 2-hour session with ~40 sets, thousands of stringify-write ops. On large session histories, `JSON.stringify(data)` grows linearly.
**Fix:** Debounce writes, or track each Input in local component state and push to the hook on blur / set-commit / unmount. Same pattern `SessionSummary` uses for notes.

#### M6. `getNextPlanSession` matching is brittle
**File:** `src/lib/storage.ts:337–363`
**What:** Matches last completed plan session via `log.notes` substring (rarely contains the plan-session name) or via `log.exercises[0].name` heuristic. If two plan sessions start with the same exercise (Bench Press, say), the match is wrong and rotation advances from the wrong session.
**Fix:** Store `planSessionId` on `WorkoutSession` at `startSession` time and use it for rotation.

#### M7. `SessionPreview` doesn't preserve superset linkage into the running session
**Files:** `src/components/workout/SessionPreview.tsx:38–40`; plan-preload effect in `GymWorkout.tsx:63–78`
**What:** `PlanExercise.supersetWith` is shown in the preview, but when `bulkAddExercises` pre-fills the running session, only `name` and `sets` are copied — `supersetGroupId` isn't set for paired exercises. User arrives in the gym view with no linkage and has to manually re-link every pair.
**Fix:** Build a name→index map, generate shared `supersetGroupId` for each pair, pass through `bulkAddExercises` (extend it to accept optional `supersetGroupId`, `equipment`, `weightType`).

#### M8. `handleWorkoutComplete` non-null assertion
**File:** `src/app/page.tsx:80`
**What:** `getSession(activeSessionId!)` — if null at that moment, silently returns undefined and the update no-ops.
**Fix:** Guard: `if (!activeSessionId) return;`.

#### M9. Stats predicate inconsistency across surfaces
**Files:** `SessionSummary.tsx:64–72`, `storage.ts:263–273`, `useWorkout.ts:411–422`, `brief.ts:104`
**What:** Four different definitions of "working set":
- `SessionSummary` volume: `!s.isWarmup`
- `storage.getWorkoutStats`: `!s.isWarmup && !s.isPlanned`
- `useWorkout.getSessionStats.totalSets`: `!s.isWarmup && !s.isPlanned`
- `brief.ts` volume: `!s.isWarmup && !s.isBodyweight`
The same session shows different set counts in summary vs. in-session stats card.
**Fix:** Export one canonical `isWorkingSet(s)` predicate from `storage.ts` and use it everywhere.

#### M10. Preview rep-midpoint regex is fragile
**File:** `src/components/workout/SessionPreview.tsx:31`
**What:** `midpointReps('10-12')` works; `midpointReps('10–12')` (en-dash) falls through to default; `AMRAP` returns 10. Trainer-generated JSON commonly uses en-dashes.
**Fix:** Normalize dashes before match; document grammar in `types.ts`.

### MINOR

- **N1** `WorkoutHistory.tsx:74` `thisMonthCount` uses `new Date(s.date)` — same UTC-rolling bug `parseSessionDate` fixes elsewhere. Last-day-of-month attributed to prior month in west-of-UTC TZs.
- **N2** `GymWorkout.tsx:571` exercise-history preview dates use `new Date(entry.date).toLocaleDateString`. Same class of bug.
- **N3** `getRecentSessions` / `getExerciseHistory` sort uses `new Date` on YYYY-MM-DD. Ordering works since both operands shift identically, but mixing with ISO timestamps would break.
- **N4** `duplicateLastSet` duplicates `isPlanned: true` placeholders. User intent is always "repeat the last thing I actually did."
- **N5** `linkSuperset` only takes two ids — can't extend a pair to a trio.
- **N6** `SessionSummary.handleSendToTrainer` ordering: `buildBrief` rebuilds from React `notes` state, which is fine for the brief text but mildly confusing if a future refactor adds memoization.
- **N7** `completeSession` doesn't strip `isPlanned: true` sets. BRIEF's per-set loop only skips warmups (line 50), so skipped planned slots appear as `Set N: 0lbs × 0`. Inflates `totalSets` in summary too.
- **N8** `Dashboard.formatVolume`: K-suffix uses `toFixed(0)` while M-suffix uses `toFixed(1)`. 1500 → "2K" (should be "1.5K").
- **N9** `CardioWorkout` passes unused `onUpdate` to `CardioEntryCard`. Dead prop.
- **N10** No error boundary. A render throw (malformed plan JSON, etc.) blanks the whole app.
- **N11** `exportData`/`importData` have no schema versioning. Corrupted backup JSON overwrites everything with no validation or diff.
- **N12** `IntervalRunner` advance path: `currentStepRef` updates in an effect after paint, so the running interval can briefly see the old step. 100ms tick + the `Math.max(0, …)` guard mitigate but pattern is racy. Sync the ref inside `advance.current`.
- **N13** `IntervalRunner` fires `playPRFeedback()` on sequence completion — semantically "this is a PR" when it isn't.
- **N14** `WorkoutTimerBar` cancel-rest button is 28×28, below the 44×44 iOS HIG minimum.
- **N15** `SessionStart.tsx:87` — yesterday-check IIFE re-runs every render. Extract to a memo.
- **N16** No service worker. App won't load on airplane mode despite being a PWA.
- **N17** Plan validation in `PlanLoader.tsx:32` only checks `planId` and non-empty `sessions`. Malformed exercise shapes render-crash downstream.
- **N18** `patchSession` race: `SessionSummary` patches notes while `useWorkout` still holds a pre-patch session in closure — a subsequent mutator would clobber. Not hit today; latent.

### NIT

- **NT1** `storage.ts:367` — `substr` is deprecated.
- **NT2** `storage.ts:304` — `JSON.parse(jsonString) as WorkoutData` is unchecked.
- **NT3** `GymWorkout.tsx:595` — `setNumber` computation is O(N²); N<20 so harmless.
- **NT4** `CardioWorkout.tsx:512` — `pl-18` isn't a default Tailwind class; likely renders with no left padding.
- **NT5** `Dashboard.tsx:31` — backup filename uses UTC date.
- **NT6** `brief.ts:95` — safe.
- **NT7** `useWorkout.ts:413` — `|| 0` where `?? 0` would be stricter.
- **NT8** `useTimer.ts:30` — `NodeJS.Timeout` typed in a client-only hook. Prefer `ReturnType<typeof setInterval>`.
- **NT9** `IntervalFlow.tsx:132` — `PRESETS[3].build()` relies on array-index coupling. Reorder breaks default.
- **NT10** `GymWorkout.tsx:649/659` — `parseFloat(v) || 0` makes it impossible to clear a field (cursor shows 0 on delete).
- **NT11** Superset lightning `⚡` button is emoji-only with only a `title` — screen readers say "high voltage sign". Add `aria-label="Remove from superset"`.
- **NT12** `SessionStart.tsx:76` — `disabled={(d) => d > new Date()}` may disable today in some picker internals.
- **NT13** `SessionSummary.tsx:31` — `useState(session.notes ?? '')` initializes once; stale if notes change externally.

---

## Best-practice recommendations

1. **Functional state updates everywhere in `useWorkout`.** Retires the B1 class of bugs entirely and eliminates the need for `bulkAddExercises`-style workarounds.
2. **Single source of truth for persistence.** Consolidate the three reader paths (`useWorkout` state, `SessionSummary` props+patch, `page.tsx`'s direct `getSession`) behind one source — a small pub/sub over localStorage with `useSyncExternalStore`, or a narrow in-memory cache.
3. **Codify "working set" predicate** — one function used everywhere for volume, counts, brief, PR eval.
4. **Schema versioning + Zod** for `WorkoutData` and `TrainerPlan`. Validate at edges (load/import/paste).
5. **Persist debounced, not per-keystroke.** Track each Input in local state; push on blur.
6. **Error boundary + export reminder.** Low cost, high value for a client-only app.
7. **Plumb `planSessionId` through `startSession`** so plan rotation is deterministic.
8. **Service worker.** Cache shell + fonts + audio so the app works truly offline.
9. **Sync PWA manifest to design tokens.** Same source of truth as CSS custom properties.
10. **Replace `useTimer`'s HTMLAudioElement with the Web Audio path from `sounds.ts`** — fixes B2 and avoids iOS audio-session ducking.

---

## Questions for maintainer

1. **PR rollback on set deletion** — intentionally "forward-only" (once set, immortal even on typo)? Or should it re-derive?
2. **Intra-session PR celebration gating** — only the first PR-breaking set fires the banner; if two fire in one session, is one enough?
3. **`isPlanned` sets after completion** — strip them or preserve as "skipped" signals for the trainer?
4. **Plan-session → running-session linkage** — record `planSessionId` on completed sessions (enables rotation + adherence)?
5. **"Edit session" flow** — should PR re-evaluation happen retroactively?
6. **Superset preservation from plan** — deliberate simplification or oversight?
7. **Offline requirement** — is airplane-mode / gym-basement support in scope?
8. **Theme-color for dark mode** — or is Miami Heat Wave always-on?
9. **`exportData` reminders** — auto-backup, or rely on Dylan remembering?

---

**End of review.** Highest ROI next move: the `useWorkout` mutator refactor (B1), because it retires an entire class of bugs you'll otherwise keep discovering one symptom at a time.

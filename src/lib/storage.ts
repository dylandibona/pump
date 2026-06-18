import { WorkoutData, WorkoutSession, PersonalRecord, WorkoutTemplate, UserSettings, GymExercise, GymSet, TrainerPlan, ExerciseStatus, BPReading } from './types';
import { normalizeExerciseName } from './exercises';
import { mergeEnvelopes, type SyncEnvelope } from './sync-merge';

const STORAGE_KEY = 'dylan-workout-tracker';

// When true, writes skip the 'pump:changed' notification. Set while applying
// data pulled from the cloud so the merge result doesn't echo back as a push.
let silentWrite = false;

// Broadcast that local data changed so the cloud-sync layer can schedule a
// push. No-op on the server and during silent (remote-applied) writes.
function emitChanged(): void {
  if (typeof window !== 'undefined' && !silentWrite) {
    window.dispatchEvent(new Event('pump:changed'));
  }
}

// Default settings
const defaultSettings: UserSettings = {
  defaultRestTime: 90,
  weightUnit: 'lbs',
  distanceUnit: 'miles',
};

// Default data structure
const defaultData: WorkoutData = {
  sessions: [],
  personalRecords: [],
  templates: [],
  settings: defaultSettings,
};

// Estimated 1RM using Epley formula. High-rep sets are poor predictors,
// so reps are capped at 30 before applying the formula. e1RM is kept for
// BRIEF display but is NOT the PR comparison field — PRs compare by weight.
export function computeE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  const cappedReps = Math.min(reps, 30);
  return weight * (1 + cappedReps / 30);
}

// Minimum reps required for a set to qualify as a PR candidate. A 1-rep max
// or a heavy single doesn't count — PR means a working-weight lift held for
// at least this many clean reps.
export const MIN_PR_REPS = 6;

// Canonical predicate for "working set" — the set of sets that count for
// volume, stats, and PR eligibility. Single source of truth; components and
// computations must route through this. Warmups, planned placeholders,
// bodyweight sets, and empty rows (zero weight or zero reps) are excluded.
export function isWorkingSet(s: GymSet): boolean {
  return !s.isWarmup && !s.isPlanned && !s.isBodyweight && s.weight > 0 && s.reps > 0;
}

// Auto-derive per-exercise status from what the user actually logged
// (review C1 — trainer thresholds). The user can override on the summary
// screen if auto got it wrong.
//
// Thresholds agreed with trainer:
//   skipped:   0 sets logged, OR <25% of planned sets completed.
//   partial:   25-74% of planned sets, OR >=75% sets but avg load <70% of target.
//   completed: >=75% of planned sets AND (load check passes, or no target).
//
// Load check: skipped for bodyweight exercises (no target weight comparison
// possible) and for free-form exercises without a captured plannedWeight.
// The 3-of-4 "last-set cap" case falls naturally into completed at 75%.
//
// MUST be called before isPlanned placeholders are stripped — partial/
// completed need the original planned count to compute the ratio.
export function deriveExerciseStatus(ex: GymExercise): ExerciseStatus {
  const plannedRemaining = ex.sets.filter(s => s.isPlanned).length;
  const loggedSets = ex.sets.filter(s => !s.isPlanned && s.reps > 0);
  const totalProgrammed = plannedRemaining + loggedSets.length;

  if (loggedSets.length === 0) return 'skipped';

  // Free-form exercise (no plan targets) — any real work is "completed".
  if (totalProgrammed === 0 || (!ex.plannedSets && plannedRemaining === 0)) {
    return 'completed';
  }

  const targetSetCount = ex.plannedSets ?? totalProgrammed;
  const completionRatio = loggedSets.length / targetSetCount;

  if (completionRatio < 0.25) return 'skipped';
  if (completionRatio < 0.75) return 'partial';

  // >=75% sets — now check load. Bodyweight exercises + exercises with no
  // captured target weight bypass the load check.
  const target = ex.plannedWeight ?? 0;
  const weightedLogged = loggedSets.filter(s => !s.isBodyweight && s.weight > 0);
  if (target > 0 && weightedLogged.length > 0) {
    const avg = weightedLogged.reduce((sum, s) => sum + s.weight, 0) / weightedLogged.length;
    if (avg / target < 0.70) return 'partial';
  }

  return 'completed';
}

// Find the PR candidate set for an exercise this session: the heaviest
// weight among sets with reps >= MIN_PR_REPS. Ties on weight go to the set
// with more reps (objectively better rep performance at the same load).
// Returns null if no qualifying set exists.
function bestPRCandidate(sets: GymSet[]): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null;
  for (const s of sets) {
    if (!isWorkingSet(s)) continue;
    if (s.reps < MIN_PR_REPS) continue;
    if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
      best = { weight: s.weight, reps: s.reps };
    }
  }
  return best;
}

// Get all workout data from localStorage
export function getWorkoutData(): WorkoutData {
  if (typeof window === 'undefined') return defaultData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;

    const parsed = JSON.parse(stored);
    const data: WorkoutData = {
      ...defaultData,
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
    };

    // Backfill e1rm on legacy PR records (per-set Epley from stored weight/reps).
    // Also normalize exercise names everywhere they live (sessions, PRs) so the
    // "Curl standing curl" class of bug heals on next load. Preserves all other
    // fields; only renames + adds e1rm. Persists if anything changed.
    let mutated = false;
    data.personalRecords = data.personalRecords.map(pr => {
      const normalized = normalizeExerciseName(pr.exerciseName);
      let next = pr;
      if (normalized !== pr.exerciseName) {
        mutated = true;
        next = { ...next, exerciseName: normalized };
      }
      if (!(typeof next.e1rm === 'number' && next.e1rm > 0)) {
        mutated = true;
        next = { ...next, e1rm: computeE1RM(next.weight, next.reps) };
      }
      return next;
    });
    data.sessions = data.sessions.map(s => {
      if (!s.exercises?.length) return s;
      let touched = false;
      const exercises = s.exercises.map(ex => {
        const normalized = normalizeExerciseName(ex.name);
        if (normalized === ex.name) return ex;
        touched = true;
        return { ...ex, name: normalized };
      });
      if (!touched) return s;
      mutated = true;
      return { ...s, exercises };
    });
    if (mutated) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    }

    return data;
  } catch (error) {
    console.error('Error reading workout data:', error);
    return defaultData;
  }
}

// Save workout data to localStorage
export function saveWorkoutData(data: WorkoutData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    emitChanged();
  } catch (error) {
    console.error('Error saving workout data:', error);
  }
}

// Write cloud-merged data back to localStorage WITHOUT emitting a change event
// (avoids an infinite pull→apply→push loop). Returns true if anything actually
// changed, so the UI can decide whether to refresh.
export function applyRemote(data: WorkoutData, plan: TrainerPlan | null): boolean {
  if (typeof window === 'undefined') return false;
  const before = localStorage.getItem(STORAGE_KEY) ?? '';
  const beforePlan = localStorage.getItem(PLAN_KEY) ?? '';
  silentWrite = true;
  try {
    saveWorkoutData(data);
    if (plan) savePlan(plan); else clearPlan();
  } finally {
    silentWrite = false;
  }
  const after = localStorage.getItem(STORAGE_KEY) ?? '';
  const afterPlan = localStorage.getItem(PLAN_KEY) ?? '';
  return before !== after || beforePlan !== afterPlan;
}

// Session operations
export function saveSession(session: WorkoutSession): void {
  const data = getWorkoutData();
  const existingIndex = data.sessions.findIndex(s => s.id === session.id);

  if (existingIndex >= 0) {
    data.sessions[existingIndex] = session;
  } else {
    data.sessions.push(session);
  }

  // NOTE: PR evaluation does NOT run here. Every keystroke in a weight/reps
  // Input flows through saveSession; running PR logic per keystroke would
  // set PRs from half-typed intermediate values. PRs are committed once, at
  // session completion, via finalizePRs(session).

  saveWorkoutData(data);
}

export function getSession(id: string): WorkoutSession | undefined {
  const data = getWorkoutData();
  return data.sessions.find(s => s.id === id);
}

// Narrow patch helper — used by components that read sessions via props/
// storage rather than the useWorkout hook (e.g. SessionSummary). Writes
// through to localStorage without rerunning PR evaluation.
export function patchSession(id: string, patch: Partial<WorkoutSession>): void {
  const data = getWorkoutData();
  const idx = data.sessions.findIndex(s => s.id === id);
  if (idx < 0) return;
  data.sessions[idx] = { ...data.sessions[idx], ...patch };
  saveWorkoutData(data);
}

export function deleteSession(id: string): void {
  const data = getWorkoutData();
  data.sessions = data.sessions.filter(s => s.id !== id);
  saveWorkoutData(data);
}

export function getSessionsByDate(date: string): WorkoutSession[] {
  const data = getWorkoutData();
  return data.sessions.filter(s => s.date === date);
}

export function getRecentSessions(limit: number = 10): WorkoutSession[] {
  const data = getWorkoutData();
  return [...data.sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// ── Session completion + abandonment ─────────────────────────────────────
// A session has "logged data" if anything real was recorded: a logged set,
// a cardio entry, or a completed interval. Planned placeholders (isPlanned)
// and empty rows don't count — an untouched plan preload is not logged data.
export function hasLoggedData(session: WorkoutSession): boolean {
  const hasSets = !!session.exercises?.some(ex =>
    ex.sets.some(s => !s.isPlanned && (s.reps > 0 || s.weight > 0 || s.isBodyweight))
  );
  const hasCardio = !!session.cardio?.length;
  const hasIntervals = !!session.intervals?.length;
  return hasSets || hasCardio || hasIntervals;
}

// Finalize a session: derive per-exercise status (before stripping isPlanned
// placeholders, which deriveExerciseStatus needs to compute the ratio), drop
// those scaffold rows, mark completed. `stampEnd` controls endTime: true when
// the session is finishing NOW (normal completion or on-exit auto-finish, so
// endTime = now gives a real duration); false when retroactively closing an
// already-abandoned session whose true end is unknown (leave endTime as-is so
// we don't fabricate a multi-day duration). Pure — does not persist.
export function finalizeSession(
  session: WorkoutSession,
  opts: { stampEnd?: boolean } = {},
): WorkoutSession {
  const exercises = session.exercises?.map(ex => ({
    ...ex,
    status: ex.status ?? deriveExerciseStatus(ex),
    sets: ex.sets.filter(s => !s.isPlanned),
  }));
  return {
    ...session,
    exercises,
    endTime: opts.stampEnd ? session.endTime ?? new Date().toISOString() : session.endTime,
    completed: true,
  };
}

// On leaving an active session (Back button): if anything was logged, finish
// it for real (stamp endTime = now, derive status, commit PRs) so it lands in
// history with a duration instead of lingering as "In Progress". If nothing
// was logged, discard the empty shell. Reads the session FRESH from storage
// by id so it picks up sets written by another useWorkout instance — never
// finalize a stale in-memory copy, which would clobber logged sets.
export function finishOrDiscardSession(id: string): 'finished' | 'discarded' | 'missing' {
  const session = getSession(id);
  if (!session) return 'missing';
  if (!hasLoggedData(session)) {
    deleteSession(id);
    return 'discarded';
  }
  const finalized = finalizeSession(session, { stampEnd: true });
  saveSession(finalized);
  if (finalized.type === 'gym') finalizePRs(finalized);
  return 'finished';
}

// One-time cleanup of orphaned in-progress sessions. An app cold-start has no
// active session, so any completed:false session is abandoned: close the ones
// with logged data (without fabricating an endTime — true end unknown) and
// drop empty shells. Call only when nothing is mid-session. Returns true if it
// changed anything, so the caller can refresh.
export function finalizeAbandonedSessions(): boolean {
  const data = getWorkoutData();
  let changed = false;
  const kept: WorkoutSession[] = [];
  const newlyFinalized: WorkoutSession[] = [];
  for (const s of data.sessions) {
    if (s.completed) { kept.push(s); continue; }
    if (!hasLoggedData(s)) { changed = true; continue; } // drop empty shell
    const finalized = finalizeSession(s, { stampEnd: false });
    kept.push(finalized);
    newlyFinalized.push(finalized);
    changed = true;
  }
  if (changed) {
    data.sessions = kept;
    saveWorkoutData(data);
    newlyFinalized.forEach(s => { if (s.type === 'gym') finalizePRs(s); });
  }
  return changed;
}

// After a reorder, a superset only holds if its members stay adjacent. Clear
// the supersetGroupId of any exercise no longer next to a group-mate, then
// dissolve any group reduced to a single member (a lone member isn't a
// superset). Pure — returns a new array. Matches pump_build_spec_v2.md §4b:
// "moving a superset member out of adjacency auto-unlinks it."
export function dissolveBrokenSupersets(exercises: GymExercise[]): GymExercise[] {
  // Pass 1: unlink members with no same-group neighbor.
  const adjacencyChecked = exercises.map((ex, i) => {
    if (!ex.supersetGroupId) return ex;
    const prev = exercises[i - 1];
    const next = exercises[i + 1];
    const adjacent =
      prev?.supersetGroupId === ex.supersetGroupId || next?.supersetGroupId === ex.supersetGroupId;
    return adjacent ? ex : { ...ex, supersetGroupId: undefined };
  });
  // Pass 2: dissolve groups now down to one member.
  const counts = new Map<string, number>();
  for (const ex of adjacencyChecked) {
    if (ex.supersetGroupId) counts.set(ex.supersetGroupId, (counts.get(ex.supersetGroupId) ?? 0) + 1);
  }
  return adjacencyChecked.map(ex =>
    ex.supersetGroupId && (counts.get(ex.supersetGroupId) ?? 0) <= 1
      ? { ...ex, supersetGroupId: undefined }
      : ex,
  );
}

// Computed session duration in whole minutes, or null when the end is unknown.
// Single source of truth for display and the Supabase session write (step 4).
export function sessionDurationMin(session: WorkoutSession): number | null {
  if (!session.endTime) return null;
  const ms = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 1000 / 60);
}

// ── Blood pressure readings ──────────────────────────────────────────────
// Local store, separate key from workout data (the Upstash envelope only
// carries WorkoutData, so BP readings sync to Supabase only — see bp-sync.ts).
const BP_KEY = 'pump-bp-readings';

export function getBPReadings(): BPReading[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BP_KEY);
    const list = raw ? (JSON.parse(raw) as BPReading[]) : [];
    return [...list].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  } catch {
    return [];
  }
}

export function saveBPReading(reading: BPReading): void {
  if (typeof window === 'undefined') return;
  const all = getBPReadings();
  const idx = all.findIndex(r => r.id === reading.id);
  if (idx >= 0) all[idx] = reading;
  else all.push(reading);
  try {
    localStorage.setItem(BP_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable */
  }
}

export function deleteBPReading(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BP_KEY, JSON.stringify(getBPReadings().filter(r => r.id !== id)));
  } catch {
    /* storage unavailable */
  }
}

// Cursor for the BP doctor-export "new since last shared" default. ISO string;
// the export copies only readings measured after it and advances it on each
// copy. Local-only — sharing is to the clipboard, nothing syncs.
const BP_LAST_SHARED_KEY = 'pump-bp-last-shared';

export function getBPLastShared(): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(BP_LAST_SHARED_KEY); } catch { return null; }
}

export function setBPLastShared(iso: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(BP_LAST_SHARED_KEY, iso); } catch { /* unavailable */ }
}

// AHA blood-pressure category (highest applicable). Used for instant feedback.
export type BPCategory = 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic > 180 || diastolic > 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'stage2';
  if (systolic >= 130 || diastolic >= 80) return 'stage1';
  if (systolic >= 120) return 'elevated';
  return 'normal';
}

// PR operations
//
// Rule (Dylan's spec): one PR per exercise, based on WEIGHT. To qualify as
// a PR candidate a set must be a working set (see isWorkingSet) and hit at
// least MIN_PR_REPS reps. The heaviest qualifying set of the session is the
// candidate; ties on weight break to the set with more reps. A candidate
// that strictly exceeds the stored PR weight is the new PR — same weight
// done twice is not a new PR. First-ever qualifying set for an exercise
// establishes a silent baseline.
//
// Commit point: ONLY at session completion via finalizePRs. Never on every
// saveSession call — that would set PRs from half-typed intermediate values
// and leave them orphaned if the user deletes the set. PRs are immortal
// across edits: finalizePRs only upgrades an existing PR (strictly greater
// weight); it never downgrades, so removing a PR-setting set in a later
// edit does not erase the record.
export function finalizePRs(session: WorkoutSession): void {
  if (!session.exercises) return;
  const data = getWorkoutData();

  session.exercises.forEach(exercise => {
    const best = bestPRCandidate(exercise.sets);
    if (!best) return;

    // Normalize at the write boundary so PR labels are canonical even if a
    // legacy session in storage still carries a malformed name.
    const exerciseName = normalizeExerciseName(exercise.name);

    const idx = data.personalRecords.findIndex(
      pr => pr.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
    const e1rm = computeE1RM(best.weight, best.reps);

    if (idx < 0) {
      // Silent baseline — first qualifying set for this exercise.
      data.personalRecords.push({
        exerciseName,
        weight: best.weight,
        reps: best.reps,
        e1rm,
        date: session.date,
        sessionId: session.id,
      });
      return;
    }

    const existing = data.personalRecords[idx];
    // Strictly greater weight only. Same weight ≠ PR (per spec).
    if (best.weight > existing.weight) {
      data.personalRecords[idx] = {
        ...existing,
        previousWeight: existing.weight,
        previousReps: existing.reps,
        weight: best.weight,
        reps: best.reps,
        e1rm,
        date: session.date,
        sessionId: session.id,
      };
    }
  });

  saveWorkoutData(data);
}

export function getPRs(): PersonalRecord[] {
  const data = getWorkoutData();
  return data.personalRecords;
}

export function getPRForExercise(exerciseName: string): PersonalRecord | undefined {
  const data = getWorkoutData();
  return data.personalRecords.find(
    pr => pr.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );
}

// Template operations
export function saveTemplate(template: WorkoutTemplate): void {
  const data = getWorkoutData();
  const existingIndex = data.templates.findIndex(t => t.id === template.id);

  if (existingIndex >= 0) {
    data.templates[existingIndex] = template;
  } else {
    data.templates.push(template);
  }

  saveWorkoutData(data);
}

export function getTemplates(): WorkoutTemplate[] {
  const data = getWorkoutData();
  return data.templates;
}

export function deleteTemplate(id: string): void {
  const data = getWorkoutData();
  data.templates = data.templates.filter(t => t.id !== id);
  saveWorkoutData(data);
}

// Settings operations
export function getSettings(): UserSettings {
  const data = getWorkoutData();
  return data.settings;
}

export function saveSettings(settings: UserSettings): void {
  const data = getWorkoutData();
  data.settings = settings;
  saveWorkoutData(data);
}

// History operations
export function getExerciseHistory(exerciseName: string, limit: number = 5): { date: string; sets: GymSet[] }[] {
  const data = getWorkoutData();
  const history: { date: string; sets: GymSet[] }[] = [];

  // Get sessions sorted by date (newest first)
  const sortedSessions = [...data.sessions]
    .filter(s => s.type === 'gym')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const session of sortedSessions) {
    if (history.length >= limit) break;

    const exercise = session.exercises?.find(
      e => e.name.toLowerCase() === exerciseName.toLowerCase()
    );

    if (exercise) {
      history.push({
        date: session.date,
        sets: exercise.sets,
      });
    }
  }

  return history;
}

// Stats operations
export function getWorkoutStats() {
  const data = getWorkoutData();

  const totalSessions = data.sessions.length;
  const gymSessions = data.sessions.filter(s => s.type === 'gym').length;
  const cardioSessions = data.sessions.filter(s => s.type === 'cardio').length;

  // Calculate total volume (weight x reps) for gym sessions using the
  // canonical working-set predicate — keeps stats consistent with BRIEF,
  // session summary, and PR eligibility.
  let totalVolume = 0;
  data.sessions.forEach(session => {
    if (session.type === 'gym' && session.exercises) {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (isWorkingSet(set)) {
            totalVolume += set.weight * set.reps;
          }
        });
      });
    }
  });

  // Calculate total distance for cardio sessions
  let totalDistance = 0;
  data.sessions.forEach(session => {
    if (session.type === 'cardio' && session.cardio) {
      session.cardio.forEach(entry => {
        totalDistance += entry.distance ?? 0;
      });
    }
  });

  return {
    totalSessions,
    gymSessions,
    cardioSessions,
    totalVolume,
    totalDistance,
    personalRecords: data.personalRecords.length,
  };
}

// Export data as JSON
export function exportData(): string {
  const data = getWorkoutData();
  return JSON.stringify(data, null, 2);
}

// Import data from JSON (full replace). Kept for completeness.
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as WorkoutData;
    saveWorkoutData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

// Import a backup and MERGE it into whatever's already here (union by id —
// nothing is lost, safe to run on a populated device, idempotent). This is the
// device-to-device restore path: export the JSON from one storage jar (e.g.
// Safari) and import it into another (e.g. the installed PWA), which otherwise
// starts empty because localStorage is per-container. Accepts a backup produced
// by exportData() (a WorkoutData blob).
export function importMergeData(
  jsonString: string,
): { ok: boolean; sessions: number; error?: string } {
  try {
    const incoming = JSON.parse(jsonString) as Partial<WorkoutData>;
    if (!incoming || !Array.isArray(incoming.sessions)) {
      return { ok: false, sessions: 0, error: 'That file is not a PUMP backup.' };
    }
    const stamp = new Date().toISOString();
    const local: SyncEnvelope = { updatedAt: stamp, data: getWorkoutData(), plan: getPlan() };
    const imported: SyncEnvelope = {
      updatedAt: stamp,
      data: {
        sessions: incoming.sessions ?? [],
        personalRecords: incoming.personalRecords ?? [],
        templates: incoming.templates ?? [],
        settings: incoming.settings ?? getWorkoutData().settings,
      },
      plan: getPlan(),
    };
    const merged = mergeEnvelopes(local, imported);
    saveWorkoutData(merged.data);
    return { ok: true, sessions: merged.data.sessions.length };
  } catch (error) {
    return {
      ok: false,
      sessions: 0,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
}

// PUMP OS — Plan operations
const PLAN_KEY = 'dylan-workout-plan';

export function savePlan(plan: TrainerPlan): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  emitChanged();
}

export function getPlan(): TrainerPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PLAN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearPlan(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLAN_KEY);
  emitChanged();
}

// Returns the next plan session to run based on what was last completed
// and the plan's weekly rotation. Primary matching is by stored
// planSessionId on the last completed session — deterministic and immune
// to ambiguous plans where two sessions start with the same exercise
// (review M6). Legacy sessions predating planSessionId fall through to a
// name-based heuristic for backward compat.
export function getNextPlanSession(plan: TrainerPlan): string | null {
  const data = getWorkoutData();
  if (!plan.weeklyStructure?.length) return plan.sessions[0]?.id ?? null;

  const recent = [...data.sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const advance = (lastName: string): string | null => {
    const idx = plan.weeklyStructure!.findIndex(n => n.toLowerCase() === lastName.toLowerCase());
    if (idx < 0) return null;
    const nextName = plan.weeklyStructure![(idx + 1) % plan.weeklyStructure!.length].toLowerCase();
    const next = plan.sessions.find(s => s.name.toLowerCase() === nextName);
    return next?.id ?? plan.sessions[0]?.id ?? null;
  };

  for (const log of recent) {
    // Preferred path: stored planSessionId on the completed session.
    if (log.planSessionId) {
      const matched = plan.sessions.find(ps => ps.id === log.planSessionId);
      if (matched) {
        const advanced = advance(matched.name);
        if (advanced) return advanced;
      }
    }

    // Legacy heuristic: notes substring or first-exercise name equality.
    // Retained only for pre-planSessionId sessions.
    const planSessionNames = plan.sessions.map(s => s.name.toLowerCase());
    const heuristicMatch = planSessionNames.findIndex(name =>
      log.notes?.toLowerCase().includes(name) ||
      (log.exercises?.[0]?.name && plan.sessions.some(ps =>
        ps.exercises[0]?.name.toLowerCase() === log.exercises![0].name.toLowerCase()
      ))
    );
    if (heuristicMatch >= 0) {
      const advanced = advance(planSessionNames[heuristicMatch]);
      if (advanced) return advanced;
    }
  }

  return plan.sessions[0]?.id ?? null;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

import { WorkoutData, WorkoutSession, PersonalRecord, WorkoutTemplate, UserSettings, GymExercise, GymSet, TrainerPlan } from './types';

const STORAGE_KEY = 'dylan-workout-tracker';

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
    // Preserves existing weight/reps; does not mutate storage until next save.
    let mutated = false;
    data.personalRecords = data.personalRecords.map(pr => {
      if (typeof pr.e1rm === 'number' && pr.e1rm > 0) return pr;
      mutated = true;
      return { ...pr, e1rm: computeE1RM(pr.weight, pr.reps) };
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
  } catch (error) {
    console.error('Error saving workout data:', error);
  }
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

    const idx = data.personalRecords.findIndex(
      pr => pr.exerciseName.toLowerCase() === exercise.name.toLowerCase()
    );
    const e1rm = computeE1RM(best.weight, best.reps);

    if (idx < 0) {
      // Silent baseline — first qualifying set for this exercise.
      data.personalRecords.push({
        exerciseName: exercise.name,
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

// Import data from JSON
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

// PUMP OS — Plan operations
const PLAN_KEY = 'dylan-workout-plan';

export function savePlan(plan: TrainerPlan): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
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

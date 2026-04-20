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
// so reps are capped at 30 before applying the formula.
export function computeE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  const cappedReps = Math.min(reps, 30);
  return weight * (1 + cappedReps / 30);
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

  // Check for PRs when saving a gym session
  if (session.type === 'gym' && session.exercises) {
    checkAndUpdatePRs(session, data);
  }

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
// Per-set evaluation using Epley e1RM. The "best set" of the session is the
// single set with the highest e1RM (weight, reps preserved together — never a
// frankenstein combo). Bodyweight and zero-weight sets are skipped. First-ever
// exercises establish a baseline silently; celebration is gated in useWorkout.
function checkAndUpdatePRs(session: WorkoutSession, data: WorkoutData): void {
  if (!session.exercises) return;

  session.exercises.forEach(exercise => {
    // Find best set of this session for this exercise
    let best: { weight: number; reps: number; e1rm: number } | null = null;
    for (const set of exercise.sets) {
      if (set.isWarmup || set.isPlanned || set.isBodyweight) continue;
      if (set.weight <= 0 || set.reps <= 0) continue;
      const e1rm = computeE1RM(set.weight, set.reps);
      if (!best || e1rm > best.e1rm) {
        best = { weight: set.weight, reps: set.reps, e1rm };
      }
    }
    if (!best) return;

    const existing = data.personalRecords.find(
      pr => pr.exerciseName.toLowerCase() === exercise.name.toLowerCase()
    );

    if (!existing) {
      // Baseline: record silently with no previousE1rm marker.
      data.personalRecords.push({
        exerciseName: exercise.name,
        weight: best.weight,
        reps: best.reps,
        e1rm: best.e1rm,
        date: session.date,
        sessionId: session.id,
      });
      return;
    }

    // Only update on a true PR (best set e1RM strictly greater).
    if (best.e1rm > existing.e1rm) {
      existing.previousE1rm = existing.e1rm;
      existing.weight = best.weight;
      existing.reps = best.reps;
      existing.e1rm = best.e1rm;
      existing.date = session.date;
      existing.sessionId = session.id;
    }
  });
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

  // Calculate total volume (weight x reps) for gym sessions
  let totalVolume = 0;
  data.sessions.forEach(session => {
    if (session.type === 'gym' && session.exercises) {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (!set.isWarmup && !set.isPlanned) {
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

// Returns the next session based on what was last done and the plan's weekly structure
export function getNextPlanSession(plan: TrainerPlan): string | null {
  const data = getWorkoutData();
  if (!plan.weeklyStructure?.length) return plan.sessions[0]?.id ?? null;

  // Find last completed session that matches a plan session
  const planSessionNames = plan.sessions.map(s => s.name.toLowerCase());
  const recent = [...data.sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  for (const log of recent) {
    const match = planSessionNames.findIndex(name =>
      log.notes?.toLowerCase().includes(name) ||
      (log.exercises?.[0]?.name && plan.sessions.some(ps =>
        ps.exercises[0]?.name.toLowerCase() === log.exercises![0].name.toLowerCase()
      ))
    );
    if (match >= 0) {
      const nextIndex = (match + 1) % plan.weeklyStructure.length;
      const nextName = plan.weeklyStructure[nextIndex].toLowerCase();
      const nextSession = plan.sessions.find(s => s.name.toLowerCase() === nextName);
      return nextSession?.id ?? plan.sessions[0].id;
    }
  }

  return plan.sessions[0]?.id ?? null;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

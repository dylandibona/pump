import { WorkoutData, WorkoutSession, PersonalRecord, WorkoutTemplate, UserSettings, GymExercise, GymSet } from './types';

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

// Get all workout data from localStorage
export function getWorkoutData(): WorkoutData {
  if (typeof window === 'undefined') return defaultData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;

    const parsed = JSON.parse(stored);
    return {
      ...defaultData,
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
    };
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
function checkAndUpdatePRs(session: WorkoutSession, data: WorkoutData): void {
  if (!session.exercises) return;

  session.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.isWarmup) return; // Skip warmup sets

      const existingPR = data.personalRecords.find(
        pr => pr.exerciseName.toLowerCase() === exercise.name.toLowerCase()
      );

      // Calculate estimated 1RM using Brzycki formula: weight × (36 / (37 - reps))
      const estimated1RM = set.weight * (36 / (37 - Math.min(set.reps, 36)));

      if (!existingPR) {
        data.personalRecords.push({
          exerciseName: exercise.name,
          weight: set.weight,
          reps: set.reps,
          date: session.date,
          sessionId: session.id,
        });
      } else {
        const existingEstimated1RM = existingPR.weight * (36 / (37 - Math.min(existingPR.reps, 36)));

        if (estimated1RM > existingEstimated1RM) {
          existingPR.weight = set.weight;
          existingPR.reps = set.reps;
          existingPR.date = session.date;
          existingPR.sessionId = session.id;
        }
      }
    });
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
          if (!set.isWarmup) {
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
        totalDistance += entry.distance;
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

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

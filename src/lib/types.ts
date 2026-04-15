// Core workout types

export type WorkoutType = 'cardio' | 'gym';
export type CardioActivity = 'run' | 'bike' | 'swim' | 'row' | 'elliptical' | 'walk';

export interface CardioEntry {
  id: string;
  activity: CardioActivity;
  distance?: number;    // miles — optional
  duration?: number;    // seconds — optional
  incline?: number;     // % grade (treadmill, walk)
  speed?: number;       // mph (treadmill)
  notes?: string;
}

export interface GymSet {
  reps: number;
  weight: number; // in lbs; 0 means bodyweight
  isWarmup?: boolean;
  isBodyweight?: boolean;
  isPlanned?: boolean; // true = placeholder slot from plan, not yet logged
}

export interface GymExercise {
  id: string;
  name: string;
  sets: GymSet[];
  notes?: string;
  restBetweenSets?: number; // in seconds
  supersetGroupId?: string; // exercises sharing this ID are displayed/done as a superset
  equipment?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other';
  weightType?: 'total' | 'per_side'; // 'total' is default
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO date string
  type: WorkoutType;
  startTime: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  cardio?: CardioEntry[];
  exercises?: GymExercise[];
  notes?: string;
  completed: boolean;
}

export interface PersonalRecord {
  exerciseName: string;
  weight: number;       // weight of the best set
  reps: number;         // reps of the best set
  e1rm: number;         // estimated 1RM (Epley) — source of truth for PR comparison
  previousE1rm?: number; // the e1RM this PR beat, for "prev:" display in BRIEF
  date: string;
  sessionId: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  exercises?: Omit<GymExercise, 'id'>[];
  cardio?: Omit<CardioEntry, 'id'>[];
  createdAt: string;
}

export interface ExerciseHistory {
  exerciseName: string;
  entries: {
    date: string;
    sessionId: string;
    sets: GymSet[];
  }[];
}

export interface TimerState {
  type: 'rest' | 'general';
  mode: 'countdown' | 'countup';
  duration: number; // target duration in seconds
  remaining: number; // current remaining/elapsed in seconds
  isRunning: boolean;
  label?: string;
}

// Exercise library types
export interface ExerciseInfo {
  name: string;
  muscleGroups: string[];
  equipment?: string[];
  tips?: string;
}

// PUMP OS — PLAN types (loaded from TRAINER)
export interface PlanExercise {
  name: string;
  sets: number;
  targetReps: string; // "10-12" or "10"
  targetWeight?: number; // undefined or 0 = bodyweight
  isBodyweight?: boolean;
  notes?: string;
  supersetWith?: string | null; // exercise name
  equipment?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other';
  weightType?: 'total' | 'per_side';
}

export interface PlanSession {
  id: string;
  name: string;
  exercises: PlanExercise[];
}

export interface TrainerPlan {
  planId: string;
  name: string;
  version: number;
  createdDate: string;
  blockType?: string;
  weeklyStructure?: string[]; // ordered session names for rotation
  progressionScheme?: string;
  sessions: PlanSession[];
  trainerNotes?: string;
}

// Storage data structure
export interface WorkoutData {
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  templates: WorkoutTemplate[];
  settings: UserSettings;
}

export interface UserSettings {
  defaultRestTime: number; // in seconds
  weightUnit: 'lbs' | 'kg';
  distanceUnit: 'miles' | 'km';
}

// Core workout types

export type WorkoutType = 'cardio' | 'gym';
export type CardioActivity = 'run' | 'bike' | 'swim' | 'row' | 'elliptical' | 'walk';

export interface CardioEntry {
  id: string;
  activity: CardioActivity;
  distance: number; // in miles
  duration: number; // in seconds
  notes?: string;
}

export interface GymSet {
  reps: number;
  weight: number; // in lbs
  isWarmup?: boolean;
}

export interface GymExercise {
  id: string;
  name: string;
  sets: GymSet[];
  notes?: string;
  restBetweenSets?: number; // in seconds
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
  weight: number;
  reps: number;
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

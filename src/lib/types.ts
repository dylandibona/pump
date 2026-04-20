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
  intervals?: CompletedInterval[]; // timed conditioning blocks (battle ropes, Tabata, EMOM)
  notes?: string;
  completed: boolean;
  // ID of the PlanSession this session was launched from. Captured at
  // startSession time so plan rotation (getNextPlanSession) can match
  // deterministically instead of heuristically comparing exercise names.
  // Legacy sessions predating this field omit it and fall through to the
  // name-based heuristic for backward compat.
  planSessionId?: string;
}

// Interval builder — timed conditioning sequences.
//
// A sequence is an ordered list of blocks. Each block is a step sequence
// repeated `rounds` times. This shape supports single work/rest pairs,
// Tabata (1 block with 2 steps × 8 rounds), EMOM (1 block, 1 step × N
// rounds with rest implied by cycle), and compound programs (multiple
// blocks — e.g. warmup + Tabata + cooldown).
export interface IntervalStep {
  id: string;
  label: string;    // "Work" | "Rest" | user-provided
  duration: number; // seconds
}

export interface IntervalBlock {
  id: string;
  steps: IntervalStep[];
  rounds: number;   // steps[] repeat this many times
}

export interface IntervalSequence {
  name?: string;
  blocks: IntervalBlock[];
}

export interface CompletedInterval {
  id: string;
  name: string;
  sequence: IntervalSequence;
  totalDuration: number; // programmed duration in seconds (sum of step × rounds × blocks)
  completedAt: string;   // ISO timestamp
}

// A PR is the heaviest weight performed for a qualifying set (reps >= MIN_PR_REPS,
// see storage.ts). Comparison is by `weight` only — a matching weight does not
// upgrade the PR, and higher e1RM at a lower weight does not count. e1rm is
// kept for informational display (BRIEF) but is not the comparison field.
export interface PersonalRecord {
  exerciseName: string;
  weight: number;           // authoritative PR field — comparison is by weight
  reps: number;             // reps of the PR-setting set (>= MIN_PR_REPS)
  e1rm: number;             // estimated 1RM (Epley) — informational only
  previousWeight?: number;  // weight this PR beat, for "prev:" display in BRIEF
  previousReps?: number;    // reps of the beaten PR set
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

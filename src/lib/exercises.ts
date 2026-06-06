import { ExerciseInfo } from './types';

// Comprehensive exercise library for autocomplete
export const exerciseLibrary: ExerciseInfo[] = [
  // Chest
  { name: 'Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'] },
  { name: 'Incline Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'] },
  { name: 'Decline Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'] },
  { name: 'Dumbbell Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['dumbbells', 'bench'] },
  { name: 'Incline Dumbbell Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['dumbbells', 'bench'] },
  { name: 'Dumbbell Fly', muscleGroups: ['chest'], equipment: ['dumbbells', 'bench'] },
  { name: 'Cable Fly', muscleGroups: ['chest'], equipment: ['cables'] },
  { name: 'Push-ups', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: [] },
  { name: 'Chest Dips', muscleGroups: ['chest', 'triceps'], equipment: ['dip bars'] },
  { name: 'Machine Chest Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: ['machine'] },
  { name: 'Pec Deck', muscleGroups: ['chest'], equipment: ['machine'] },

  // Back
  { name: 'Deadlift', muscleGroups: ['back', 'hamstrings', 'glutes'], equipment: ['barbell'] },
  { name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'back', 'glutes'], equipment: ['barbell'] },
  { name: 'Barbell Row', muscleGroups: ['back', 'biceps'], equipment: ['barbell'] },
  { name: 'Dumbbell Row', muscleGroups: ['back', 'biceps'], equipment: ['dumbbells'] },
  { name: 'Pendlay Row', muscleGroups: ['back', 'biceps'], equipment: ['barbell'] },
  { name: 'T-Bar Row', muscleGroups: ['back', 'biceps'], equipment: ['t-bar'] },
  { name: 'Seated Cable Row', muscleGroups: ['back', 'biceps'], equipment: ['cables'] },
  { name: 'Lat Pulldown', muscleGroups: ['back', 'biceps'], equipment: ['cables'] },
  { name: 'Pull-ups', muscleGroups: ['back', 'biceps'], equipment: ['pull-up bar'] },
  { name: 'Chin-ups', muscleGroups: ['back', 'biceps'], equipment: ['pull-up bar'] },
  { name: 'Face Pulls', muscleGroups: ['back', 'rear delts'], equipment: ['cables'] },
  { name: 'Shrugs', muscleGroups: ['traps'], equipment: ['barbell', 'dumbbells'] },
  { name: 'Rack Pulls', muscleGroups: ['back', 'traps'], equipment: ['barbell', 'rack'] },
  { name: 'Good Mornings', muscleGroups: ['back', 'hamstrings'], equipment: ['barbell'] },
  { name: 'Back Extension', muscleGroups: ['lower back', 'glutes'], equipment: ['back extension bench'] },

  // Shoulders
  { name: 'Overhead Press', muscleGroups: ['shoulders', 'triceps'], equipment: ['barbell'] },
  { name: 'Seated Dumbbell Press', muscleGroups: ['shoulders', 'triceps'], equipment: ['dumbbells', 'bench'] },
  { name: 'Arnold Press', muscleGroups: ['shoulders', 'triceps'], equipment: ['dumbbells'] },
  { name: 'Lateral Raise', muscleGroups: ['shoulders'], equipment: ['dumbbells'] },
  { name: 'Front Raise', muscleGroups: ['shoulders'], equipment: ['dumbbells'] },
  { name: 'Rear Delt Fly', muscleGroups: ['shoulders', 'back'], equipment: ['dumbbells'] },
  { name: 'Upright Row', muscleGroups: ['shoulders', 'traps'], equipment: ['barbell'] },
  { name: 'Machine Shoulder Press', muscleGroups: ['shoulders', 'triceps'], equipment: ['machine'] },
  { name: 'Cable Lateral Raise', muscleGroups: ['shoulders'], equipment: ['cables'] },

  // Arms - Biceps
  { name: 'Barbell Curl', muscleGroups: ['biceps'], equipment: ['barbell'] },
  { name: 'Dumbbell Curl', muscleGroups: ['biceps'], equipment: ['dumbbells'] },
  { name: 'Hammer Curl', muscleGroups: ['biceps', 'forearms'], equipment: ['dumbbells'] },
  { name: 'Preacher Curl', muscleGroups: ['biceps'], equipment: ['ez-bar', 'preacher bench'] },
  { name: 'Concentration Curl', muscleGroups: ['biceps'], equipment: ['dumbbells'] },
  { name: 'Cable Curl', muscleGroups: ['biceps'], equipment: ['cables'] },
  { name: 'Incline Dumbbell Curl', muscleGroups: ['biceps'], equipment: ['dumbbells', 'bench'] },
  { name: 'Spider Curl', muscleGroups: ['biceps'], equipment: ['dumbbells', 'bench'] },
  { name: 'EZ-Bar Curl', muscleGroups: ['biceps'], equipment: ['ez-bar'] },

  // Arms - Triceps
  { name: 'Tricep Pushdown', muscleGroups: ['triceps'], equipment: ['cables'] },
  { name: 'Tricep Dips', muscleGroups: ['triceps', 'chest'], equipment: ['dip bars'] },
  { name: 'Skull Crushers', muscleGroups: ['triceps'], equipment: ['barbell', 'bench'] },
  { name: 'Overhead Tricep Extension', muscleGroups: ['triceps'], equipment: ['dumbbells'] },
  { name: 'Close Grip Bench Press', muscleGroups: ['triceps', 'chest'], equipment: ['barbell', 'bench'] },
  { name: 'Tricep Kickback', muscleGroups: ['triceps'], equipment: ['dumbbells'] },
  { name: 'Diamond Push-ups', muscleGroups: ['triceps', 'chest'], equipment: [] },
  { name: 'Rope Pushdown', muscleGroups: ['triceps'], equipment: ['cables'] },

  // Legs - Quads
  { name: 'Squat', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: ['barbell', 'rack'] },
  { name: 'Front Squat', muscleGroups: ['quads', 'core'], equipment: ['barbell', 'rack'] },
  { name: 'Leg Press', muscleGroups: ['quads', 'glutes'], equipment: ['machine'] },
  { name: 'Leg Extension', muscleGroups: ['quads'], equipment: ['machine'] },
  { name: 'Lunges', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbells'] },
  { name: 'Walking Lunges', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbells'] },
  { name: 'Bulgarian Split Squat', muscleGroups: ['quads', 'glutes'], equipment: ['dumbbells', 'bench'] },
  { name: 'Hack Squat', muscleGroups: ['quads'], equipment: ['machine'] },
  { name: 'Goblet Squat', muscleGroups: ['quads', 'glutes'], equipment: ['kettlebell', 'dumbbell'] },
  { name: 'Box Squat', muscleGroups: ['quads', 'glutes'], equipment: ['barbell', 'box'] },
  { name: 'Step-ups', muscleGroups: ['quads', 'glutes'], equipment: ['box', 'dumbbells'] },

  // Legs - Hamstrings/Glutes
  { name: 'Leg Curl', muscleGroups: ['hamstrings'], equipment: ['machine'] },
  { name: 'Seated Leg Curl', muscleGroups: ['hamstrings'], equipment: ['machine'] },
  { name: 'Stiff Leg Deadlift', muscleGroups: ['hamstrings', 'glutes'], equipment: ['barbell'] },
  { name: 'Hip Thrust', muscleGroups: ['glutes', 'hamstrings'], equipment: ['barbell', 'bench'] },
  { name: 'Glute Bridge', muscleGroups: ['glutes'], equipment: [] },
  { name: 'Cable Pull Through', muscleGroups: ['glutes', 'hamstrings'], equipment: ['cables'] },
  { name: 'Sumo Deadlift', muscleGroups: ['glutes', 'hamstrings', 'back'], equipment: ['barbell'] },
  { name: 'Glute Kickback', muscleGroups: ['glutes'], equipment: ['cables', 'machine'] },

  // Calves
  { name: 'Standing Calf Raise', muscleGroups: ['calves'], equipment: ['machine', 'barbell'] },
  { name: 'Seated Calf Raise', muscleGroups: ['calves'], equipment: ['machine'] },
  { name: 'Donkey Calf Raise', muscleGroups: ['calves'], equipment: ['machine'] },
  { name: 'Single Leg Calf Raise', muscleGroups: ['calves'], equipment: ['dumbbell'] },

  // Core
  { name: 'Plank', muscleGroups: ['core'], equipment: [] },
  { name: 'Side Plank', muscleGroups: ['core', 'obliques'], equipment: [] },
  { name: 'Hanging Leg Raise', muscleGroups: ['core', 'hip flexors'], equipment: ['pull-up bar'] },
  { name: 'Cable Crunch', muscleGroups: ['core'], equipment: ['cables'] },
  { name: 'Ab Wheel Rollout', muscleGroups: ['core'], equipment: ['ab wheel'] },
  { name: 'Russian Twist', muscleGroups: ['core', 'obliques'], equipment: ['medicine ball'] },
  { name: 'Dead Bug', muscleGroups: ['core'], equipment: [] },
  { name: 'Bird Dog', muscleGroups: ['core', 'back'], equipment: [] },
  { name: 'Mountain Climbers', muscleGroups: ['core', 'cardio'], equipment: [] },
  { name: 'Crunches', muscleGroups: ['core'], equipment: [] },
  { name: 'Sit-ups', muscleGroups: ['core'], equipment: [] },
  { name: 'Leg Raise', muscleGroups: ['core', 'hip flexors'], equipment: [] },
  { name: 'Bicycle Crunch', muscleGroups: ['core', 'obliques'], equipment: [] },
  { name: 'V-ups', muscleGroups: ['core'], equipment: [] },
  { name: 'Pallof Press', muscleGroups: ['core'], equipment: ['cables'] },
  { name: 'Woodchop', muscleGroups: ['core', 'obliques'], equipment: ['cables', 'medicine ball'] },

  // Functional/Full Body
  { name: 'Kettlebell Swing', muscleGroups: ['glutes', 'hamstrings', 'core'], equipment: ['kettlebell'] },
  { name: 'Turkish Get-up', muscleGroups: ['full body'], equipment: ['kettlebell'] },
  { name: 'Clean and Press', muscleGroups: ['full body'], equipment: ['barbell'] },
  { name: 'Snatch', muscleGroups: ['full body'], equipment: ['barbell'] },
  { name: 'Power Clean', muscleGroups: ['full body'], equipment: ['barbell'] },
  { name: 'Thrusters', muscleGroups: ['full body'], equipment: ['barbell', 'dumbbells'] },
  { name: 'Burpees', muscleGroups: ['full body', 'cardio'], equipment: [] },
  { name: 'Battle Ropes', muscleGroups: ['shoulders', 'core', 'cardio'], equipment: ['battle ropes'] },
  { name: 'Box Jumps', muscleGroups: ['legs', 'cardio'], equipment: ['box'] },
  { name: 'Sled Push', muscleGroups: ['legs', 'core'], equipment: ['sled'] },
  { name: 'Farmers Walk', muscleGroups: ['grip', 'core', 'full body'], equipment: ['dumbbells', 'farmer handles'] },
  { name: 'Bear Crawl', muscleGroups: ['full body'], equipment: [] },
];

// Get exercise suggestions based on partial input
export function getExerciseSuggestions(input: string, limit: number = 8): ExerciseInfo[] {
  if (!input.trim()) return [];

  const searchTerm = input.toLowerCase();

  // First, find exact prefix matches
  const prefixMatches = exerciseLibrary.filter(ex =>
    ex.name.toLowerCase().startsWith(searchTerm)
  );

  // Then, find contains matches
  const containsMatches = exerciseLibrary.filter(ex =>
    !ex.name.toLowerCase().startsWith(searchTerm) &&
    ex.name.toLowerCase().includes(searchTerm)
  );

  // Combine and limit
  return [...prefixMatches, ...containsMatches].slice(0, limit);
}

// Get all unique muscle groups
export function getAllMuscleGroups(): string[] {
  const groups = new Set<string>();
  exerciseLibrary.forEach(ex => ex.muscleGroups.forEach(g => groups.add(g)));
  return Array.from(groups).sort();
}

// Get exercises by muscle group
export function getExercisesByMuscleGroup(muscleGroup: string): ExerciseInfo[] {
  return exerciseLibrary.filter(ex =>
    ex.muscleGroups.some(g => g.toLowerCase() === muscleGroup.toLowerCase())
  );
}

// ─── Name normalization ────────────────────────────────────────────────
// One source of truth. Applied at every entry point (storage writes, plan
// import, autocomplete commit) so the same canonical name reaches every
// surface (picker, log, PR labels, brief).
//
// Fixes seen in the wild:
//   "Curl standing curl"  → "Standing Curl"   (autocomplete prefix orphan)
//   "incline bench Row"   → "Incline Bench Row" (mixed case)
//   "  Bench   Press "    → "Bench Press"     (whitespace)
//   "Barbell barbell Curl"→ "Barbell Curl"    (duplicated equipment prefix)
//
// Strategy:
//   1. Trim + collapse internal whitespace
//   2. Dedupe repeated *tokens* (case-insensitive) preserving last occurrence
//   3. Snap to a library name if a case-insensitive exact match exists (so
//      "BENCH PRESS" becomes the canonical "Bench Press")
//   4. Title-case the result with small-word + hyphen handling
const SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'with']);

function dedupeRepeatedTokens(name: string): string {
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return name;
  // Walk RIGHT-TO-LEFT keeping the last occurrence of each token (lowercased).
  // "curl standing curl" → keep the second "curl", drop the first → "standing curl".
  const seen = new Set<string>();
  const kept: string[] = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const key = tokens[i].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.unshift(tokens[i]);
  }
  return kept.join(' ');
}

function titleCaseWord(word: string, isFirst: boolean): string {
  // Preserve known acronyms / very-short uppercase tokens (e.g. EZ, T).
  if (word === word.toUpperCase() && word.length <= 2) return word;
  if (word.includes('-')) {
    return word
      .split('-')
      .map((p, i) => titleCaseWord(p, i === 0 && isFirst))
      .join('-');
  }
  const lower = word.toLowerCase();
  if (!isFirst && SMALL_WORDS.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCase(name: string): string {
  const tokens = name.split(/\s+/).filter(Boolean);
  return tokens.map((t, i) => titleCaseWord(t, i === 0)).join(' ');
}

// Library lookup map — built once, case-insensitive snap to canonical names.
const LIBRARY_BY_LOWER = new Map<string, string>(
  exerciseLibrary.map(ex => [ex.name.toLowerCase(), ex.name]),
);

export function normalizeExerciseName(raw: string): string {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const deduped = dedupeRepeatedTokens(trimmed);
  // Snap to canonical library name if we have an exact (case-insensitive) match.
  const canonical = LIBRARY_BY_LOWER.get(deduped.toLowerCase());
  if (canonical) return canonical;
  return titleCase(deduped);
}

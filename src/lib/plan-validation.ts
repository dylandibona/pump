import { TrainerPlan, PlanSession, PlanExercise } from './types';
import { normalizeExerciseName } from './exercises';

// Validate and normalize a pasted trainer plan JSON. Returns the normalized
// plan (hyphen-only dashes in targetReps, preserved fields otherwise) or
// a list of human-readable errors that Dylan can paste back to the trainer.
// Specific over generic — "session 'Push' exercise 3 (Face Pull) missing
// required 'sets'" beats "invalid plan" every time.
//
// This is hand-written over Zod to keep the schema visible at the callsite
// and the bundle small. As the plan shape evolves, update here.

const DASH_PATTERN = /[–—]/g; // en-dash, em-dash → hyphen

function normalizeTargetReps(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(DASH_PATTERN, '-').trim();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export interface PlanValidationResult {
  plan: TrainerPlan | null;
  errors: string[];
}

export function validateAndNormalizePlan(raw: unknown): PlanValidationResult {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return { plan: null, errors: ['Plan must be a JSON object.'] };
  }

  const p = raw;

  if (typeof p.planId !== 'string' || !p.planId.trim()) {
    errors.push('Missing required field: "planId" (string).');
  }
  if (typeof p.name !== 'string' || !p.name.trim()) {
    errors.push('Missing required field: "name" (string).');
  }
  if (typeof p.version !== 'number' || !Number.isFinite(p.version)) {
    errors.push('Missing or invalid field: "version" (must be a number).');
  }
  if (!Array.isArray(p.sessions) || p.sessions.length === 0) {
    errors.push('Missing or empty "sessions" array — plan must contain at least one session.');
    return { plan: null, errors };
  }

  const normalizedSessions: PlanSession[] = [];

  (p.sessions as unknown[]).forEach((rawSession, si) => {
    const sessionLabel = isRecord(rawSession) && typeof rawSession.name === 'string'
      ? `session "${rawSession.name}"`
      : `session ${si + 1}`;

    if (!isRecord(rawSession)) {
      errors.push(`${sessionLabel}: must be an object.`);
      return;
    }

    if (typeof rawSession.id !== 'string' || !rawSession.id.trim()) {
      errors.push(`${sessionLabel}: missing required field "id".`);
    }
    if (typeof rawSession.name !== 'string' || !rawSession.name.trim()) {
      errors.push(`${sessionLabel}: missing required field "name".`);
    }
    if (!Array.isArray(rawSession.exercises) || rawSession.exercises.length === 0) {
      errors.push(`${sessionLabel}: missing or empty "exercises" array.`);
      return;
    }

    // Collect exercise name set so supersetWith references can be validated
    // against the session's own exercises (not across sessions — supersets
    // are local to a workout).
    const exercisesRaw = rawSession.exercises as unknown[];
    const exerciseNamesLower = new Set<string>();
    exercisesRaw.forEach(ex => {
      if (isRecord(ex) && typeof ex.name === 'string') {
        exerciseNamesLower.add(ex.name.trim().toLowerCase());
      }
    });

    const normalizedExercises: PlanExercise[] = [];
    exercisesRaw.forEach((rawEx, ei) => {
      const exLabel = isRecord(rawEx) && typeof rawEx.name === 'string'
        ? `${sessionLabel} exercise "${rawEx.name}"`
        : `${sessionLabel} exercise ${ei + 1}`;

      if (!isRecord(rawEx)) {
        errors.push(`${exLabel}: must be an object.`);
        return;
      }

      if (typeof rawEx.name !== 'string' || !rawEx.name.trim()) {
        errors.push(`${exLabel}: missing required field "name".`);
      }
      if (typeof rawEx.sets !== 'number' || !Number.isFinite(rawEx.sets) || rawEx.sets <= 0) {
        errors.push(`${exLabel}: invalid "sets" — must be a positive number.`);
      }
      if (typeof rawEx.targetReps !== 'string' || !rawEx.targetReps.trim()) {
        errors.push(`${exLabel}: missing required field "targetReps" (e.g. "8-10" or "10").`);
      }

      // supersetWith must reference another exercise inside the same session.
      if (rawEx.supersetWith != null) {
        if (typeof rawEx.supersetWith !== 'string') {
          errors.push(`${exLabel}: "supersetWith" must be a string (exercise name).`);
        } else {
          const partnerLower = rawEx.supersetWith.trim().toLowerCase();
          const selfLower = typeof rawEx.name === 'string' ? rawEx.name.trim().toLowerCase() : '';
          if (partnerLower === selfLower) {
            errors.push(`${exLabel}: "supersetWith" references itself.`);
          } else if (!exerciseNamesLower.has(partnerLower)) {
            errors.push(
              `${exLabel}: "supersetWith" references "${rawEx.supersetWith}" but no exercise by that name exists in ${sessionLabel}.`
            );
          }
        }
      }

      // Equipment / weightType enum checks — soft (warn-only style): trainer
      // may omit, but if present must be one of the known values.
      const ALLOWED_EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other'] as const;
      if (rawEx.equipment != null) {
        if (typeof rawEx.equipment !== 'string' || !(ALLOWED_EQUIPMENT as readonly string[]).includes(rawEx.equipment)) {
          errors.push(
            `${exLabel}: "equipment" must be one of ${ALLOWED_EQUIPMENT.join(', ')}.`
          );
        }
      }
      if (rawEx.weightType != null && rawEx.weightType !== 'total' && rawEx.weightType !== 'per_side') {
        errors.push(`${exLabel}: "weightType" must be "total" or "per_side".`);
      }

      normalizedExercises.push({
        name: normalizeExerciseName(String(rawEx.name ?? '')),
        sets: typeof rawEx.sets === 'number' ? rawEx.sets : 0,
        targetReps: normalizeTargetReps(rawEx.targetReps),
        targetWeight: typeof rawEx.targetWeight === 'number' ? rawEx.targetWeight : undefined,
        isBodyweight: rawEx.isBodyweight === true || undefined,
        notes: typeof rawEx.notes === 'string' ? rawEx.notes : undefined,
        supersetWith: typeof rawEx.supersetWith === 'string' ? rawEx.supersetWith : undefined,
        equipment: rawEx.equipment as PlanExercise['equipment'],
        weightType: rawEx.weightType as PlanExercise['weightType'],
      });
    });

    normalizedSessions.push({
      id: String(rawSession.id ?? ''),
      name: String(rawSession.name ?? ''),
      exercises: normalizedExercises,
    });
  });

  if (errors.length > 0) {
    return { plan: null, errors };
  }

  const plan: TrainerPlan = {
    planId: String(p.planId),
    name: String(p.name),
    version: Number(p.version),
    createdDate: typeof p.createdDate === 'string' ? p.createdDate : new Date().toISOString(),
    blockType: typeof p.blockType === 'string' ? p.blockType : undefined,
    weeklyStructure: Array.isArray(p.weeklyStructure)
      ? (p.weeklyStructure as unknown[]).filter((n): n is string => typeof n === 'string')
      : undefined,
    progressionScheme: typeof p.progressionScheme === 'string' ? p.progressionScheme : undefined,
    sessions: normalizedSessions,
    trainerNotes: typeof p.trainerNotes === 'string' ? p.trainerNotes : undefined,
  };

  return { plan, errors: [] };
}

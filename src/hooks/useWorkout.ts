'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  WorkoutSession,
  WorkoutType,
  GymExercise,
  GymSet,
  CardioEntry,
  CardioActivity,
  CompletedInterval,
} from '@/lib/types';
import { normalizeExerciseName } from '@/lib/exercises';
import {
  saveSession,
  getSession,
  generateId,
  getExerciseHistory,
  getPRs,
  finalizePRs,
  isWorkingSet,
  MIN_PR_REPS,
  finalizeSession,
  dissolveBrokenSupersets,
} from '@/lib/storage';

interface UseWorkoutOptions {
  sessionId?: string;
}

export function useWorkout(options: UseWorkoutOptions = {}) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPRs, setNewPRs] = useState<string[]>([]); // Exercises with beaten records (celebrate)
  const [newBaselines, setNewBaselines] = useState<string[]>([]); // First-ever exercises (silent)

  // sessionRef mirrors `session` and is the source every mutator reads from.
  // React's closed-over `session` is stale by one render cycle; before this
  // refactor, two mutations in the same tick both read the same pre-mutation
  // snapshot, computed independent deltas, and the second clobbered the
  // first in both state and localStorage (review B1 — the same bug that
  // bulkAddExercises worked around). Mutators now serialize through mutate():
  // they read ref, derive next, write state + storage + ref, so back-to-back
  // calls chain correctly and cross-component writes stay coherent.
  const sessionRef = useRef<WorkoutSession | null>(null);

  // Keep the ref aligned with React state on every commit. Mutate() also
  // updates the ref synchronously at write time, so intra-tick callers see
  // their own writes; this effect handles rerenders from other sources
  // (initial load, external patchSession, etc.).
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Snapshot of pre-session PR WEIGHTS keyed by lowercased exercise name.
  // Gates celebrations: a set is a live PR only when its weight strictly
  // exceeds this snapshot value. Absence of a key = no prior PR for this
  // exercise → baseline (silent). PRs compare by weight (Dylan's spec),
  // not by e1RM, so this map holds raw weight values.
  const prSnapshotRef = useRef<Map<string, number>>(new Map());

  // Build the pre-session PR snapshot from current storage. Shared between
  // startSession (new workout) and the sessionId-load effect (edit-from-
  // history) so PR celebrations work consistently in both flows.
  const snapshotCurrentPRs = () => {
    const snapshot = new Map<string, number>();
    getPRs().forEach(pr => snapshot.set(pr.exerciseName.toLowerCase(), pr.weight));
    prSnapshotRef.current = snapshot;
  };

  // Apply a transform to the current session, commit to state + storage,
  // keep the ref in lockstep. fn returns the next session (or the same
  // reference to bail out). Every mutator routes through this — back-to-back
  // calls in the same tick each see the prior write via sessionRef.
  const mutate = useCallback((fn: (current: WorkoutSession) => WorkoutSession) => {
    const current = sessionRef.current;
    if (!current) return;
    const next = fn(current);
    if (next === current) return;
    sessionRef.current = next;
    setSession(next);
    saveSession(next);
  }, []);

  // Load existing session or create new one
  useEffect(() => {
    if (options.sessionId) {
      const existingSession = getSession(options.sessionId);
      if (existingSession) {
        setSession(existingSession);
        // Seed the ref directly so the first mutator in this session picks
        // up the real state (the useEffect that syncs ref from state hasn't
        // run yet on the same tick).
        sessionRef.current = existingSession;
        // Populate the PR snapshot so edit-flow PR detection mirrors a
        // fresh session. Without this, any top set in an edited session
        // was mis-tagged as a silent baseline (review M4).
        snapshotCurrentPRs();
      }
    }
    setIsLoading(false);
  }, [options.sessionId]);

  // Start a new workout session. Optional planSessionId is stored on the
  // session so plan rotation can match deterministically later instead of
  // guessing from exercise-name overlap (review M6).
  const startSession = useCallback((type: WorkoutType, date: string, planSessionId?: string) => {
    // Snapshot pre-session PR weights so mid-session set escalations don't
    // double-fire celebrations. Absence of a key = no prior history for that
    // exercise → baseline (silent), not PR.
    snapshotCurrentPRs();

    const newSession: WorkoutSession = {
      id: generateId(),
      // Stable id for idempotent cloud writes — minted once here, reused on
      // every write/retry for this session (UUID where available).
      clientSessionId:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : generateId(),
      date,
      type,
      startTime: new Date().toISOString(),
      completed: false,
      exercises: [],
      cardio: [],
      ...(planSessionId && { planSessionId }),
    };
    setSession(newSession);
    sessionRef.current = newSession;
    saveSession(newSession);
    return newSession;
  }, []);

  // Add a gym exercise. Name is normalized at the entry point so the canonical
  // form reaches every downstream surface (picker, log, PR labels, brief).
  const addExercise = useCallback((name: string, initialSets?: GymSet[]) => {
    const newExercise: GymExercise = {
      id: generateId(),
      name: normalizeExerciseName(name),
      sets: initialSets ?? [],
    };
    mutate(current => ({
      ...current,
      exercises: [...(current.exercises || []), newExercise],
    }));
    return newExercise;
  }, [mutate]);

  // Bulk-add multiple exercises atomically. Used by plan preload so the
  // entire programmed workout shows up in one write. Accepts plan targets
  // (plannedSets/Weight/Reps) so per-exercise status auto-derivation and
  // BRIEF display work from the logged session alone — no need for the
  // plan to still be loaded or matchable later. Also accepts optional
  // supersetGroupId so plan pairings survive into the running session (M7).
  const bulkAddExercises = useCallback((
    items: {
      name: string;
      sets: GymSet[];
      supersetGroupId?: string;
      equipment?: GymExercise['equipment'];
      weightType?: GymExercise['weightType'];
      plannedSets?: number;
      plannedWeight?: number;
      plannedReps?: string;
    }[]
  ) => {
    if (items.length === 0) return;
    const newExercises: GymExercise[] = items.map(item => ({
      id: generateId(),
      name: normalizeExerciseName(item.name),
      sets: item.sets,
      ...(item.supersetGroupId && { supersetGroupId: item.supersetGroupId }),
      ...(item.equipment && { equipment: item.equipment }),
      ...(item.weightType && { weightType: item.weightType }),
      ...(item.plannedSets !== undefined && { plannedSets: item.plannedSets }),
      ...(item.plannedWeight !== undefined && { plannedWeight: item.plannedWeight }),
      ...(item.plannedReps !== undefined && { plannedReps: item.plannedReps }),
    }));
    mutate(current => ({
      ...current,
      exercises: [...(current.exercises || []), ...newExercises],
    }));
  }, [mutate]);

  // Live PR / baseline detection — fires celebration UI only. Storage commit
  // happens once at session completion (finalizePRs), so mid-set edits, typos,
  // or set removals can't leave orphan PRs behind. Set must be a working set
  // and hit MIN_PR_REPS; comparison is by weight against the pre-session
  // snapshot. Strictly greater = PR, matching weight does not upgrade (Dylan's
  // spec). One celebration per exercise per session — subsequent qualifying
  // sets just update the stored best silently. Shared by logSet + addSet.
  const detectPR = useCallback((exerciseName: string, set: Omit<GymSet, 'id'>) => {
    if (!isWorkingSet(set as GymSet) || set.reps < MIN_PR_REPS) return;
    const preSessionWeight = prSnapshotRef.current.get(exerciseName.toLowerCase());
    if (preSessionWeight === undefined) {
      setNewBaselines(prev => (prev.includes(exerciseName) ? prev : [...prev, exerciseName]));
    } else if (set.weight > preSessionWeight) {
      setNewPRs(prev => (prev.includes(exerciseName) ? prev : [...prev, exerciseName]));
    }
  }, []);

  // Log a working/warmup set from the add-set form. Fills the FIRST remaining
  // planned placeholder if one exists, else appends. CRITICAL: the planned
  // slot is resolved INSIDE the mutate transform against fresh state (via
  // sessionRef), not from a stale render snapshot — that closes the
  // double-tap race where two rapid logs both targeted the same planned index,
  // dropped one logged set, and made a completed exercise persist as PARTIAL.
  const logSet = useCallback((exerciseId: string, set: Omit<GymSet, 'id'>) => {
    let exerciseName: string | undefined;
    mutate(current => {
      const updatedExercises = current.exercises?.map(ex => {
        if (ex.id !== exerciseId) return ex;
        exerciseName = ex.name;
        const plannedIdx = ex.sets.findIndex(s => s.isPlanned);
        if (plannedIdx >= 0) {
          const sets = [...ex.sets];
          sets[plannedIdx] = { ...set, isPlanned: false };
          return { ...ex, sets };
        }
        return { ...ex, sets: [...ex.sets, set] };
      });
      return { ...current, exercises: updatedExercises };
    });
    if (exerciseName) detectPR(exerciseName, set);
  }, [mutate, detectPR]);

  // Append a set to an exercise (no planned-slot resolution). Used by
  // duplicate-last-set and any caller that explicitly wants an appended row.
  const addSet = useCallback((exerciseId: string, set: Omit<GymSet, 'id'>) => {
    let exerciseName: string | undefined;
    mutate(current => {
      const updatedExercises = current.exercises?.map(ex => {
        if (ex.id === exerciseId) {
          exerciseName = ex.name;
          return { ...ex, sets: [...ex.sets, set] };
        }
        return ex;
      });
      return { ...current, exercises: updatedExercises };
    });
    if (exerciseName) detectPR(exerciseName, set);
  }, [mutate, detectPR]);

  // Update a set
  const updateSet = useCallback((exerciseId: string, setIndex: number, updates: Partial<GymSet>) => {
    mutate(current => {
      const updatedExercises = current.exercises?.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = [...ex.sets];
          updatedSets[setIndex] = { ...updatedSets[setIndex], ...updates };
          return { ...ex, sets: updatedSets };
        }
        return ex;
      });
      return { ...current, exercises: updatedExercises };
    });
  }, [mutate]);

  // Remove a set
  const removeSet = useCallback((exerciseId: string, setIndex: number) => {
    mutate(current => {
      const updatedExercises = current.exercises?.map(ex => {
        if (ex.id === exerciseId) {
          return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
        }
        return ex;
      });
      return { ...current, exercises: updatedExercises };
    });
  }, [mutate]);

  // Remove an exercise
  const removeExercise = useCallback((exerciseId: string) => {
    mutate(current => ({
      ...current,
      exercises: current.exercises?.filter(ex => ex.id !== exerciseId),
    }));
  }, [mutate]);

  // Add exercise notes
  const updateExerciseNotes = useCallback((exerciseId: string, notes: string) => {
    mutate(current => ({
      ...current,
      exercises: current.exercises?.map(ex =>
        ex.id === exerciseId ? { ...ex, notes } : ex
      ),
    }));
  }, [mutate]);

  // Update weight type for an exercise
  const updateExerciseWeightType = useCallback((exerciseId: string, weightType: 'total' | 'per_side') => {
    mutate(current => ({
      ...current,
      exercises: current.exercises?.map(ex =>
        ex.id === exerciseId ? { ...ex, weightType } : ex
      ),
    }));
  }, [mutate]);

  // Link two exercises as a superset
  const linkSuperset = useCallback((exerciseIdA: string, exerciseIdB: string) => {
    mutate(current => {
      const a = current.exercises?.find(ex => ex.id === exerciseIdA);
      const b = current.exercises?.find(ex => ex.id === exerciseIdB);
      if (!a || !b) return current;
      const groupId = a.supersetGroupId || b.supersetGroupId || generateId();
      return {
        ...current,
        exercises: current.exercises?.map(ex =>
          ex.id === exerciseIdA || ex.id === exerciseIdB
            ? { ...ex, supersetGroupId: groupId }
            : ex
        ),
      };
    });
  }, [mutate]);

  // Remove an exercise from its superset group. If the partner is left
  // alone in the group, clear its groupId too — a single-member "group" is
  // not a superset.
  const unlinkSuperset = useCallback((exerciseId: string) => {
    mutate(current => {
      const ex = current.exercises?.find(e => e.id === exerciseId);
      if (!ex?.supersetGroupId) return current;
      const groupId = ex.supersetGroupId;
      const remaining = current.exercises?.filter(
        e => e.supersetGroupId === groupId && e.id !== exerciseId
      ) || [];
      return {
        ...current,
        exercises: current.exercises?.map(e => {
          if (e.id === exerciseId) return { ...e, supersetGroupId: undefined };
          if (e.supersetGroupId === groupId && remaining.length === 1 && remaining[0].id === e.id) {
            return { ...e, supersetGroupId: undefined };
          }
          return e;
        }),
      };
    });
  }, [mutate]);

  // Reorder exercises to match a new id order (from the reorder sheet). Any id
  // not present is appended unchanged (defensive — never drop an exercise).
  // Each exercise carries its own sets[], so logged data travels with the card.
  // Supersets that are no longer adjacent after the move are auto-unlinked
  // (dissolveBrokenSupersets) per spec §4b.
  const reorderExercises = useCallback((orderedIds: string[]) => {
    mutate(current => {
      const existing = current.exercises ?? [];
      const byId = new Map(existing.map(e => [e.id, e]));
      const reordered = orderedIds
        .map(id => byId.get(id))
        .filter((e): e is GymExercise => !!e);
      const appended = existing.filter(e => !orderedIds.includes(e.id));
      const next = dissolveBrokenSupersets([...reordered, ...appended]);
      return { ...current, exercises: next };
    });
  }, [mutate]);

  // Quick duplicate last set
  const duplicateLastSet = useCallback((exerciseId: string) => {
    const current = sessionRef.current;
    if (!current || current.type !== 'gym') return;
    const exercise = current.exercises?.find(ex => ex.id === exerciseId);
    if (!exercise || exercise.sets.length === 0) return;
    const lastSet = exercise.sets[exercise.sets.length - 1];
    addSet(exerciseId, { ...lastSet });
  }, [addSet]);

  // Add cardio entry
  const addCardioEntry = useCallback((
    activity: CardioActivity,
    distance?: number,
    duration?: number,
    notes?: string,
    incline?: number,
    speed?: number
  ) => {
    const newEntry: CardioEntry = {
      id: generateId(),
      activity,
      ...(distance !== undefined && { distance }),
      ...(duration !== undefined && { duration }),
      ...(incline !== undefined && { incline }),
      ...(speed !== undefined && { speed }),
      notes,
    };
    mutate(current => ({
      ...current,
      cardio: [...(current.cardio || []), newEntry],
    }));
    return newEntry;
  }, [mutate]);

  // Update cardio entry
  const updateCardioEntry = useCallback((entryId: string, updates: Partial<CardioEntry>) => {
    mutate(current => ({
      ...current,
      cardio: current.cardio?.map(entry =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      ),
    }));
  }, [mutate]);

  // Remove cardio entry
  const removeCardioEntry = useCallback((entryId: string) => {
    mutate(current => ({
      ...current,
      cardio: current.cardio?.filter(entry => entry.id !== entryId),
    }));
  }, [mutate]);

  // Complete the session. Three things happen, in this order:
  //   1. Auto-derive per-exercise status (while isPlanned placeholders are
  //      still present — deriveExerciseStatus needs the original planned
  //      count to compute the completion ratio).
  //   2. Strip isPlanned placeholders. They're a UX scaffold, not data —
  //      leaving them in pollutes stats and the BRIEF (review N7).
  //   3. Commit PRs via finalizePRs — the one and only PR write point,
  //      safe to re-run on edit-complete; never downgrades.
  // Status is only pre-set here (auto). User can override from the summary
  // screen; the override path writes back via patchSession and doesn't need
  // to re-run this flow.
  const completeSession = useCallback(() => {
    // Read fresh from storage rather than the ref: every mutation persists
    // synchronously, so storage is the authoritative latest state, and this
    // can't silently no-op the way the old mutate() path did when the ref was
    // null (which left sessions stuck "In Progress" with no endTime). Falls
    // back to the ref only if storage somehow lacks the row.
    const id = sessionRef.current?.id ?? options.sessionId;
    if (!id) return;
    const fresh = getSession(id) ?? sessionRef.current;
    if (!fresh) return;
    const completed: WorkoutSession = {
      ...finalizeSession(fresh, { stampEnd: true }),
      // Snapshot the live-detected PR/baseline names so the Supabase sweep can
      // rebuild the BRIEF with highlights later (newPRs/newBaselines are hook
      // state and gone by then).
      ...((newPRs.length || newBaselines.length)
        ? { prSummary: { prs: newPRs, baselines: newBaselines } }
        : {}),
    };
    sessionRef.current = completed;
    setSession(completed);
    saveSession(completed);
    if (completed.type === 'gym') finalizePRs(completed);
  }, [options.sessionId, newPRs, newBaselines]);

  // Append a completed interval run to the session. Intervals are timed
  // conditioning blocks logged alongside exercises/cardio; they don't
  // participate in PR evaluation.
  const logInterval = useCallback((completed: CompletedInterval) => {
    mutate(current => ({
      ...current,
      intervals: [...(current.intervals ?? []), completed],
    }));
  }, [mutate]);

  // Update session notes
  const updateSessionNotes = useCallback((notes: string) => {
    mutate(current => ({ ...current, notes }));
  }, [mutate]);

  // Get history for an exercise
  const getHistory = useCallback((exerciseName: string) => {
    return getExerciseHistory(exerciseName);
  }, []);

  // Clear new PRs notification (also clears baselines — they're session-scoped)
  const clearNewPRs = useCallback(() => {
    setNewPRs([]);
    setNewBaselines([]);
  }, []);

  // Calculate session stats
  const getSessionStats = useCallback(() => {
    if (!session) return null;

    if (session.type === 'gym') {
      let totalSets = 0;
      let totalVolume = 0;
      const exerciseCount = session.exercises?.length || 0;

      session.exercises?.forEach(ex => {
        ex.sets.forEach(set => {
          if (isWorkingSet(set)) {
            totalSets++;
            totalVolume += set.weight * set.reps;
          }
        });
      });

      return {
        exerciseCount,
        totalSets,
        totalVolume,
        duration: session.endTime
          ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60)
          : null,
      };
    } else {
      let totalDistance = 0;
      let totalDuration = 0;

      session.cardio?.forEach(entry => {
        totalDistance += entry.distance ?? 0;
        totalDuration += entry.duration ?? 0;
      });

      return {
        activityCount: session.cardio?.length || 0,
        totalDistance,
        totalDuration,
        avgPace: totalDistance > 0 ? totalDuration / totalDistance : 0,
      };
    }
  }, [session]);

  return {
    session,
    isLoading,
    newPRs,
    newBaselines,
    startSession,
    addExercise,
    bulkAddExercises,
    logSet,
    addSet,
    updateSet,
    removeSet,
    removeExercise,
    updateExerciseNotes,
    updateExerciseWeightType,
    duplicateLastSet,
    addCardioEntry,
    updateCardioEntry,
    removeCardioEntry,
    logInterval,
    completeSession,
    updateSessionNotes,
    getHistory,
    getSessionStats,
    clearNewPRs,
    linkSuperset,
    unlinkSuperset,
    reorderExercises,
  };
}

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
import {
  saveSession,
  getSession,
  generateId,
  getExerciseHistory,
  getPRs,
  computeE1RM,
} from '@/lib/storage';

interface UseWorkoutOptions {
  sessionId?: string;
}

export function useWorkout(options: UseWorkoutOptions = {}) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPRs, setNewPRs] = useState<string[]>([]); // Exercises with beaten records (celebrate)
  const [newBaselines, setNewBaselines] = useState<string[]>([]); // First-ever exercises (silent)
  // Snapshot of pre-session PR e1RMs — used to gate celebrations and to
  // distinguish baseline (no entry) from improvement (entry present).
  const prSnapshotRef = useRef<Map<string, number>>(new Map());

  // Load existing session or create new one
  useEffect(() => {
    if (options.sessionId) {
      const existingSession = getSession(options.sessionId);
      if (existingSession) {
        setSession(existingSession);
      }
    }
    setIsLoading(false);
  }, [options.sessionId]);

  // Start a new workout session
  const startSession = useCallback((type: WorkoutType, date: string) => {
    // Snapshot all existing PR e1RMs before this session begins (Epley).
    // Comparisons in addSet use this snapshot so intra-session set escalations
    // don't trigger false PR celebrations. Absence of a key = no prior history
    // for that exercise → baseline, not PR.
    const allPRs = getPRs();
    const snapshot = new Map<string, number>();
    allPRs.forEach(pr => {
      const e1rm = pr.e1rm && pr.e1rm > 0 ? pr.e1rm : computeE1RM(pr.weight, pr.reps);
      snapshot.set(pr.exerciseName.toLowerCase(), e1rm);
    });
    prSnapshotRef.current = snapshot;

    const newSession: WorkoutSession = {
      id: generateId(),
      date,
      type,
      startTime: new Date().toISOString(),
      completed: false,
      exercises: [],
      cardio: [],
    };
    setSession(newSession);
    saveSession(newSession);
    return newSession;
  }, []);

  // Add a gym exercise
  const addExercise = useCallback((name: string, initialSets?: GymSet[]) => {
    if (!session) return;

    const newExercise: GymExercise = {
      id: generateId(),
      name,
      sets: initialSets ?? [],
    };

    const updatedSession = {
      ...session,
      exercises: [...(session.exercises || []), newExercise],
    };

    setSession(updatedSession);
    saveSession(updatedSession);
    return newExercise;
  }, [session]);

  // Bulk-add multiple exercises atomically. Used by plan preload so the
  // entire programmed workout shows up in order. A per-call addExercise
  // loop races here: each setTimeout captures the same stale `session`
  // closure and writes-then-clobbers, leaving only the last exercise.
  // This commits everything in one setState + one saveSession.
  const bulkAddExercises = useCallback((items: { name: string; sets: GymSet[] }[]) => {
    if (!session || items.length === 0) return;
    const newExercises: GymExercise[] = items.map(item => ({
      id: generateId(),
      name: item.name,
      sets: item.sets,
    }));
    const updatedSession = {
      ...session,
      exercises: [...(session.exercises || []), ...newExercises],
    };
    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Add a set to an exercise
  const addSet = useCallback((exerciseId: string, set: Omit<GymSet, 'id'>) => {
    if (!session) return;

    const updatedExercises = session.exercises?.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: [...ex.sets, set],
        };
      }
      return ex;
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    // Per-set PR evaluation (Epley e1RM). Celebrate only when a set beats the
    // pre-session snapshot. First-ever exercises (no snapshot entry) establish
    // a baseline — tracked for BRIEF but never trigger sound/banner.
    const exercise = updatedExercises?.find(ex => ex.id === exerciseId);
    if (exercise && !set.isWarmup && !set.isPlanned && !set.isBodyweight && set.weight > 0 && set.reps > 0) {
      const key = exercise.name.toLowerCase();
      const preSessionBest = prSnapshotRef.current.get(key);
      const setE1RM = computeE1RM(set.weight, set.reps);

      if (preSessionBest === undefined) {
        // No prior history → baseline (silent)
        setNewBaselines(prev =>
          prev.includes(exercise.name) ? prev : [...prev, exercise.name]
        );
      } else if (setE1RM > preSessionBest) {
        setNewPRs(prev =>
          prev.includes(exercise.name) ? prev : [...prev, exercise.name]
        );
      }
    }

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Update a set
  const updateSet = useCallback((exerciseId: string, setIndex: number, updates: Partial<GymSet>) => {
    if (!session) return;

    const updatedExercises = session.exercises?.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = { ...updatedSets[setIndex], ...updates };
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Remove a set
  const removeSet = useCallback((exerciseId: string, setIndex: number) => {
    if (!session) return;

    const updatedExercises = session.exercises?.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = ex.sets.filter((_, i) => i !== setIndex);
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Remove an exercise
  const removeExercise = useCallback((exerciseId: string) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      exercises: session.exercises?.filter(ex => ex.id !== exerciseId),
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Add exercise notes
  const updateExerciseNotes = useCallback((exerciseId: string, notes: string) => {
    if (!session) return;

    const updatedExercises = session.exercises?.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, notes };
      }
      return ex;
    });

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Update weight type for an exercise
  const updateExerciseWeightType = useCallback((exerciseId: string, weightType: 'total' | 'per_side') => {
    if (!session) return;
    const updatedExercises = session.exercises?.map(ex => {
      if (ex.id === exerciseId) return { ...ex, weightType };
      return ex;
    });
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Link two exercises as a superset
  const linkSuperset = useCallback((exerciseIdA: string, exerciseIdB: string) => {
    if (!session) return;
    const a = session.exercises?.find(ex => ex.id === exerciseIdA);
    const b = session.exercises?.find(ex => ex.id === exerciseIdB);
    if (!a || !b) return;
    const groupId = a.supersetGroupId || b.supersetGroupId || generateId();
    const updatedExercises = session.exercises?.map(ex => {
      if (ex.id === exerciseIdA || ex.id === exerciseIdB) return { ...ex, supersetGroupId: groupId };
      return ex;
    });
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Remove an exercise from its superset group
  const unlinkSuperset = useCallback((exerciseId: string) => {
    if (!session) return;
    const ex = session.exercises?.find(e => e.id === exerciseId);
    if (!ex?.supersetGroupId) return;
    const groupId = ex.supersetGroupId;
    const remaining = session.exercises?.filter(e => e.supersetGroupId === groupId && e.id !== exerciseId) || [];
    const updatedExercises = session.exercises?.map(e => {
      if (e.id === exerciseId) return { ...e, supersetGroupId: undefined };
      // If only one left in group, clear their groupId too
      if (e.supersetGroupId === groupId && remaining.length === 1 && remaining[0].id === e.id) return { ...e, supersetGroupId: undefined };
      return e;
    });
    const updatedSession = { ...session, exercises: updatedExercises };
    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Quick duplicate last set
  const duplicateLastSet = useCallback((exerciseId: string) => {
    if (!session || session.type !== 'gym') return;

    const exercise = session.exercises?.find(ex => ex.id === exerciseId);
    if (!exercise || exercise.sets.length === 0) return;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    addSet(exerciseId, { ...lastSet });
  }, [session, addSet]);

  // Add cardio entry
  const addCardioEntry = useCallback((
    activity: CardioActivity,
    distance?: number,
    duration?: number,
    notes?: string,
    incline?: number,
    speed?: number
  ) => {
    if (!session) return;

    const newEntry: CardioEntry = {
      id: generateId(),
      activity,
      ...(distance !== undefined && { distance }),
      ...(duration !== undefined && { duration }),
      ...(incline !== undefined && { incline }),
      ...(speed !== undefined && { speed }),
      notes,
    };

    const updatedSession = {
      ...session,
      cardio: [...(session.cardio || []), newEntry],
    };

    setSession(updatedSession);
    saveSession(updatedSession);
    return newEntry;
  }, [session]);

  // Update cardio entry
  const updateCardioEntry = useCallback((entryId: string, updates: Partial<CardioEntry>) => {
    if (!session) return;

    const updatedCardio = session.cardio?.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, ...updates };
      }
      return entry;
    });

    const updatedSession = {
      ...session,
      cardio: updatedCardio,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Remove cardio entry
  const removeCardioEntry = useCallback((entryId: string) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      cardio: session.cardio?.filter(entry => entry.id !== entryId),
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Complete the session
  const completeSession = useCallback(() => {
    if (!session) return;

    const updatedSession = {
      ...session,
      endTime: new Date().toISOString(),
      completed: true,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Append a completed interval run to the session. Intervals are timed
  // conditioning blocks logged alongside exercises/cardio; they don't
  // participate in PR evaluation.
  const logInterval = useCallback((completed: CompletedInterval) => {
    if (!session) return;
    const updatedSession: WorkoutSession = {
      ...session,
      intervals: [...(session.intervals ?? []), completed],
    };
    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Update session notes
  const updateSessionNotes = useCallback((notes: string) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      notes,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

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
      let exerciseCount = session.exercises?.length || 0;

      session.exercises?.forEach(ex => {
        ex.sets.forEach(set => {
          if (!set.isWarmup && !set.isPlanned) {
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
  };
}

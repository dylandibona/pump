'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  WorkoutSession,
  WorkoutType,
  GymExercise,
  GymSet,
  CardioEntry,
  CardioActivity,
} from '@/lib/types';
import {
  saveSession,
  getSession,
  generateId,
  getExerciseHistory,
  getPRForExercise,
} from '@/lib/storage';

interface UseWorkoutOptions {
  sessionId?: string;
}

export function useWorkout(options: UseWorkoutOptions = {}) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPRs, setNewPRs] = useState<string[]>([]); // Track exercises with new PRs

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
    const newSession: WorkoutSession = {
      id: generateId(),
      date,
      type,
      startTime: new Date().toISOString(),
      completed: false,
      exercises: type === 'gym' ? [] : undefined,
      cardio: type === 'cardio' ? [] : undefined,
    };
    setSession(newSession);
    saveSession(newSession);
    return newSession;
  }, []);

  // Add a gym exercise
  const addExercise = useCallback((name: string) => {
    if (!session || session.type !== 'gym') return;

    const newExercise: GymExercise = {
      id: generateId(),
      name,
      sets: [],
    };

    const updatedSession = {
      ...session,
      exercises: [...(session.exercises || []), newExercise],
    };

    setSession(updatedSession);
    saveSession(updatedSession);
    return newExercise;
  }, [session]);

  // Add a set to an exercise
  const addSet = useCallback((exerciseId: string, set: Omit<GymSet, 'id'>) => {
    if (!session || session.type !== 'gym') return;

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

    // Check for PR
    const exercise = updatedExercises?.find(ex => ex.id === exerciseId);
    if (exercise && !set.isWarmup) {
      const currentPR = getPRForExercise(exercise.name);
      if (currentPR) {
        const currentEstimated1RM = currentPR.weight * (36 / (37 - Math.min(currentPR.reps, 36)));
        const newEstimated1RM = set.weight * (36 / (37 - Math.min(set.reps, 36)));

        if (newEstimated1RM > currentEstimated1RM) {
          setNewPRs(prev => [...prev, exercise.name]);
        }
      } else {
        // First time doing this exercise
        setNewPRs(prev => [...prev, exercise.name]);
      }
    }

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Update a set
  const updateSet = useCallback((exerciseId: string, setIndex: number, updates: Partial<GymSet>) => {
    if (!session || session.type !== 'gym') return;

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
    if (!session || session.type !== 'gym') return;

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
    if (!session || session.type !== 'gym') return;

    const updatedSession = {
      ...session,
      exercises: session.exercises?.filter(ex => ex.id !== exerciseId),
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  }, [session]);

  // Add exercise notes
  const updateExerciseNotes = useCallback((exerciseId: string, notes: string) => {
    if (!session || session.type !== 'gym') return;

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

  // Quick duplicate last set
  const duplicateLastSet = useCallback((exerciseId: string) => {
    if (!session || session.type !== 'gym') return;

    const exercise = session.exercises?.find(ex => ex.id === exerciseId);
    if (!exercise || exercise.sets.length === 0) return;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    addSet(exerciseId, { ...lastSet });
  }, [session, addSet]);

  // Add cardio entry
  const addCardioEntry = useCallback((activity: CardioActivity, distance: number, duration: number, notes?: string) => {
    if (!session || session.type !== 'cardio') return;

    const newEntry: CardioEntry = {
      id: generateId(),
      activity,
      distance,
      duration,
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
    if (!session || session.type !== 'cardio') return;

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
    if (!session || session.type !== 'cardio') return;

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

  // Clear new PRs notification
  const clearNewPRs = useCallback(() => {
    setNewPRs([]);
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
          if (!set.isWarmup) {
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
        totalDistance += entry.distance;
        totalDuration += entry.duration;
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
    startSession,
    addExercise,
    addSet,
    updateSet,
    removeSet,
    removeExercise,
    updateExerciseNotes,
    duplicateLastSet,
    addCardioEntry,
    updateCardioEntry,
    removeCardioEntry,
    completeSession,
    updateSessionNotes,
    getHistory,
    getSessionStats,
    clearNewPRs,
  };
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Plus, Copy, FileText, Check, Activity, Bike, Waves, Ship, Footprints, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
import { RestTimerInline } from './Timer';
import { WorkoutTimerBar } from './WorkoutTimerBar';
import { IntervalFlow } from './IntervalFlow';
import { ReorderExercisesSheet } from './ReorderExercisesSheet';
import { Timer as TimerIcon, Zap } from 'lucide-react';
import { useWorkout } from '@/hooks/useWorkout';
import { GymExercise, GymSet, CardioActivity, CardioEntry } from '@/lib/types';
import { getExerciseHistory, getPRForExercise } from '@/lib/storage';
import { playSetCompleteFeedback, playPRFeedback, preloadSound } from '@/lib/sounds';
import { parseSessionDate } from '@/lib/utils';

interface GymWorkoutProps {
  sessionId?: string;
  planSession?: import('@/lib/types').PlanSession | null;
  onComplete?: () => void;
}

export function GymWorkout({ sessionId, planSession, onComplete }: GymWorkoutProps) {
  const {
    session,
    newPRs,
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
    removeCardioEntry,
    logInterval,
    linkSuperset,
    unlinkSuperset,
    reorderExercises,
    completeSession,
    getSessionStats,
    clearNewPRs,
  } = useWorkout({ sessionId });

  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(!planSession);
  const [showCardioSection, setShowCardioSection] = useState(false);
  const [showIntervalFlow, setShowIntervalFlow] = useState(false);
  const [linkingExerciseId, setLinkingExerciseId] = useState<string | null>(null);
  const [showReorder, setShowReorder] = useState(false);
  const planLoadedRef = useRef(false);
  const prevPRCountRef = useRef(newPRs.length);

  // Pre-load plan session exercises with placeholder sets once when session
  // is ready. Committed in a single atomic write so the whole programmed
  // workout lands at once (prior setTimeout-loop version lost all but the
  // last exercise to stale-closure races). Superset pairings from the plan
  // are preserved by hoisting each `supersetWith` link into a shared
  // supersetGroupId (review M7) — without this, arriving in the gym view
  // required manually re-linking every pair.
  useEffect(() => {
    if (!planSession || !session || planLoadedRef.current || session.exercises?.length) return;
    planLoadedRef.current = true;

    // Build name → shared groupId map by scanning the plan's supersetWith
    // declarations. Both ends of the pair share one id so the running
    // session's linkage UI treats them as one superset.
    const nameKey = (s: string) => s.trim().toLowerCase();
    const groupIds = new Map<string, string>();
    planSession.exercises.forEach((planEx) => {
      if (!planEx.supersetWith) return;
      const selfKey = nameKey(planEx.name);
      const partnerKey = nameKey(planEx.supersetWith);
      const existing = groupIds.get(selfKey) ?? groupIds.get(partnerKey);
      const groupId = existing ?? `ss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      groupIds.set(selfKey, groupId);
      groupIds.set(partnerKey, groupId);
    });

    const items = planSession.exercises.map((planEx) => {
      const targetWeight = planEx.isBodyweight ? 0 : (planEx.targetWeight ?? 0);
      const setCount = planEx.sets ?? 3;
      const initialSets: import('@/lib/types').GymSet[] = Array.from({ length: setCount }, () => ({
        weight: targetWeight,
        reps: 0,
        isBodyweight: planEx.isBodyweight ?? false,
        isPlanned: true,
      }));
      return {
        name: planEx.name,
        sets: initialSets,
        supersetGroupId: groupIds.get(nameKey(planEx.name)),
        equipment: planEx.equipment,
        weightType: planEx.weightType,
        // Persist plan targets onto the logged exercise so status
        // auto-derivation and BRIEF display are self-contained.
        plannedSets: setCount,
        plannedWeight: planEx.isBodyweight ? undefined : planEx.targetWeight,
        plannedReps: planEx.targetReps,
      };
    });
    bulkAddExercises(items);
  }, [planSession, session, bulkAddExercises]);

  // Preload PR / set-complete audio buffer once per session so Web Audio
  // has it decoded by the time the first set lands.
  useEffect(() => {
    preloadSound('setComplete');
  }, []);

  // Play sound when a new PR is achieved
  useEffect(() => {
    if (newPRs.length > prevPRCountRef.current) {
      playPRFeedback();
    }
    prevPRCountRef.current = newPRs.length;
  }, [newPRs.length]);

  const handleAddExercise = useCallback((exercise: string | { name: string }) => {
    const name = typeof exercise === 'string' ? exercise : exercise.name;
    if (name.trim()) {
      addExercise(name.trim());
      setNewExerciseName('');
      setShowAddExercise(false);
    }
  }, [addExercise]);

  const handleComplete = () => {
    completeSession();
    onComplete?.();
  };

  if (!session) return null;

  const stats = getSessionStats();

  return (
    <div className="space-y-4 pb-24">
      {/* Persistent timer header — session clock + rest presets, sticks to
          top of the scroll container so it's always reachable mid-set. */}
      <WorkoutTimerBar startTime={session.startTime} />

      {/* New PR Celebration */}
      <AnimatePresence>
        {newPRs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="glass rounded-2xl p-4 border-2 border-accent/50 relative overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 animate-shimmer" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center"
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <Trophy className="w-6 h-6 text-accent" />
                </motion.div>
                <div>
                  <p className="font-display text-2xl tracking-wider" style={{ color: 'var(--pump-cyan-deep)' }}>
                    NEW BEST!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {newPRs.join(', ')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearNewPRs}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reorder entry — only meaningful with 2+ exercises */}
      {session.exercises && session.exercises.length >= 2 && (
        <div className="flex justify-end -mb-2">
          <button
            onClick={() => setShowReorder(true)}
            className="text-xs font-display tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 py-1 touch-target"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            REORDER
          </button>
        </div>
      )}

      {/* Exercise List */}
      {session.exercises?.map((exercise, index) => {
        const exercises = session.exercises!;
        const nextExercise = exercises[index + 1];
        const isInSuperset = !!exercise.supersetGroupId;
        const isLinkedToNext = nextExercise && exercise.supersetGroupId && nextExercise.supersetGroupId === exercise.supersetGroupId;
        return (
          <div key={exercise.id}>
            <motion.div
              className={isInSuperset ? 'border-l-2 border-primary/50 pl-2' : ''}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {isInSuperset && (
                <div className="text-xs font-display tracking-widest text-primary/70 px-2 pb-1 flex items-center gap-1">
                  <span>⚡ SUPERSET</span>
                </div>
              )}
              <ExerciseCard
                exercise={exercise}
                planExercise={planSession?.exercises.find(p => p.name.toLowerCase() === exercise.name.toLowerCase())}
                onAddSet={(set) => addSet(exercise.id, set)}
                onUpdateSet={(idx, updates) => updateSet(exercise.id, idx, updates)}
                onRemoveSet={(idx) => removeSet(exercise.id, idx)}
                onRemoveExercise={() => removeExercise(exercise.id)}
                onDuplicateLastSet={() => duplicateLastSet(exercise.id)}
                onUpdateNotes={(notes) => updateExerciseNotes(exercise.id, notes)}
                onUpdateWeightType={(type) => updateExerciseWeightType(exercise.id, type)}
                isLinking={linkingExerciseId === exercise.id}
                onToggleLink={() => {
                  if (linkingExerciseId && linkingExerciseId !== exercise.id) {
                    linkSuperset(linkingExerciseId, exercise.id);
                    setLinkingExerciseId(null);
                  } else if (linkingExerciseId === exercise.id) {
                    setLinkingExerciseId(null);
                  } else {
                    setLinkingExerciseId(exercise.id);
                  }
                }}
                onUnlink={() => unlinkSuperset(exercise.id)}
              />
            </motion.div>

            {/* Superset connector / link button between exercises */}
            {nextExercise && (
              <div className="flex items-center gap-2 px-4 py-1">
                {isLinkedToNext ? (
                  <div className="flex items-center gap-2 text-primary/60 text-xs">
                    <div className="h-6 w-px bg-primary/40 mx-2" />
                    <span className="font-display tracking-wider">SUPERSET</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (linkingExerciseId === exercise.id) {
                        setLinkingExerciseId(null);
                      } else if (linkingExerciseId) {
                        linkSuperset(linkingExerciseId, exercise.id);
                        setLinkingExerciseId(null);
                      } else {
                        linkSuperset(exercise.id, nextExercise.id);
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors font-display tracking-wider flex items-center gap-1 py-1"
                  >
                    <Plus className="w-3 h-3" />
                    LINK AS SUPERSET
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Exercise */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {showAddExercise ? (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3">
              ADD EXERCISE
            </p>
            <ExerciseAutocomplete
              value={newExerciseName}
              onChange={setNewExerciseName}
              onSelect={handleAddExercise}
              placeholder="Search or add exercise..."
              autoFocus
            />
          </div>
        ) : (
          <Button
            onClick={() => setShowAddExercise(true)}
            variant="outline"
            className="w-full touch-target font-display text-lg tracking-wider border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            ADD EXERCISE
          </Button>
        )}
      </motion.div>

      {/* Cardio Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <button
          onClick={() => setShowCardioSection(!showCardioSection)}
          className="w-full flex items-center justify-between px-4 py-3 glass border-l-2 border-accent/50 text-left"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="font-display tracking-wider text-accent text-sm">
              CARDIO {session.cardio && session.cardio.length > 0 ? `(${session.cardio.length})` : ''}
            </span>
          </div>
          {showCardioSection ? <ChevronUp className="w-4 h-4 text-accent" /> : <ChevronDown className="w-4 h-4 text-accent" />}
        </button>

        <AnimatePresence>
          {showCardioSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <InlineCardioForm
                cardioEntries={session.cardio || []}
                onAdd={(activity, distance, duration, notes, incline, speed) => addCardioEntry(activity, distance, duration, notes, incline, speed)}
                onRemove={(id) => removeCardioEntry(id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Intervals — timed conditioning blocks (Tabata, EMOM, battle ropes) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
        className="space-y-2"
      >
        {session.intervals && session.intervals.length > 0 && (
          <div className="space-y-2">
            {session.intervals.map((iv) => (
              <div
                key={iv.id}
                className="pump-card pump-card--superset p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-[color:var(--pump-purple)]/14 flex items-center justify-center text-[color:var(--pump-purple)]">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm tracking-wider truncate">
                    {iv.name.toUpperCase()}
                  </p>
                  <p className="text-[10px] font-mono tracking-wider text-[color:var(--pump-text-dim)]">
                    {iv.sequence.blocks.map(b => `[${b.steps.map(s => s.duration + 's').join(' / ')}] × ${b.rounds}`).join(' + ')}
                    {' · '}
                    {Math.floor(iv.totalDuration / 60)}:{String(iv.totalDuration % 60).padStart(2, '0')}
                  </p>
                </div>
                <Check className="w-4 h-4 text-[color:var(--pump-purple)] shrink-0" />
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowIntervalFlow(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 glass border-l-2 border-[color:var(--pump-purple)]/50"
        >
          <Zap className="w-4 h-4 text-[color:var(--pump-purple)]" />
          <span className="font-display tracking-wider text-[color:var(--pump-purple)] text-sm">
            ADD INTERVAL
          </span>
        </button>
      </motion.div>

      {/* Session Stats */}
      {stats && 'totalVolume' in stats && (
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3 text-center">
            SESSION STATS
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-4xl tabular-nums" style={{ color: 'var(--pump-text)' }}>
                {stats.exerciseCount}
              </p>
              <p className="text-[10px] tracking-[0.18em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>Exercises</p>
            </div>
            <div>
              <p className="font-display text-4xl tabular-nums" style={{ color: 'var(--pump-text)' }}>
                {stats.totalSets}
              </p>
              <p className="text-[10px] tracking-[0.18em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>Sets</p>
            </div>
            <div>
              <p className="font-display text-4xl tabular-nums" style={{ color: 'var(--pump-hot)' }}>
                {(stats.totalVolume as number).toLocaleString()}
              </p>
              <p className="text-[10px] tracking-[0.18em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>lbs</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Complete Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={handleComplete}
          className="w-full h-16 font-display text-xl tracking-widest relative overflow-hidden group touch-target"
          size="lg"
          disabled={!session.exercises?.length && !session.cardio?.length}
        >
          <span className="relative z-10">COMPLETE WORKOUT</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 glow-neon opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </motion.div>

      {/* Interval builder + runner. Mounts when opened; state resets on each open. */}
      <IntervalFlow
        open={showIntervalFlow}
        onClose={() => setShowIntervalFlow(false)}
        onComplete={(completed) => {
          logInterval(completed);
          setShowIntervalFlow(false);
        }}
      />

      {/* Reorder exercises + auto-unlink supersets moved apart (§4b) */}
      <ReorderExercisesSheet
        open={showReorder}
        onOpenChange={setShowReorder}
        exercises={session.exercises ?? []}
        onReorder={reorderExercises}
      />
    </div>
  );
}

// Individual Exercise Card
interface ExerciseCardProps {
  exercise: GymExercise;
  planExercise?: import('@/lib/types').PlanExercise;
  onAddSet: (set: GymSet) => void;
  onUpdateSet: (index: number, updates: Partial<GymSet>) => void;
  onRemoveSet: (index: number) => void;
  onRemoveExercise: () => void;
  onDuplicateLastSet: () => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateWeightType: (type: 'total' | 'per_side') => void;
  isLinking?: boolean;
  onToggleLink?: () => void;
  onUnlink?: () => void;
}

function ExerciseCard({
  exercise,
  planExercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onRemoveExercise,
  onDuplicateLastSet,
  onUpdateNotes,
  onUpdateWeightType,
  isLinking,
  onToggleLink,
  onUnlink,
}: ExerciseCardProps) {
  const [newWeight, setNewWeight] = useState(
    planExercise?.targetWeight ? String(planExercise.targetWeight) : ''
  );
  const [newReps, setNewReps] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [isBodyweight, setIsBodyweight] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [weightType, setWeightType] = useState<'total' | 'per_side'>(exercise.weightType ?? 'total');

  // Get history and PR for this exercise
  const history = getExerciseHistory(exercise.name, 3);
  const pr = getPRForExercise(exercise.name);

  const handleAddSet = () => {
    const weight = isBodyweight ? 0 : parseFloat(newWeight);
    const reps = parseInt(newReps);

    if (reps > 0 && (isBodyweight || weight >= 0)) {
      const loggedSet: GymSet = { weight: isBodyweight ? 0 : weight, reps, isWarmup, isBodyweight };

      // Replace first planned slot if one exists
      const firstPlannedIdx = exercise.sets.findIndex(s => s.isPlanned);
      if (firstPlannedIdx >= 0) {
        onUpdateSet(firstPlannedIdx, { ...loggedSet, isPlanned: false });
      } else {
        onAddSet(loggedSet);
      }
      setNewReps('');
      setIsWarmup(false);
      playSetCompleteFeedback();
    }
  };

  const isSuperset = Boolean(exercise.supersetGroupId);

  return (
    <motion.div
      className={`pump-card ${isSuperset ? 'pump-card--superset' : 'pump-card--active'} overflow-hidden p-0`}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[color:var(--pump-border-card)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl text-[color:var(--pump-text)]">
              {exercise.name.toUpperCase()}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {planExercise && (
                <span className="tag tag--target">
                  {planExercise.sets}×{planExercise.targetReps}
                  {planExercise.isBodyweight ? ' BW' : planExercise.targetWeight ? ` @ ${planExercise.targetWeight}` : ''}
                </span>
              )}
              {pr && (
                <span className="tag tag--pr">
                  Best {pr.weight}×{pr.reps}
                </span>
              )}
              {isSuperset && (
                <span className="tag tag--superset">
                  SUPERSET
                </span>
              )}
              {!isBodyweight && (
                <button
                  onClick={() => {
                    const next = weightType === 'total' ? 'per_side' : 'total';
                    setWeightType(next);
                    onUpdateWeightType(next);
                  }}
                  className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 border border-muted-foreground/20 hover:border-primary/40"
                >
                  {weightType === 'total' ? 'TOTAL' : 'EA SIDE'}
                </button>
              )}
            </div>
            {planExercise?.notes && (
              <p className="text-xs text-muted-foreground/70 italic mt-1">{planExercise.notes}</p>
            )}
          </div>
          <div className="flex gap-1">
            {/* Notes toggle — surfaced in the header so leaving a note is
                a single visible tap instead of buried at the bottom of the
                card (trainer C5). Icon fills in primary when a note exists
                so at-a-glance it's obvious which exercises have context. */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className={`${exercise.notes?.trim() ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
              aria-label={exercise.notes?.trim() ? 'Edit exercise notes' : 'Add exercise notes'}
              aria-expanded={showNotes}
              title={exercise.notes?.trim() ? 'Edit notes' : 'Add notes'}
            >
              <FileText className="w-4 h-4" />
              {exercise.notes?.trim() && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-muted-foreground hover:text-primary font-display tracking-wider"
            >
              {showHistory ? 'HIDE' : 'HIST'}
            </Button>
            {exercise.supersetGroupId && onUnlink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnlink}
                className="text-primary/60 hover:text-primary font-display tracking-wider text-xs"
                title="Remove from superset"
              >
                ⚡
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveExercise}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* History Preview */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-secondary/30 space-y-2">
                <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  PREVIOUS SESSIONS
                </p>
                {history.map((entry, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {parseSessionDate(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-mono text-primary">
                      {entry.sets.filter(s => !s.isWarmup).map((s, j) => (
                        <span key={j} className="ml-2">{s.weight}×{s.reps}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sets Table */}
        {exercise.sets.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs tracking-[0.1em] text-muted-foreground px-2">
              <span>SET</span>
              <span>WEIGHT</span>
              <span>REPS</span>
              <span></span>
            </div>
            {exercise.sets.map((set, index) => {
              const setNumber = index + 1 - exercise.sets.filter((s, i) => i < index && s.isWarmup).length;

              if (set.isPlanned) {
                // Planned placeholder — tap to pre-fill the add-set form
                return (
                  <motion.div
                    key={index}
                    className="grid grid-cols-4 gap-2 items-center p-2 rounded-xl bg-secondary/10 border border-dashed border-white/10 cursor-pointer hover:border-primary/30 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (!set.isBodyweight) setNewWeight(set.weight > 0 ? String(set.weight) : '');
                      setIsBodyweight(set.isBodyweight ?? false);
                    }}
                  >
                    <span className="font-display text-lg text-muted-foreground/50">{setNumber}</span>
                    <span className="text-center font-mono text-sm text-muted-foreground/50">
                      {set.isBodyweight ? 'BW' : set.weight > 0 ? `${set.weight}` : '—'}
                    </span>
                    <span className="text-center font-mono text-sm text-muted-foreground/50">—</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onRemoveSet(index); }}
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-10"
                      aria-label="Remove planned set"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              }

              // Normal logged set row
              return (
                <motion.div
                  key={index}
                  className={`grid grid-cols-4 gap-2 items-center p-2 rounded-xl ${
                    set.isWarmup ? 'bg-secondary/20' : 'bg-secondary/40'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className={`font-display text-lg ${set.isWarmup ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {set.isWarmup ? 'W' : setNumber}
                  </span>
                  {set.isBodyweight ? (
                    <span className="h-10 flex items-center justify-center font-mono text-primary text-sm">BW</span>
                  ) : (
                    <div>
                      <Input
                        type="number"
                        value={set.weight}
                        onChange={(e) => onUpdateSet(index, { weight: parseFloat(e.target.value) || 0 })}
                        onFocus={(e) => e.target.select()}
                        className="h-10 text-center font-mono bg-background/50"
                      />
                      {weightType === 'per_side' && <span className="text-[10px] text-muted-foreground text-center block">ea.</span>}
                    </div>
                  )}
                  <Input
                    type="number"
                    value={set.reps}
                    onChange={(e) => onUpdateSet(index, { reps: parseInt(e.target.value) || 0 })}
                    onFocus={(e) => e.target.select()}
                    className="h-10 text-center font-mono bg-background/50"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveSet(index)}
                    className="text-destructive hover:bg-destructive/10 h-10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Set Form */}
        <div className="grid grid-cols-4 gap-2 items-end">
          {isBodyweight ? (
            <div className="flex items-end">
              <span className="h-[52px] flex items-center justify-center font-mono text-primary text-lg w-full bg-secondary/30 border border-border">BW</span>
            </div>
          ) : (
            <div>
              <label className="text-xs tracking-[0.1em] text-muted-foreground uppercase block mb-1">
                Weight
              </label>
              <Input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="lbs"
                className="touch-target text-center font-mono"
              />
              <span className="text-xs text-muted-foreground block text-center mt-0.5">
                {weightType === 'per_side' ? 'lbs ea.' : 'lbs'}
              </span>
            </div>
          )}
          <div>
            <label className="text-xs tracking-[0.1em] text-muted-foreground uppercase block mb-1">
              Reps
            </label>
            <Input
              type="number"
              value={newReps}
              onChange={(e) => setNewReps(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="#"
              className="touch-target text-center font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSet()}
            />
          </div>
          <Button
            onClick={handleAddSet}
            className="touch-target font-display tracking-wider"
            disabled={(!isBodyweight && !newWeight) || !newReps}
          >
            ADD
          </Button>
          {exercise.sets.length > 0 && (
            <Button
              variant="outline"
              onClick={onDuplicateLastSet}
              className="touch-target font-display tracking-wider hover:border-primary/50"
              title="Duplicate last set"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Bodyweight + Warmup Toggles */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
              isBodyweight ? 'bg-primary border-primary' : 'border-muted-foreground group-hover:border-primary/50'
            }`}>
              {isBodyweight && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            <input
              type="checkbox"
              checked={isBodyweight}
              onChange={(e) => { setIsBodyweight(e.target.checked); if (e.target.checked) setNewWeight(''); }}
              className="sr-only"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Bodyweight
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
              isWarmup ? 'bg-primary border-primary' : 'border-muted-foreground group-hover:border-primary/50'
            }`}>
              {isWarmup && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            <input
              type="checkbox"
              checked={isWarmup}
              onChange={(e) => setIsWarmup(e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Warmup
            </span>
          </label>
        </div>

        {/* Rest Timer */}
        <RestTimerInline defaultDuration={90} />

        {/* Notes — expansion is toggled by the notes icon in the card
            header (set next to HIST/remove). The standalone ADD NOTES
            button at the bottom was retired because the header toggle is
            more discoverable and always in the same spot across cards. */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Textarea
                value={exercise.notes || ''}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Crowded rack? Form off? Anything the trainer should know…"
                className="min-h-[80px] bg-background/50"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Inline Cardio Form for gym sessions
const CARDIO_ACTIVITY_OPTIONS: { value: CardioActivity; label: string; icon: React.ElementType }[] = [
  { value: 'run', label: 'RUN', icon: Activity },
  { value: 'bike', label: 'BIKE', icon: Bike },
  { value: 'swim', label: 'SWIM', icon: Waves },
  { value: 'row', label: 'ROW', icon: Ship },
  { value: 'elliptical', label: 'ELLIP', icon: Footprints },
  { value: 'walk', label: 'WALK', icon: Footprints },
];

interface InlineCardioFormProps {
  cardioEntries: CardioEntry[];
  onAdd: (activity: CardioActivity, distance: number | undefined, duration: number | undefined, notes?: string, incline?: number, speed?: number) => void;
  onRemove: (id: string) => void;
}

function InlineCardioForm({ cardioEntries, onAdd, onRemove }: InlineCardioFormProps) {
  const [selectedActivity, setSelectedActivity] = useState<CardioActivity>('run');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [incline, setIncline] = useState('');
  const [showForm, setShowForm] = useState(cardioEntries.length === 0);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    const totalSecs = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    if (totalSecs > 0) {
      const distOrUndef = parseFloat(distance) > 0 ? parseFloat(distance) : undefined;
      const inclOrUndef = parseFloat(incline) > 0 ? parseFloat(incline) : undefined;
      onAdd(selectedActivity, distOrUndef, totalSecs, undefined, inclOrUndef);
      setDistance('');
      setMinutes('');
      setSeconds('');
      setIncline('');
      setShowForm(false);
    }
  };

  return (
    <div className="glass border-t-0 p-4 space-y-3">
      {/* Existing entries */}
      {cardioEntries.map((entry) => {
        const info = CARDIO_ACTIVITY_OPTIONS.find(a => a.value === entry.activity);
        const Icon = info?.icon || Activity;
        const showPace = entry.distance != null && entry.duration != null;
        const paceMin = showPace ? Math.floor(entry.duration! / entry.distance! / 60) : 0;
        const paceSec = showPace ? Math.round((entry.duration! / entry.distance!) % 60) : 0;
        return (
          <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-accent/20">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-accent" />
              <div>
                <span className="font-display tracking-wider text-sm text-accent">{entry.activity.toUpperCase()}</span>
                <div className="text-xs text-muted-foreground font-mono">
                  {entry.duration != null && formatTime(entry.duration)}
                  {entry.distance != null && ` · ${entry.distance}mi`}
                  {showPace && ` · ${paceMin}:${paceSec.toString().padStart(2,'0')}/mi`}
                  {entry.incline != null && ` · ${entry.incline}% incline`}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(entry.id)} className="text-destructive hover:bg-destructive/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      })}

      {/* Add form */}
      {showForm ? (
        <div className="space-y-3">
          {/* Activity picker */}
          <div className="grid grid-cols-3 gap-2">
            {CARDIO_ACTIVITY_OPTIONS.slice(0, 6).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedActivity(opt.value)}
                  className={`p-2 text-center border-2 transition-all ${selectedActivity === opt.value ? 'border-accent/50 bg-accent/20 text-accent' : 'border-transparent bg-secondary/30 text-muted-foreground'}`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="font-display text-xs tracking-wider">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Min</label>
              <Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="0" className="touch-target text-center font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Sec</label>
              <Input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="0" className="touch-target text-center font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Miles (opt)</label>
              <Input type="number" step="0.01" value={distance} onChange={e => setDistance(e.target.value)} placeholder="0.0" className="touch-target text-center font-mono" />
            </div>
          </div>
          {selectedActivity === 'walk' && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Incline % (opt)</label>
              <Input type="number" step="0.5" value={incline} onChange={e => setIncline(e.target.value)} placeholder="0" className="touch-target text-center font-mono" />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!(parseInt(minutes) || parseInt(seconds))} className="flex-1 font-display tracking-wider">
              LOG CARDIO
            </Button>
            {cardioEntries.length > 0 && (
              <Button variant="outline" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)} variant="outline" className="w-full font-display tracking-wider border-dashed border-2 hover:border-accent/50 hover:bg-accent/5">
          <Plus className="w-4 h-4 mr-2" />
          ADD CARDIO ENTRY
        </Button>
      )}
    </div>
  );
}

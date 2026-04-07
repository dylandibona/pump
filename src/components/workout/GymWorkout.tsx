'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Plus, Copy, FileText, Check, Activity, Bike, Waves, Ship, Footprints, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
import { RestTimerInline } from './Timer';
import { useWorkout } from '@/hooks/useWorkout';
import { GymExercise, GymSet, CardioActivity, CardioEntry } from '@/lib/types';
import { getExerciseHistory, getPRForExercise } from '@/lib/storage';
import { playSetCompleteFeedback, playPRFeedback } from '@/lib/sounds';

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
    addSet,
    updateSet,
    removeSet,
    removeExercise,
    updateExerciseNotes,
    duplicateLastSet,
    addCardioEntry,
    removeCardioEntry,
    linkSuperset,
    unlinkSuperset,
    completeSession,
    getSessionStats,
    clearNewPRs,
  } = useWorkout({ sessionId });

  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(!planSession);
  const [showCardioSection, setShowCardioSection] = useState(false);
  const [linkingExerciseId, setLinkingExerciseId] = useState<string | null>(null);
  const planLoadedRef = useRef(false);
  const prevPRCountRef = useRef(newPRs.length);

  // Pre-load plan session exercises once when session is ready
  useEffect(() => {
    if (!planSession || !session || planLoadedRef.current || session.exercises?.length) return;
    planLoadedRef.current = true;
    planSession.exercises.forEach((planEx, i) => {
      setTimeout(() => {
        addExercise(planEx.name);
      }, i * 20);
    });
  }, [planSession, session, addExercise]);

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
                  <p className="font-display text-2xl tracking-wider text-accent text-glow-hot">
                    NEW PR!
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
                onAdd={(activity, distance, duration, notes) => addCardioEntry(activity, distance, duration, notes)}
                onRemove={(id) => removeCardioEntry(id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
              <p className="font-display text-4xl text-primary text-glow-neon">
                {stats.exerciseCount}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Exercises</p>
            </div>
            <div>
              <p className="font-display text-4xl text-primary text-glow-neon">
                {stats.totalSets}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sets</p>
            </div>
            <div>
              <p className="font-display text-4xl text-primary text-glow-neon">
                {(stats.totalVolume as number).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">lbs</p>
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

  // Get history and PR for this exercise
  const history = getExerciseHistory(exercise.name, 3);
  const pr = getPRForExercise(exercise.name);

  const handleAddSet = () => {
    const weight = isBodyweight ? 0 : parseFloat(newWeight);
    const reps = parseInt(newReps);

    if (reps > 0 && (isBodyweight || weight >= 0)) {
      onAddSet({ weight: isBodyweight ? 0 : weight, reps, isWarmup, isBodyweight });
      setNewReps('');
      setIsWarmup(false);
      playSetCompleteFeedback();
    }
  };

  return (
    <motion.div
      className="glass rounded-2xl overflow-hidden"
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl tracking-wider text-foreground">
              {exercise.name.toUpperCase()}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {planExercise && (
                <Badge className="bg-secondary/60 text-muted-foreground border-0 font-mono text-xs">
                  TARGET: {planExercise.sets}×{planExercise.targetReps}
                  {planExercise.isBodyweight ? ' BW' : planExercise.targetWeight ? ` @ ${planExercise.targetWeight}lbs` : ''}
                </Badge>
              )}
              {pr && (
                <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                  PR: {pr.weight} × {pr.reps}
                </Badge>
              )}
            </div>
            {planExercise?.notes && (
              <p className="text-xs text-muted-foreground/70 italic mt-1">{planExercise.notes}</p>
            )}
          </div>
          <div className="flex gap-1">
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
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    <Input
                      type="number"
                      value={set.weight}
                      onChange={(e) => onUpdateSet(index, { weight: parseFloat(e.target.value) || 0 })}
                      className="h-10 text-center font-mono bg-background/50"
                    />
                  )}
                  <Input
                    type="number"
                    value={set.reps}
                    onChange={(e) => onUpdateSet(index, { reps: parseInt(e.target.value) || 0 })}
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
                placeholder="lbs"
                className="touch-target text-center font-mono"
              />
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

        {/* Notes */}
        <AnimatePresence>
          {showNotes ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Textarea
                value={exercise.notes || ''}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Add notes about form, feeling, etc..."
                className="min-h-[80px] bg-background/50"
              />
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setShowNotes(true)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              whileHover={{ x: 4 }}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-display tracking-wider">ADD NOTES</span>
            </motion.button>
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
  onAdd: (activity: CardioActivity, distance: number, duration: number, notes?: string) => void;
  onRemove: (id: string) => void;
}

function InlineCardioForm({ cardioEntries, onAdd, onRemove }: InlineCardioFormProps) {
  const [selectedActivity, setSelectedActivity] = useState<CardioActivity>('run');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [showForm, setShowForm] = useState(cardioEntries.length === 0);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAdd = () => {
    const dist = parseFloat(distance);
    const totalSecs = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    if (dist > 0 && totalSecs > 0) {
      onAdd(selectedActivity, dist, totalSecs);
      setDistance('');
      setMinutes('');
      setSeconds('');
      setShowForm(false);
    }
  };

  return (
    <div className="glass border-t-0 p-4 space-y-3">
      {/* Existing entries */}
      {cardioEntries.map((entry) => {
        const info = CARDIO_ACTIVITY_OPTIONS.find(a => a.value === entry.activity);
        const Icon = info?.icon || Activity;
        const paceMin = Math.floor(entry.duration / entry.distance / 60);
        const paceSec = Math.round((entry.duration / entry.distance) % 60);
        return (
          <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-accent/20">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-accent" />
              <div>
                <span className="font-display tracking-wider text-sm text-accent">{entry.activity.toUpperCase()}</span>
                <div className="text-xs text-muted-foreground font-mono">
                  {entry.distance}mi · {formatTime(entry.duration)} · {paceMin}:{paceSec.toString().padStart(2,'0')}/mi
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
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Miles</label>
              <Input type="number" step="0.01" value={distance} onChange={e => setDistance(e.target.value)} placeholder="0.0" className="touch-target text-center font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Min</label>
              <Input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="0" className="touch-target text-center font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Sec</label>
              <Input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} placeholder="0" className="touch-target text-center font-mono" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!distance || !(parseInt(minutes) || parseInt(seconds))} className="flex-1 font-display tracking-wider">
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

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Plus, Copy, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
import { RestTimerInline } from './Timer';
import { useWorkout } from '@/hooks/useWorkout';
import { GymExercise, GymSet } from '@/lib/types';
import { getExerciseHistory, getPRForExercise } from '@/lib/storage';
import { playSetCompleteFeedback, playPRFeedback } from '@/lib/sounds';

interface GymWorkoutProps {
  sessionId?: string;
  onComplete?: () => void;
}

export function GymWorkout({ sessionId, onComplete }: GymWorkoutProps) {
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
    completeSession,
    getSessionStats,
    clearNewPRs,
  } = useWorkout({ sessionId });

  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(true);
  const prevPRCountRef = useRef(newPRs.length);

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
      {session.exercises?.map((exercise, index) => (
        <motion.div
          key={exercise.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ExerciseCard
            exercise={exercise}
            onAddSet={(set) => addSet(exercise.id, set)}
            onUpdateSet={(idx, updates) => updateSet(exercise.id, idx, updates)}
            onRemoveSet={(idx) => removeSet(exercise.id, idx)}
            onRemoveExercise={() => removeExercise(exercise.id)}
            onDuplicateLastSet={() => duplicateLastSet(exercise.id)}
            onUpdateNotes={(notes) => updateExerciseNotes(exercise.id, notes)}
          />
        </motion.div>
      ))}

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
          disabled={!session.exercises?.length}
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
  onAddSet: (set: GymSet) => void;
  onUpdateSet: (index: number, updates: Partial<GymSet>) => void;
  onRemoveSet: (index: number) => void;
  onRemoveExercise: () => void;
  onDuplicateLastSet: () => void;
  onUpdateNotes: (notes: string) => void;
}

function ExerciseCard({
  exercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onRemoveExercise,
  onDuplicateLastSet,
  onUpdateNotes,
}: ExerciseCardProps) {
  const [newWeight, setNewWeight] = useState('');
  const [newReps, setNewReps] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Get history and PR for this exercise
  const history = getExerciseHistory(exercise.name, 3);
  const pr = getPRForExercise(exercise.name);

  const handleAddSet = () => {
    const weight = parseFloat(newWeight);
    const reps = parseInt(newReps);

    if (weight > 0 && reps > 0) {
      onAddSet({ weight, reps, isWarmup });
      setNewReps('');
      setIsWarmup(false);
      // Play sound feedback for set completion
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
            {pr && (
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
                  PR: {pr.weight} × {pr.reps}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-muted-foreground hover:text-primary font-display tracking-wider"
            >
              {showHistory ? 'HIDE' : 'HISTORY'}
            </Button>
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
                  <Input
                    type="number"
                    value={set.weight}
                    onChange={(e) => onUpdateSet(index, { weight: parseFloat(e.target.value) || 0 })}
                    className="h-10 text-center font-mono bg-background/50"
                  />
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
            disabled={!newWeight || !newReps}
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

        {/* Warmup Toggle */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
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
            Warmup set (won&apos;t count toward volume/PRs)
          </span>
        </label>

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

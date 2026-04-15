'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Pencil, Check, X, Link2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrainerPlan, PlanSession, PlanExercise } from '@/lib/types';

interface SessionPreviewProps {
  plan: TrainerPlan;
  planSession: PlanSession;
  onStart: (adjusted: PlanSession) => void;
  onCancel: () => void;
}

// Rough session-time estimate: 3 min per set + 30s per rep target midpoint.
// Good enough for an "~N min" hint on the preview header.
function estimateDuration(exercises: PlanExercise[]): number {
  let seconds = 0;
  for (const ex of exercises) {
    const reps = midpointReps(ex.targetReps);
    // 3s/rep under load + 60s rest per set
    const perSet = reps * 3 + 60;
    seconds += ex.sets * perSet;
  }
  return Math.round(seconds / 60);
}

function midpointReps(target: string): number {
  const m = target.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return Math.round((parseInt(m[1], 10) + parseInt(m[2], 10)) / 2);
  const n = parseInt(target, 10);
  return Number.isFinite(n) ? n : 10;
}

export function SessionPreview({ plan, planSession, onStart, onCancel }: SessionPreviewProps) {
  const [adjusted, setAdjusted] = useState<PlanExercise[]>(() =>
    planSession.exercises.map(ex => ({ ...ex }))
  );
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const duration = useMemo(() => estimateDuration(adjusted), [adjusted]);

  // Group consecutive supersetted exercises for visual pairing
  const supersetPartners = useMemo(() => {
    const byName = new Map(adjusted.map((ex, i) => [ex.name.toLowerCase(), i]));
    return adjusted.map(ex => {
      if (!ex.supersetWith) return null;
      const idx = byName.get(ex.supersetWith.toLowerCase());
      return idx != null ? adjusted[idx].name : ex.supersetWith;
    });
  }, [adjusted]);

  const updateExercise = (idx: number, patch: Partial<PlanExercise>) => {
    setAdjusted(prev => prev.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));
  };

  const toggleNote = (idx: number) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleStart = () => {
    onStart({ ...planSession, exercises: adjusted });
  };

  return (
    <div className="space-y-5 pb-32">
      {/* Header */}
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[color:var(--pump-cyan-deep)]">
          PREVIEW · {plan.name.toUpperCase()}
          {plan.blockType ? ` · ${plan.blockType.toUpperCase()}` : ''}
        </p>
        <h1
          className="text-4xl text-[color:var(--pump-hot)] text-glow-hot"
          style={{ fontFamily: 'var(--font-pacifico), cursive' }}
        >
          {planSession.name}
        </h1>
        <p className="font-mono text-xs text-muted-foreground tracking-wider">
          {adjusted.length} {adjusted.length === 1 ? 'EXERCISE' : 'EXERCISES'} · ~{duration} MIN
        </p>
      </motion.div>

      {/* Exercises */}
      <div className="space-y-3">
        {adjusted.map((ex, i) => {
          const isEditing = editingIdx === i;
          const partner = supersetPartners[i];
          const noteOpen = expandedNotes.has(i);
          const weightDisplay = ex.isBodyweight
            ? 'BW'
            : ex.targetWeight && ex.targetWeight > 0
              ? `${ex.targetWeight} lbs`
              : '—';

          const cardClass = partner
            ? 'pump-card pump-card--superset'
            : 'pump-card pump-card--preview';
          return (
            <motion.div
              key={`${ex.name}-${i}`}
              className={`${cardClass} p-4`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground font-mono text-sm">{i + 1}.</span>
                    <span className="font-display text-lg tracking-wider">
                      {ex.name.toUpperCase()}
                    </span>
                    {partner && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-display tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                        <Link2 className="w-3 h-3" />
                        w/ {partner}
                      </span>
                    )}
                  </div>

                  {!isEditing ? (
                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                      {ex.sets} sets · {ex.targetReps} reps · {weightDisplay}
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Reps</span>
                        <Input
                          value={ex.targetReps}
                          onChange={(e) => updateExercise(i, { targetReps: e.target.value })}
                          placeholder="10-12"
                          className="h-9 font-mono text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                          Weight (lbs)
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          disabled={ex.isBodyweight}
                          value={ex.isBodyweight ? '' : (ex.targetWeight ?? '')}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateExercise(i, { targetWeight: v === '' ? undefined : Number(v) });
                          }}
                          placeholder={ex.isBodyweight ? 'BW' : '95'}
                          className="h-9 font-mono text-sm"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setEditingIdx(isEditing ? null : i)}
                  className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={isEditing ? 'Done editing' : 'Edit target'}
                >
                  {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>

              {ex.notes && (
                <div className="mt-2">
                  <button
                    onClick={() => toggleNote(i)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <StickyNote className="w-3 h-3" />
                    {noteOpen ? 'Hide notes' : 'Coach notes'}
                  </button>
                  {noteOpen && (
                    <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-3">
                      {ex.notes}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Fixed bottom action bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 bg-background/90 backdrop-blur border-t border-white/10"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-14 px-4 font-display tracking-wider"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleStart}
            className="flex-1 h-14 text-2xl tracking-wide text-white border-0 shadow-[0_0_24px_rgba(255,0,128,0.35),0_0_60px_rgba(255,0,128,0.12)]"
            style={{
              background: 'var(--pump-grad-hot)',
              fontFamily: 'var(--font-pacifico), cursive',
            }}
          >
            Let&rsquo;s Go
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

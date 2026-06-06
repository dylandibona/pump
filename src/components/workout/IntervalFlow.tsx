'use client';

// Interval builder + runner for timed conditioning sequences.
//
// A sequence is an ordered list of blocks. Each block is a step sequence
// repeated N rounds. Runner flattens blocks × rounds × steps into a
// linear timeline and counts each step down via wall-clock math (accurate
// across iOS tab throttles). Transitions fire a short chime + vibration.
//
// Presets cover the common programming patterns:
//   - Tabata       = 1 block, [work 20s, rest 10s] × 8 rounds
//   - EMOM 10      = 1 block, [work 60s] × 10 rounds
//   - 45/30 × 3    = 1 block, [work 45s, rest 30s] × 3 rounds
//   - Custom       = a sensible default the user edits
//
// Compound programs (warmup + Tabata + cooldown) are supported via the
// "Add Block" button at the bottom of the builder.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, X, Plus, Trash2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IntervalBlock, IntervalSequence, IntervalStep, CompletedInterval } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { playSetCompleteFeedback, playPRFeedback, vibrate } from '@/lib/sounds';

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function newStep(label: string, duration: number): IntervalStep {
  return { id: generateId(), label, duration };
}

function newBlock(steps: IntervalStep[], rounds: number): IntervalBlock {
  return { id: generateId(), steps, rounds };
}

const PRESETS: { key: string; name: string; build: () => IntervalSequence }[] = [
  {
    key: 'tabata',
    name: 'Tabata',
    build: () => ({
      name: 'Tabata',
      blocks: [newBlock([newStep('Work', 20), newStep('Rest', 10)], 8)],
    }),
  },
  {
    key: 'emom10',
    name: 'EMOM 10',
    build: () => ({
      name: 'EMOM 10',
      blocks: [newBlock([newStep('Work', 60)], 10)],
    }),
  },
  {
    key: '45-30',
    name: '45/30 × 3',
    build: () => ({
      name: '45 / 30 × 3',
      blocks: [newBlock([newStep('Work', 45), newStep('Rest', 30)], 3)],
    }),
  },
  {
    key: 'custom',
    name: 'Custom',
    build: () => ({
      name: 'Intervals',
      blocks: [newBlock([newStep('Work', 30), newStep('Rest', 30)], 3)],
    }),
  },
];

// Sum the programmed duration.
function totalSeconds(seq: IntervalSequence): number {
  return seq.blocks.reduce((sum, b) => {
    const blockSum = b.steps.reduce((s, st) => s + Math.max(0, st.duration), 0);
    return sum + blockSum * Math.max(0, b.rounds);
  }, 0);
}

// Flatten into a linear list of steps annotated with round and block
// context so the runner can show useful progress text.
interface FlatStep {
  label: string;
  duration: number;
  blockIndex: number;
  blockCount: number;
  round: number;
  rounds: number;
  stepIndex: number;
  stepCount: number;
}

function flatten(seq: IntervalSequence): FlatStep[] {
  const out: FlatStep[] = [];
  seq.blocks.forEach((block, bi) => {
    for (let round = 1; round <= block.rounds; round++) {
      block.steps.forEach((step, si) => {
        if (step.duration <= 0) return;
        out.push({
          label: step.label,
          duration: step.duration,
          blockIndex: bi,
          blockCount: seq.blocks.length,
          round,
          rounds: block.rounds,
          stepIndex: si,
          stepCount: block.steps.length,
        });
      });
    }
  });
  return out;
}

interface IntervalFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: (interval: CompletedInterval) => void;
}

type Mode = 'build' | 'run';

export function IntervalFlow({ open, onClose, onComplete }: IntervalFlowProps) {
  const [mode, setMode] = useState<Mode>('build');
  const [sequence, setSequence] = useState<IntervalSequence>(() => PRESETS[3].build()); // Custom default

  // Reset to builder each time the sheet opens fresh.
  useEffect(() => {
    if (open) {
      setMode('build');
      setSequence(PRESETS[3].build());
    }
  }, [open]);

  const handleStart = () => {
    if (flatten(sequence).length === 0) return;
    setMode('run');
  };

  const handleRunComplete = (totalDuration: number) => {
    const completed: CompletedInterval = {
      id: generateId(),
      name: sequence.name?.trim() || 'Intervals',
      sequence,
      totalDuration,
      completedAt: new Date().toISOString(),
    };
    onComplete(completed);
    onClose();
  };

  const handleRunCancel = () => {
    // Cancelled before finish — don't log a partial interval.
    onClose();
  };

  return (
    <>
      <Sheet open={open && mode === 'build'} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl tracking-wider">
              BUILD INTERVAL
            </SheetTitle>
          </SheetHeader>

          <IntervalBuilder
            sequence={sequence}
            onChange={setSequence}
          />

          <div className="sticky bottom-0 left-0 right-0 pt-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] bg-[color:var(--pump-bg-card)]/95 backdrop-blur-md border-t border-[color:var(--pump-border-card)] -mx-6 px-6 mt-4 flex gap-2">
            <Button variant="outline" onClick={onClose} className="font-display tracking-wider">
              CANCEL
            </Button>
            <Button
              onClick={handleStart}
              disabled={flatten(sequence).length === 0}
              className="flex-1 h-12 text-white border-0 font-display tracking-widest"
              style={{ background: 'var(--pump-grad-hot)' }}
            >
              <Play className="w-4 h-4 mr-2" />
              START · {fmt(totalSeconds(sequence))}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {open && mode === 'run' && (
          <IntervalRunner
            sequence={sequence}
            onFinish={handleRunComplete}
            onCancel={handleRunCancel}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// =========== Builder ===========

function IntervalBuilder({
  sequence,
  onChange,
}: {
  sequence: IntervalSequence;
  onChange: (next: IntervalSequence) => void;
}) {
  const total = totalSeconds(sequence);

  const applyPreset = (key: string) => {
    const preset = PRESETS.find(p => p.key === key);
    if (preset) onChange(preset.build());
  };

  const setName = (name: string) => onChange({ ...sequence, name });

  const updateBlock = (index: number, patch: Partial<IntervalBlock>) => {
    onChange({
      ...sequence,
      blocks: sequence.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    });
  };

  const addBlock = () => {
    onChange({
      ...sequence,
      blocks: [
        ...sequence.blocks,
        newBlock([newStep('Work', 30), newStep('Rest', 30)], 3),
      ],
    });
  };

  const removeBlock = (index: number) => {
    onChange({
      ...sequence,
      blocks: sequence.blocks.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4 py-4">
      {/* Presets */}
      <div>
        <p className="text-[10px] tabular-nums tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)] mb-2">
          Start from preset
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="px-3 py-1.5 rounded-full text-xs tabular-nums font-bold bg-[color:var(--pump-bg-input)] text-[color:var(--pump-text-mid)] hover:bg-[color:var(--pump-hot)]/10 hover:text-[color:var(--pump-hot)] transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <label className="block">
        <span className="text-[10px] tabular-nums tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)]">
          Name
        </span>
        <Input
          value={sequence.name ?? ''}
          onChange={(e) => setName(e.target.value)}
          placeholder="Battle Ropes · Tabata · etc."
          className="mt-1"
        />
      </label>

      {/* Blocks */}
      {sequence.blocks.map((block, bi) => (
        <BlockEditor
          key={block.id}
          index={bi}
          block={block}
          canRemove={sequence.blocks.length > 1}
          onChange={(patch) => updateBlock(bi, patch)}
          onRemove={() => removeBlock(bi)}
        />
      ))}

      <button
        onClick={addBlock}
        className="w-full py-2 rounded-lg border-2 border-dashed border-[color:var(--pump-border-card)] text-[color:var(--pump-text-dim)] hover:border-[color:var(--pump-hot)]/30 hover:text-[color:var(--pump-hot)] transition-colors text-xs tabular-nums tracking-wider uppercase"
      >
        + Add Block (compound program)
      </button>

      {/* Total */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[color:var(--pump-bg-input)]">
        <span className="text-[10px] tabular-nums tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)]">
          Total
        </span>
        <span className="tabular-nums text-lg font-bold text-[color:var(--pump-hot)]">
          {fmt(total)}
        </span>
      </div>
    </div>
  );
}

function BlockEditor({
  index,
  block,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  block: IntervalBlock;
  canRemove: boolean;
  onChange: (patch: Partial<IntervalBlock>) => void;
  onRemove: () => void;
}) {
  const updateStep = (si: number, patch: Partial<IntervalStep>) => {
    onChange({
      steps: block.steps.map((s, i) => (i === si ? { ...s, ...patch } : s)),
    });
  };

  const addStep = () => {
    onChange({
      steps: [...block.steps, newStep(block.steps.length % 2 === 0 ? 'Work' : 'Rest', 30)],
    });
  };

  const removeStep = (si: number) => {
    if (block.steps.length <= 1) return;
    onChange({ steps: block.steps.filter((_, i) => i !== si) });
  };

  return (
    <div className="pump-card pump-card--preview p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm tracking-wider text-[color:var(--pump-cyan-deep)]">
          BLOCK {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-hot)] transition-colors"
            aria-label="Remove block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {block.steps.map((step, si) => (
          <div key={step.id} className="flex items-center gap-2">
            <Input
              value={step.label}
              onChange={(e) => updateStep(si, { label: e.target.value })}
              placeholder="Work"
              className="flex-1 h-9"
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={step.duration || ''}
              onChange={(e) => updateStep(si, { duration: Math.max(0, Number(e.target.value) || 0) })}
              placeholder="30"
              className="w-20 h-9 text-center tabular-nums"
              aria-label="Seconds"
            />
            <span className="text-xs tabular-nums text-[color:var(--pump-text-dim)] w-4">s</span>
            <button
              onClick={() => removeStep(si)}
              disabled={block.steps.length <= 1}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-hot)] transition-colors disabled:opacity-30 disabled:hover:text-[color:var(--pump-text-dim)]"
              aria-label="Remove step"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addStep}
          className="w-full py-1.5 rounded-md text-xs tabular-nums text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-hot)] hover:bg-[color:var(--pump-hot)]/5 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" /> Add step
        </button>
      </div>

      {/* Rounds */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] tabular-nums tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)]">
          Rounds
        </span>
        <button
          onClick={() => onChange({ rounds: Math.max(1, block.rounds - 1) })}
          className="w-8 h-8 rounded-md bg-[color:var(--pump-bg-input)] text-[color:var(--pump-text)] font-bold hover:bg-[color:var(--pump-hot)]/10 hover:text-[color:var(--pump-hot)] transition-colors"
          aria-label="Decrease rounds"
        >
          –
        </button>
        <span className="tabular-nums text-lg font-bold w-8 text-center tabular-nums">
          {block.rounds}
        </span>
        <button
          onClick={() => onChange({ rounds: block.rounds + 1 })}
          className="w-8 h-8 rounded-md bg-[color:var(--pump-bg-input)] text-[color:var(--pump-text)] font-bold hover:bg-[color:var(--pump-hot)]/10 hover:text-[color:var(--pump-hot)] transition-colors"
          aria-label="Increase rounds"
        >
          +
        </button>
      </div>
    </div>
  );
}

// =========== Runner ===========

function IntervalRunner({
  sequence,
  onFinish,
  onCancel,
}: {
  sequence: IntervalSequence;
  onFinish: (totalDuration: number) => void;
  onCancel: () => void;
}) {
  const flat = useMemo(() => flatten(sequence), [sequence]);
  const programmedTotal = useMemo(() => totalSeconds(sequence), [sequence]);

  const [stepIndex, setStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(flat[0]?.duration ?? 0);

  // Wall-clock anchored: when paused we freeze `remaining` and clear the
  // anchor; when running we store the moment this step started so
  // elapsed = (now - anchor) and remaining = duration - elapsed.
  const anchorRef = useRef<number | null>(Date.now());
  const currentStepRef = useRef(flat[0]);

  // Keep currentStepRef aligned with stepIndex.
  useEffect(() => {
    currentStepRef.current = flat[stepIndex];
  }, [stepIndex, flat]);

  // Advance helper — hops to next step (or finishes).
  const advance = useRef(() => {});
  advance.current = () => {
    const next = stepIndex + 1;
    if (next >= flat.length) {
      // Done.
      playPRFeedback();
      onFinish(programmedTotal);
      return;
    }
    setStepIndex(next);
    const dur = flat[next].duration;
    setRemaining(dur);
    anchorRef.current = Date.now();
    playSetCompleteFeedback();
  };

  // Tick.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const anchor = anchorRef.current;
      const step = currentStepRef.current;
      if (anchor == null || !step) return;
      const elapsed = (Date.now() - anchor) / 1000;
      const left = Math.max(0, step.duration - elapsed);
      setRemaining(left);
      if (left <= 0) advance.current();
    }, 100); // 10Hz for smooth countdown
    return () => window.clearInterval(id);
  }, [paused, stepIndex]);

  // Urgency haptic at 3-2-1.
  const urgencyRef = useRef<number>(-1);
  useEffect(() => {
    const whole = Math.ceil(remaining);
    if (whole !== urgencyRef.current && whole > 0 && whole <= 3) {
      urgencyRef.current = whole;
      vibrate(40);
    } else if (whole > 3) {
      urgencyRef.current = -1;
    }
  }, [remaining]);

  const togglePause = () => {
    if (paused) {
      // Resume — re-anchor so the elapsed math resumes from `remaining`.
      const step = currentStepRef.current;
      if (step) {
        anchorRef.current = Date.now() - (step.duration - remaining) * 1000;
      }
      setPaused(false);
    } else {
      setPaused(true);
      anchorRef.current = null;
    }
  };

  const skip = () => {
    advance.current();
  };

  const step = flat[stepIndex];
  if (!step) {
    // Empty — shouldn't reach here since Start is disabled when flat is empty.
    onCancel();
    return null;
  }

  const isWork = /work|hard|on|go|sprint|push/i.test(step.label);
  const isRest = /rest|recover|off|easy/i.test(step.label);
  const accent = isRest
    ? 'var(--pump-cyan-deep)'
    : isWork
      ? 'var(--pump-hot)'
      : 'var(--pump-purple)';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-stretch"
      style={{ background: 'var(--pump-bg-page)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-hot)] transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="font-display tracking-wider text-sm">STOP</span>
        </button>
        <div className="text-right">
          <p className="text-[9px] tabular-nums tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)]">
            {sequence.name || 'Intervals'}
          </p>
          <p className="tabular-nums text-xs tabular-nums text-[color:var(--pump-text-mid)]">
            Step {stepIndex + 1} / {flat.length}
          </p>
        </div>
      </div>

      {/* Big countdown */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <p
          className="text-xs tracking-[0.4em] uppercase tabular-nums"
          style={{ color: accent }}
        >
          {step.blockCount > 1 ? `Block ${step.blockIndex + 1}/${step.blockCount} · ` : ''}
          Round {step.round}/{step.rounds}
        </p>

        <motion.p
          key={`label-${stepIndex}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-display text-3xl tracking-[0.15em] uppercase"
          style={{ color: accent }}
        >
          {step.label}
        </motion.p>

        <motion.p
          className="tabular-nums font-bold tabular-nums leading-none"
          style={{
            color: accent,
            fontSize: 'clamp(5rem, 22vw, 9rem)',
            textShadow: `0 0 40px ${accent}, 0 0 80px ${accent}`,
          }}
          animate={remaining <= 3 ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={remaining <= 3 ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
        >
          {Math.ceil(remaining)}
        </motion.p>

        {/* Progress dots */}
        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {flat.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === stepIndex ? 20 : 6,
                background: i < stepIndex ? accent : i === stepIndex ? accent : 'var(--pump-border-card)',
                opacity: i < stepIndex ? 0.5 : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={togglePause}
          className="h-14 w-14 p-0 rounded-full"
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </Button>
        <Button
          onClick={skip}
          className="h-14 px-6 text-white border-0 font-display tracking-widest"
          style={{ background: 'var(--pump-grad-hot)' }}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          {stepIndex === flat.length - 1 ? 'FINISH' : 'SKIP'}
        </Button>
      </div>
    </motion.div>
  );
}

// Named exports for individual consumers if needed.
export { totalSeconds as computeIntervalTotalDuration };
export type { IntervalFlowProps };

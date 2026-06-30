'use client';

// Atmospheric cockpit header (mockup §02), anchored sticky at the top of the
// active gym view. A cropped `pump-scene-gym.png` band carries the session
// meta (cyan caps), the current exercise name (Pacifico), the live elapsed
// clock, and the rest controls — quick-start presets, or a prominent live
// countdown that pulses (glow-state--urgent) in its final seconds. All timer
// logic is unchanged from the old light bar; only the presentation moved onto
// the scene. The advanced Timer (custom durations, stopwatch) still lives in
// the Sheet triggered from the top nav.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { playSetCompleteFeedback } from '@/lib/sounds';

const REST_PRESETS: { label: string; seconds: number }[] = [
  { label: "30s", seconds: 30 },
  { label: "60s", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "2m",  seconds: 120 },
];

interface WorkoutTimerBarProps {
  /** ISO timestamp when the session began */
  startTime: string;
  /** Session meta line, e.g. "Push Day · 2 of 6 done" (cyan caps eyebrow) */
  metaLabel?: string;
  /** Current / up-next exercise name, rendered in Pacifico */
  exerciseName?: string;
  /** Optional right-side badge showing interval state when running */
  intervalBadge?: React.ReactNode;
  /** Active weight unit — drives the pill toggle display */
  weightUnit?: 'lbs' | 'kg';
  /** Flip lbs ↔ kg and persist to settings */
  onToggleWeightUnit?: () => void;
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function WorkoutTimerBar({ startTime, metaLabel, exerciseName, intervalBadge, weightUnit, onToggleWeightUnit }: WorkoutTimerBarProps) {
  const startMs = useMemo(() => new Date(startTime).getTime(), [startTime]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [restSeconds, setRestSeconds] = useState<number | null>(null); // total rest duration
  const restStartRef = useRef<number | null>(null);
  const restFiredRef = useRef(false);

  // Session clock — 1Hz tick. Cheap: just a Date.now() read.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));

  // Rest countdown derived from wall clock so it stays accurate across
  // tab suspensions / phone sleeps (iOS throttles intervals aggressively).
  const restRemaining = (() => {
    if (restSeconds == null || restStartRef.current == null) return null;
    const r = restSeconds - Math.floor((nowMs - restStartRef.current) / 1000);
    return Math.max(0, r);
  })();

  // Fire completion feedback exactly once when the countdown hits zero.
  useEffect(() => {
    if (restRemaining === 0 && restSeconds != null && !restFiredRef.current) {
      restFiredRef.current = true;
      playSetCompleteFeedback();
    }
  }, [restRemaining, restSeconds]);

  const startRest = (seconds: number) => {
    restStartRef.current = Date.now();
    restFiredRef.current = false;
    setRestSeconds(seconds);
  };

  const stopRest = () => {
    restStartRef.current = null;
    setRestSeconds(null);
    restFiredRef.current = false;
  };

  const isResting = restRemaining != null;
  const isUrgent = isResting && restRemaining! <= 5 && restRemaining! > 0;
  const isDone = isResting && restRemaining === 0;

  return (
    <motion.div
      className="sticky top-0 z-30 -mx-4 mb-4 overflow-hidden rounded-b-3xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      {/* Scene backdrop — gym scene cropped to a dark band. Plain img matches
          the dashboard hero pattern (no next/image layout constraints). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pump-scene-gym.png" alt="" className="absolute inset-0 w-full h-full object-cover select-none" draggable={false} />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,0,32,0.62) 0%, rgba(10,0,32,0.72) 55%, rgba(10,0,32,0.88) 100%)' }}
      />

      <div className="relative max-w-lg mx-auto px-4 pt-3 pb-3">
        {/* Meta + current exercise */}
        {(metaLabel || exerciseName) && (
          <div className="mb-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              {metaLabel && (
                <p
                  className="text-[10px] tracking-[0.28em] uppercase font-bold truncate"
                  style={{ color: 'rgba(0,255,238,0.9)', textShadow: '0 0 10px rgba(0,255,238,0.5)' }}
                >
                  {metaLabel}
                </p>
              )}
              {weightUnit && onToggleWeightUnit && (
                <button
                  onClick={onToggleWeightUnit}
                  className="shrink-0 flex items-center rounded-md overflow-hidden text-[10px] font-bold tracking-[0.15em] uppercase"
                  style={{ border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)' }}
                  aria-label="Toggle weight unit"
                >
                  {(['lbs', 'kg'] as const).map(u => (
                    <span
                      key={u}
                      className="px-2 py-1 transition-colors"
                      style={weightUnit === u
                        ? { background: 'rgba(0,255,238,0.22)', color: 'rgba(0,255,238,1)', textShadow: '0 0 8px rgba(0,255,238,0.6)' }
                        : { color: 'rgba(255,255,255,0.4)' }}
                    >
                      {u}
                    </span>
                  ))}
                </button>
              )}
            </div>
            {exerciseName && (
              <p
                className="text-white truncate"
                style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '26px', lineHeight: 1.15, textShadow: '0 0 14px rgba(255,0,128,0.5)' }}
              >
                {exerciseName}
              </p>
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Session elapsed */}
          <div className="leading-tight shrink-0">
            <p className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Elapsed
            </p>
            <p className="font-display text-2xl tabular-nums text-white" style={{ textShadow: '0 0 8px rgba(0,0,0,0.4)' }}>
              {fmt(elapsed)}
            </p>
          </div>

          {/* Rest presets OR live countdown */}
          <div className="flex-1 flex justify-end items-center gap-1.5 min-w-0">
            {!isResting && !intervalBadge && (
              REST_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => startRest(p.seconds)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold tabular-nums text-white/90 transition-colors hover:bg-white/20"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)' }}
                  aria-label={`Start ${p.label} rest`}
                >
                  {p.label}
                </button>
              ))
            )}

            {isResting && (
              <motion.div
                className={`flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl border ${isUrgent ? 'glow-state glow-state--urgent' : ''}`}
                style={{ background: 'rgba(255,0,128,0.20)', borderColor: 'rgba(255,0,128,0.5)' }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ color: 'rgba(255,0,128,0.95)' }}>
                  {isDone ? 'Done' : 'Rest'}
                </span>
                <span
                  className="font-display text-2xl tabular-nums text-white"
                  style={{ textShadow: '0 0 10px rgba(255,0,128,0.7)' }}
                >
                  {fmt(restRemaining ?? 0)}
                </span>
                <button
                  onClick={stopRest}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Cancel rest"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {intervalBadge && !isResting && (
              <div className="min-w-0">{intervalBadge}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

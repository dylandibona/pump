'use client';

// Persistent timer bar, anchored at the top of the active workout view.
// Shows live session elapsed time and quick-start rest presets. When a
// rest countdown is running, it takes over the bar with a prominent
// countdown + stop button. The advanced Timer (custom durations,
// stopwatch) is still available via the Sheet triggered from the top
// nav — this bar handles the 95% case mid-set.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer as TimerIcon, X } from 'lucide-react';
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
  /** Optional right-side badge showing interval state when running */
  intervalBadge?: React.ReactNode;
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function WorkoutTimerBar({ startTime, intervalBadge }: WorkoutTimerBarProps) {
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
      className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-3 mb-4 bg-[color:var(--pump-bg-page)]/92 backdrop-blur-md border-b border-[color:var(--pump-border-card)]"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {/* Session elapsed */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[color:var(--pump-hot)]/12 flex items-center justify-center text-[color:var(--pump-hot)]">
            <TimerIcon className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)]">
              Session
            </p>
            <p className="font-mono text-lg font-bold tabular-nums text-[color:var(--pump-text)]">
              {fmt(elapsed)}
            </p>
          </div>
        </div>

        {/* Rest presets OR live countdown */}
        <div className="flex-1 flex justify-end items-center gap-1.5 min-w-0">
          {!isResting && !intervalBadge && (
            REST_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => startRest(p.seconds)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[color:var(--pump-bg-input)] text-[color:var(--pump-text-mid)] hover:bg-[color:var(--pump-hot)]/10 hover:text-[color:var(--pump-hot)] transition-colors"
                aria-label={`Start ${p.label} rest`}
              >
                {p.label}
              </button>
            ))
          )}

          {isResting && (
            <motion.div
              className={`flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg border ${
                isDone
                  ? 'bg-[color:var(--pump-hot)]/14 border-[color:var(--pump-hot)]/30'
                  : isUrgent
                    ? 'bg-[color:var(--pump-hot)]/14 border-[color:var(--pump-hot)]/40 animate-pulse-neon'
                    : 'bg-[color:var(--pump-hot)]/8 border-[color:var(--pump-hot)]/20'
              }`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-[color:var(--pump-text-dim)]">
                {isDone ? 'Done' : 'Rest'}
              </span>
              <span
                className={`font-mono text-lg font-bold tabular-nums ${
                  isDone || isUrgent
                    ? 'text-[color:var(--pump-hot)] text-glow-hot'
                    : 'text-[color:var(--pump-text)]'
                }`}
              >
                {fmt(restRemaining ?? 0)}
              </span>
              <button
                onClick={stopRest}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-hot)] hover:bg-[color:var(--pump-hot)]/10 transition-colors"
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
    </motion.div>
  );
}

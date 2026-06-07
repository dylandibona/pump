'use client';

// Cinematic cardio "start" header (mockup §05 / CardioMock). The atmospheric
// counterpart to the gym cockpit band (WorkoutTimerBar): a full-bleed
// `pump-scene-cardio.png` neon-highway scene carrying the session meta
// ("CARDIO · RUN" cyan caps), an inline-editable session name (Pacifico —
// cardio has no name UI elsewhere, so we derive a default and let it be
// renamed in-session), and a giant centered timer at the vanishing point
// showing the cardio banked so far (total logged duration), flanked by live
// distance + pace. The actual entry-by-entry logging lives below in
// CardioWorkout — this is just the moment, not the logger.

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { CardioActivity } from '@/lib/types';

const ACTIVITY_LABEL: Record<CardioActivity, string> = {
  run: 'Run',
  bike: 'Bike',
  swim: 'Swim',
  row: 'Row',
  elliptical: 'Elliptical',
  walk: 'Walk',
};

interface CardioSceneHeaderProps {
  /** Current / primary activity — drives the "CARDIO · <activity>" eyebrow */
  activity: CardioActivity;
  /** Session name, rendered in Pacifico; tap to rename in-session */
  name: string;
  onNameChange: (name: string) => void;
  /** Total logged duration across all entries (seconds) — the hero number */
  totalDurationSec: number;
  /** Total logged distance across all entries (miles) */
  totalDistanceMi: number;
}

function fmt(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function paceLabel(distanceMi: number, durationSec: number): string | null {
  if (distanceMi <= 0 || durationSec <= 0) return null;
  const per = durationSec / distanceMi;
  const m = Math.floor(per / 60);
  const r = Math.round(per % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function CardioSceneHeader({
  activity,
  name,
  onNameChange,
  totalDurationSec,
  totalDistanceMi,
}: CardioSceneHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed the draft from the current name only at the moment editing opens — no
  // effect needed (draft is irrelevant while not editing).
  const startEditing = () => {
    setDraft(name);
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    onNameChange(next.length ? next : name);
    setEditing(false);
  };

  const hasData = totalDurationSec > 0 || totalDistanceMi > 0;
  const pace = paceLabel(totalDistanceMi, totalDurationSec);

  return (
    <motion.div
      className="relative -mx-4 mb-4 overflow-hidden rounded-b-3xl"
      style={{ minHeight: 300 }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Scene backdrop — neon highway, cropped to the band. Plain <img> to
          match the dashboard hero / gym cockpit pattern (no next/image
          layout constraints inside the scroll container). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pump-scene-cardio.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />
      {/* Top + bottom darkening so the caps and the timer stay legible over
          the brightest part of the scene. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,0,32,0.55) 0%, rgba(10,0,32,0.10) 30%, rgba(10,0,32,0.20) 62%, rgba(10,0,32,0.78) 100%)',
        }}
      />

      <div className="relative flex flex-col min-h-[300px] px-6 pt-6 pb-6">
        {/* Eyebrow + session name */}
        <div className="min-w-0">
          <p
            className="text-[11px] tracking-[0.35em] uppercase font-bold"
            style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 14px rgba(0,255,238,0.6)' }}
          >
            Cardio · {ACTIVITY_LABEL[activity]}
          </p>

          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  setDraft(name);
                  setEditing(false);
                }
              }}
              maxLength={40}
              className="mt-1 w-full bg-transparent text-white outline-none border-b border-white/30 focus:border-[color:var(--pump-cyan)]"
              style={{
                fontFamily: 'var(--font-pacifico), cursive',
                fontSize: '34px',
                lineHeight: 1.05,
                textShadow: '0 0 18px rgba(255,0,128,0.55)',
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="mt-1 flex items-center gap-2 text-left group"
              aria-label="Rename cardio session"
            >
              <span
                className="text-white"
                style={{
                  fontFamily: 'var(--font-pacifico), cursive',
                  fontSize: '34px',
                  lineHeight: 1.05,
                  textShadow: '0 0 18px rgba(255,0,128,0.55)',
                }}
              >
                {name}
              </span>
              <Pencil className="w-4 h-4 text-white/45 group-hover:text-white/80 transition-colors shrink-0" />
            </button>
          )}
        </div>

        {/* Hero timer at the vanishing point + flanking stats */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p
              className="text-white tabular-nums font-display"
              style={{
                fontSize: hasData ? '72px' : '64px',
                lineHeight: 1,
                textShadow: '0 0 20px rgba(0,255,238,0.5)',
                opacity: hasData ? 1 : 0.85,
              }}
            >
              {fmt(totalDurationSec)}
            </p>

            {hasData ? (
              <div className="flex justify-center gap-6 mt-4 text-white">
                {totalDistanceMi > 0 && (
                  <div>
                    <p className="font-display tabular-nums text-xl">
                      {totalDistanceMi.toFixed(2)}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      mi
                    </p>
                  </div>
                )}
                {pace && (
                  <div>
                    <p className="font-display tabular-nums text-xl">{pace}</p>
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      /mi
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p
                className="mt-3 text-[11px] uppercase tracking-[0.3em] font-semibold"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Log your first activity
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

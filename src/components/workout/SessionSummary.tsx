'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Send, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkoutSession, ExerciseStatus, ExerciseStatusReason, GymExercise } from '@/lib/types';
import { getPRs, getPlan, patchSession } from '@/lib/storage';
import { generateBrief } from '@/lib/brief';
import { parseSessionDate, sessionLabel } from '@/lib/utils';

// Named feel rating (mockup §04) — replaces the bare 1–5 chips. The number
// still drives feel_score + the BRIEF; the word gives it personality.
const FEEL_OPTIONS: { n: number; label: string }[] = [
  { n: 1, label: 'Brutal' },
  { n: 2, label: 'Tough' },
  { n: 3, label: 'OK' },
  { n: 4, label: 'Good' },
  { n: 5, label: 'Easy' },
];

interface SessionSummaryProps {
  session: WorkoutSession;
  onClose: () => void;
  newPRs?: string[];
  newBaselines?: string[];
}

const STATUS_OPTIONS: { value: ExerciseStatus; label: string; tone: 'good' | 'warn' | 'bad' | 'info' }[] = [
  { value: 'completed',   label: 'COMPLETED',   tone: 'good' },
  { value: 'partial',     label: 'PARTIAL',     tone: 'warn' },
  { value: 'skipped',     label: 'SKIPPED',     tone: 'bad' },
  { value: 'substituted', label: 'SUBSTITUTED', tone: 'info' },
];

const REASON_OPTIONS: { value: ExerciseStatusReason; label: string }[] = [
  { value: 'crowded_gym',           label: 'Crowded gym' },
  { value: 'equipment_unavailable', label: 'Equipment unavailable' },
  { value: 'form_issue',            label: 'Form issue' },
  { value: 'pain',                  label: 'Pain / discomfort' },
  { value: 'out_of_time',           label: 'Out of time' },
  { value: 'other',                 label: 'Other' },
];

function statusChipClass(tone: 'good' | 'warn' | 'bad' | 'info', active: boolean): string {
  const base = 'px-2.5 py-1 rounded-full text-[10px] font-display tracking-widest transition-colors border';
  if (active) {
    switch (tone) {
      case 'good': return `${base} bg-primary/20 text-primary border-primary/50`;
      case 'warn': return `${base} bg-accent/20 text-accent border-accent/50`;
      case 'bad':  return `${base} bg-destructive/20 text-destructive border-destructive/50`;
      case 'info': return `${base} bg-secondary/60 text-foreground border-border`;
    }
  }
  return `${base} bg-secondary/20 text-muted-foreground border-border/50 hover:border-primary/30`;
}

export function SessionSummary({ session: initialSession, onClose, newPRs = [], newBaselines = [] }: SessionSummaryProps) {
  // Local copy so status / reason overrides render immediately. patchSession
  // mirrors every write to storage so the BRIEF reflects the latest state.
  const [session, setSession] = useState<WorkoutSession>(initialSession);
  const prs = getPRs();
  const plan = getPlan();
  const [briefCopied, setBriefCopied] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  // Track which exercise rows have their status editor open. Anomalies
  // (skipped / partial) auto-expand so the reason picker is one tap away
  // (trainer's "make leaving a note take less cognitive effort than not"
  // principle).
  const [expandedEditors, setExpandedEditors] = useState<Set<string>>(() => {
    const s = new Set<string>();
    initialSession.exercises?.forEach(ex => {
      if (ex.status === 'skipped' || ex.status === 'partial') s.add(ex.id);
    });
    return s;
  });

  // Apply a per-exercise patch — status / reason / notes — to both local
  // state and localStorage. patchSession writes through; storage is the
  // source of truth the BRIEF generator reads.
  const updateExercise = (exerciseId: string, patch: Partial<GymExercise>) => {
    const updated = {
      ...session,
      exercises: session.exercises?.map(ex =>
        ex.id === exerciseId ? { ...ex, ...patch } : ex
      ),
    };
    setSession(updated);
    patchSession(session.id, { exercises: updated.exercises });
  };

  const toggleEditor = (exerciseId: string) => {
    setExpandedEditors(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId); else next.add(exerciseId);
      return next;
    });
  };

  // Session notes are captured HERE (post-workout) — this is the only UI
  // that writes to `session.notes`. Local state keeps the textarea snappy;
  // we persist to storage on blur so the BRIEF + session-detail view see
  // the latest copy. The brief itself is regenerated at copy time using
  // the live notes value so the user always gets what they just typed.
  const [notes, setNotes] = useState(session.notes ?? '');

  const handleNotesBlur = () => {
    const trimmed = notes.trim();
    // Only persist if it actually changed — avoids unnecessary writes.
    if (trimmed !== (session.notes?.trim() ?? '')) {
      patchSession(session.id, { notes: trimmed });
    }
  };

  // Session feel — 1 (rough) to 5 (great). Writes through to storage and the
  // local session copy so the BRIEF (and the Supabase session row) pick it up.
  // Tapping the active value again clears it.
  const [feelScore, setFeelScore] = useState<number | undefined>(session.feelScore);
  const handleSetFeel = (n: number) => {
    const next = feelScore === n ? undefined : n;
    setFeelScore(next);
    setSession(s => ({ ...s, feelScore: next }));
    patchSession(session.id, { feelScore: next });
  };

  const buildBrief = () =>
    generateBrief({ ...session, notes: notes.trim() }, plan, newPRs, newBaselines);

  const handleSendToTrainer = () => {
    // Persist any un-blurred notes, then rebuild the brief from fresh state.
    handleNotesBlur();
    const brief = buildBrief();
    // Show feedback immediately — don't wait for async clipboard
    setBriefCopied(true);
    setShowBrief(true);
    setTimeout(() => setBriefCopied(false), 3000);
    navigator.clipboard.writeText(brief).catch(() => {
      // Clipboard failed — text panel is visible for manual copy
    });
  };

  // Live preview uses the current notes so the on-screen text matches
  // what just got copied.
  const brief = buildBrief();

  // Calculate gym stats (show whenever exercises exist)
  const gymStats = session.exercises && session.exercises.length > 0 ? {
    exerciseCount: session.exercises.length,
    totalSets: session.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => !s.isWarmup).length,
      0
    ),
    totalVolume: session.exercises.reduce(
      (sum, ex) =>
        sum + ex.sets.filter(s => !s.isWarmup).reduce((setSum, set) => setSum + set.weight * set.reps, 0),
      0
    ),
  } : null;

  // Calculate cardio stats (show whenever cardio exists)
  const cardioStats = session.cardio && session.cardio.length > 0 ? {
    activityCount: session.cardio.length,
    totalDistance: session.cardio.reduce((sum, c) => sum + (c.distance ?? 0), 0),
    totalDuration: session.cardio.reduce((sum, c) => sum + (c.duration ?? 0), 0),
  } : null;

  // Calculate duration
  const duration = session.endTime && session.startTime
    ? Math.round(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 / 60
      )
    : null;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isGym = session.type === 'gym';

  // Inline stats caption under the hero title (mockup §04): "62 min · 18 sets
  // · 12K lbs moved" for gym, distance + time for cardio.
  const heroCaption = (() => {
    const parts: string[] = [];
    if (duration) parts.push(`${duration} min`);
    if (gymStats) {
      parts.push(`${gymStats.totalSets} sets`);
      if (gymStats.totalVolume > 0) {
        const v = gymStats.totalVolume;
        parts.push(`${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} lbs moved`);
      }
    }
    if (cardioStats) {
      if (cardioStats.totalDistance > 0) parts.push(`${cardioStats.totalDistance.toFixed(2)} mi`);
      parts.push(formatTime(cardioStats.totalDuration));
    }
    return parts.join(' · ');
  })();

  return (
    <div className="min-h-[80vh] flex flex-col relative">
      {/* Background celebration effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: isGym
              ? 'radial-gradient(ellipse at center top, oklch(0.85 0.25 125 / 0.15) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at center top, oklch(0.7 0.25 350 / 0.15) 0%, transparent 50%)'
          }}
        />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Hero band — sunset balcony scene with the session title overlaid
            (mockup §04). Full-bleed to the top of the padded container. */}
        <motion.div
          className="-mx-4 -mt-6 relative h-[240px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pump-scene-complete.png" alt="" className="absolute inset-0 w-full h-full object-cover select-none" draggable={false} />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(10,0,32,0.15) 0%, rgba(10,0,32,0.0) 30%, rgba(10,0,32,0.0) 55%, rgba(10,0,32,0.62) 100%)' }}
          />
          <motion.div
            className="absolute inset-0 flex flex-col justify-end p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <p
              className="text-[11px] tracking-[0.35em] uppercase font-bold mb-1"
              style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 14px rgba(0,255,238,0.7)' }}
            >
              Workout Complete
            </p>
            <p
              className="text-white"
              style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '40px', lineHeight: 1.05, textShadow: '0 0 18px rgba(255,0,128,0.6)' }}
            >
              {sessionLabel(session, plan)}
            </p>
            <p className="text-white/70 text-xs mt-1">
              {heroCaption || parseSessionDate(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </motion.div>

        {/* New PRs Celebration */}
        {newPRs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="glass rounded-2xl p-6 border-2 border-accent/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 animate-shimmer" />
            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center text-accent"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Trophy className="w-7 h-7" />
              </motion.div>
              <div>
                <p className="font-display text-3xl tracking-wider text-accent text-glow-hot">
                  NEW {newPRs.length > 1 ? 'PRs' : 'PR'}!
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPRs.map((exercise, index) => (
                    <motion.div
                      key={exercise}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        {exercise}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase text-center mb-4">
            SESSION STATS
          </p>

          {gymStats && (
            <div className="grid grid-cols-2 gap-4">
              <StatBox
                value={gymStats.exerciseCount}
                label="EXERCISES"
                color="primary"
                delay={0.7}
              />
              <StatBox
                value={gymStats.totalSets}
                label="WORKING SETS"
                color="primary"
                delay={0.75}
              />
              <StatBox
                value={gymStats.totalVolume.toLocaleString()}
                label="LBS VOLUME"
                color="primary"
                delay={0.8}
              />
              {duration && (
                <StatBox
                  value={formatDuration(duration)}
                  label="DURATION"
                  color="primary"
                  delay={0.85}
                />
              )}
            </div>
          )}

          {cardioStats && (
            <div className="grid grid-cols-2 gap-4">
              <StatBox
                value={cardioStats.totalDistance.toFixed(2)}
                label="MILES"
                color="accent"
                delay={0.7}
              />
              <StatBox
                value={formatTime(cardioStats.totalDuration)}
                label="TOTAL TIME"
                color="accent"
                delay={0.75}
              />
              {cardioStats.totalDistance > 0 && (
                <div className="col-span-2">
                  <StatBox
                    value={`${Math.floor(cardioStats.totalDuration / cardioStats.totalDistance / 60)}:${Math.round((cardioStats.totalDuration / cardioStats.totalDistance) % 60).toString().padStart(2, '0')}/mi`}
                    label="AVERAGE PACE"
                    color="accent"
                    delay={0.8}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Exercise Breakdown (Gym) */}
        {session.exercises && session.exercises.length > 0 && (
          <motion.div
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-4">
              EXERCISE BREAKDOWN
            </p>
            <div className="space-y-3">
              {session.exercises.map((exercise, index) => {
                const workingSets = exercise.sets.filter((s) => !s.isWarmup);
                const exercisePR = prs.find(
                  (pr) => pr.exerciseName.toLowerCase() === exercise.name.toLowerCase()
                );
                const isNewPR = newPRs.includes(exercise.name);
                const isBaseline = !isNewPR && newBaselines.includes(exercise.name);
                const currentStatus: ExerciseStatus = exercise.status ?? 'completed';
                const statusOption = STATUS_OPTIONS.find(o => o.value === currentStatus)!;
                const isEditorOpen = expandedEditors.has(exercise.id);
                const needsReason = currentStatus === 'partial' || currentStatus === 'skipped';

                return (
                  <motion.div
                    key={exercise.id}
                    className={`pump-card p-4 ${isNewPR ? 'pump-card--active' : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="font-display text-lg">
                        {exercise.name.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isNewPR && <span className="pr-badge">NEW BEST</span>}
                        {isBaseline && <span className="tag tag--warmup">BASELINE</span>}
                        <button
                          onClick={() => toggleEditor(exercise.id)}
                          className={`${statusChipClass(statusOption.tone, true)} flex items-center gap-1`}
                          aria-label={`Status: ${statusOption.label}. Tap to change.`}
                          aria-expanded={isEditorOpen}
                        >
                          {statusOption.label}
                          <ChevronDown className={`w-3 h-3 transition-transform ${isEditorOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    {workingSets.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {workingSets.map((set, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-lg bg-background/50 tabular-nums text-sm text-primary"
                          >
                            {set.weight}×{set.reps}
                          </span>
                        ))}
                      </div>
                    )}
                    {exercisePR && !isNewPR && (
                      <p className="text-xs text-muted-foreground mt-2">
                        PR: {exercisePR.weight}lbs × {exercisePR.reps}
                      </p>
                    )}
                    {/* Inline reason badge when not editing — trainer needs
                        to see "why" at a glance on non-completed rows. */}
                    {!isEditorOpen && needsReason && exercise.statusReason && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {REASON_OPTIONS.find(r => r.value === exercise.statusReason)?.label}
                      </p>
                    )}
                    {/* Status editor — status + reason + per-exercise note,
                        auto-expanded for anomalies. */}
                    {isEditorOpen && (
                      <div className="mt-3 pt-3 border-t border-[color:var(--pump-border-card)] space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => updateExercise(exercise.id, { status: opt.value })}
                              className={statusChipClass(opt.tone, currentStatus === opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {needsReason && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase tabular-nums">
                              Reason
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {REASON_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateExercise(exercise.id, { statusReason: opt.value })}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-display tracking-widest transition-colors border ${
                                    exercise.statusReason === opt.value
                                      ? 'bg-accent/20 text-accent border-accent/50'
                                      : 'bg-secondary/20 text-muted-foreground border-border/50 hover:border-accent/30'
                                  }`}
                                >
                                  {opt.label.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`note-${exercise.id}`}
                            className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase tabular-nums block"
                          >
                            Quick note
                          </label>
                          <textarea
                            id={`note-${exercise.id}`}
                            defaultValue={exercise.notes ?? ''}
                            onBlur={(e) => {
                              const trimmed = e.target.value.trim();
                              if (trimmed !== (exercise.notes?.trim() ?? '')) {
                                updateExercise(exercise.id, { notes: trimmed });
                              }
                            }}
                            placeholder={needsReason ? 'What happened?' : 'Anything worth flagging?'}
                            className="w-full min-h-[60px] rounded-lg p-2 text-sm bg-[color:var(--pump-bg-input)] border border-[color:var(--pump-border-card)] text-[color:var(--pump-text)] placeholder:text-[color:var(--pump-text-dim)] focus:outline-none focus:border-[color:var(--pump-hot)]/40 resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Session feel — named rating (Brutal…Easy); feeds feel_score + BRIEF */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl p-4"
          style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-[0.25em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>
              How did it feel?
            </p>
            <p className="text-xs italic" style={{ color: 'var(--pump-text-mid)' }}>Goes to your trainer</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {FEEL_OPTIONS.map(({ n, label }) => {
              const active = feelScore === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleSetFeel(n)}
                  aria-pressed={active}
                  aria-label={`Feel ${n} of 5 — ${label}`}
                  className="rounded-xl py-2.5 flex flex-col items-center gap-0.5 transition-all active:scale-95"
                  style={
                    active
                      ? {
                          background: 'var(--pump-grad-hot)',
                          color: '#fff',
                          boxShadow: '0 4px 14px -4px rgba(255,0,128,0.55)',
                        }
                      : {
                          background: 'var(--pump-bg-input)',
                          color: 'var(--pump-text-mid)',
                          border: '1px solid var(--pump-border-card)',
                        }
                  }
                >
                  <span className="font-display tabular-nums text-lg">{n}</span>
                  <span className="text-[9px] tracking-[0.15em] uppercase font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.92 }}
          className="space-y-2"
        >
          <label
            htmlFor="session-notes"
            className="text-xs tracking-[0.2em] uppercase text-[color:var(--pump-cyan-deep)] tabular-nums"
          >
            Session notes for trainer
          </label>
          <textarea
            id="session-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="How did it feel? Energy, form, soreness, anything worth flagging…"
            className="w-full min-h-[96px] rounded-xl p-3 bg-[color:var(--pump-bg-input)] border border-[color:var(--pump-border-card)] text-sm text-[color:var(--pump-text)] placeholder:text-[color:var(--pump-text-dim)] focus:outline-none focus:border-[color:var(--pump-hot)]/40 focus:bg-[color:var(--pump-bg-tinted)] resize-none transition-colors"
            rows={3}
          />
        </motion.div>

        {/* Sync reassurance — the most important thing on this screen.
            The session is ALREADY in Supabase (one row, idempotent) before the
            user taps anything. The honest framing prevents "Send recap" from
            implying that the data hasn't been sent. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.94 }}
          className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
          style={{ background: 'rgba(0,168,158,0.08)', border: '1px solid rgba(0,168,158,0.18)' }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--pump-cyan-deep)' }}>
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>Synced to trainer</p>
            <p className="text-xs" style={{ color: 'var(--pump-text-mid)' }}>Your trainer sees this in their dashboard. No paste needed.</p>
          </div>
        </motion.div>

        {/* Primary action — "Done" is honest now (the data is already where it
            belongs). Pacifico on hot gradient = V3 moment. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.97 }}
        >
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl py-4 text-white text-2xl"
            style={{
              fontFamily: 'var(--font-pacifico), cursive',
              background: 'var(--pump-grad-hot)',
              boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)',
            }}
          >
            Done
          </motion.button>
        </motion.div>

        {/* Secondary — opens a conversation with the trainer (still copies the
            brief; users who want immediate chat in claude.ai can use this). */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-3"
        >
          <button
            type="button"
            onClick={handleSendToTrainer}
            className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm tracking-[0.18em] uppercase font-bold transition-all"
            style={{
              background: 'transparent',
              color: 'var(--pump-text-mid)',
              border: '1px solid var(--pump-border-card)',
            }}
          >
            {briefCopied ? (
              <>
                <Check className="w-4 h-4" />
                Brief copied — paste in chat
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Open with trainer
              </>
            )}
          </button>

          {showBrief && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-4 space-y-2" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}>
                <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>
                  Brief copy — paste in your Health Project chat
                </p>
                <textarea
                  readOnly
                  value={brief}
                  className="w-full min-h-[200px] rounded-xl p-3 text-xs resize-none focus:outline-none"
                  style={{
                    background: 'var(--pump-bg-input)',
                    color: 'var(--pump-text)',
                    border: '1px solid var(--pump-border-card)',
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Stat Box Component
function StatBox({
  value,
  label,
  color,
  delay,
}: {
  value: string | number;
  label: string;
  color: 'primary' | 'accent';
  delay: number;
}) {
  return (
    <motion.div
      className="text-center p-4 rounded-xl bg-secondary/30"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <motion.p
        className={`font-display text-4xl ${
          color === 'primary' ? 'text-primary text-glow-neon' : 'text-accent text-glow-hot'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1 }}
      >
        {value}
      </motion.p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
        {label}
      </p>
    </motion.div>
  );
}

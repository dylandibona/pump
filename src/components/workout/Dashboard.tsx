'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, Download, ClipboardList, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecentSessions, getWorkoutStats, exportData } from '@/lib/storage';
import { WorkoutSession, TrainerPlan } from '@/lib/types';
import { parseSessionDate, sessionLabel } from '@/lib/utils';
import { BloodPressureSheet } from './BloodPressureSheet';
import { fetchPRs, getCachedPRs, currentBestPerExercise, type CuratedPR } from '@/lib/prs-sync';
import type { CloudSync } from '@/hooks/useCloudSync';

interface DashboardProps {
  onStartWorkout: () => void;
  onViewHistory: () => void;
  onViewSession: (session: WorkoutSession) => void;
  onOpenPlan: () => void;
  plan: TrainerPlan | null;
  sync: CloudSync;
  // Bumps when stored data changes out-of-band (cold-start cleanup, a cloud
  // sync merge). Used to re-derive the localStorage-backed views WITHOUT
  // remounting the dashboard — remounting replays every entry animation, which
  // looked like the screen flashing several times on load.
  refreshToken: number;
}

export function Dashboard({ onStartWorkout, onViewHistory, onViewSession, onOpenPlan, plan, sync, refreshToken }: DashboardProps) {
  const stats = useMemo(() => getWorkoutStats(), [refreshToken]);
  const recentSessions = useMemo(() => getRecentSessions(5), [refreshToken]);
  // Records come from the curated Supabase `prs` table (cached locally for
  // instant first paint). The local PersonalRecord store is no longer read
  // here — it stays only for the in-session "new best" badge.
  const [prsAll, setPrsAll] = useState<CuratedPR[]>(() => getCachedPRs());
  useEffect(() => {
    let cancelled = false;
    fetchPRs().then(fresh => { if (!cancelled) setPrsAll(fresh); });
    return () => { cancelled = true; };
  }, [refreshToken]);
  const prs = useMemo(() => currentBestPerExercise(prsAll), [prsAll]);

  const [showBP, setShowBP] = useState(false);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pump-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string): string => {
    const date = parseSessionDate(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (start: string, end?: string): string => {
    if (!end) return '--';
    const minutes = Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60
    );
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return vol.toString();
  };

  return (
    <div className="min-h-screen pb-28 relative">
      {/* Subtle warm radial glow (light theme) */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-60" />

      {/* Hot-pink ambient halo behind the hero */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[color:var(--pump-hot)]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Brand hero — neon "Pump" header treatment. The single brand moment,
            dashboard-only. */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="-mx-4 -mt-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pump-header.png"
            alt="PUMP"
            className="w-full h-auto block select-none"
            draggable={false}
          />
        </motion.div>

        {/* Plan chip + inline BP heart button — one row, per mockup §01.
            Plan chip expands; BP is a compact hot-gradient heart so the BP
            log is one tap from anywhere but doesn't take a full row. */}
        <motion.div
          className="flex items-center gap-2 pr-[max(0.25rem,env(safe-area-inset-right))]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            onClick={onOpenPlan}
            className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.06)' }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,168,158,0.10)', color: 'var(--pump-cyan-deep)' }}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>
                {plan ? 'Active plan' : 'No plan loaded'}
              </p>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--pump-text)' }}>
                {plan ? `${plan.name} · v${plan.version}` : 'Paste a trainer plan →'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--pump-text-dim)' }} />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setShowBP(true)}
            aria-label="Log blood pressure"
            whileTap={{ scale: 0.96 }}
            className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--pump-grad-hot)',
              boxShadow: '0 6px 16px -8px rgba(255,0,128,0.55)',
              color: '#fff',
            }}
          >
            <Heart className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Start Workout CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Button
            onClick={onStartWorkout}
            className="w-full h-20 text-3xl tracking-wide relative overflow-hidden group touch-target text-white border-0 shadow-[0_0_24px_rgba(255,0,128,0.35),0_0_60px_rgba(255,0,128,0.12)]"
            style={{
              background: 'var(--pump-grad-hot)',
              fontFamily: 'var(--font-pacifico), cursive',
            }}
            size="lg"
          >
            <span className="relative z-10">Let&rsquo;s Go</span>
            <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            value={stats.totalSessions}
            label="WORKOUTS"
            delay={0}
            onClick={onViewHistory}
          />
          <StatCard
            value={prs.length}
            label="RECORDS"
            accent
            delay={1}
          />
          <StatCard
            value={formatVolume(stats.totalVolume)}
            label="LBS MOVED"
            delay={2}
          />
        </motion.div>

        {/* BP entry lives inline with the plan chip above (mockup §01).
            The full-width "Log a reading" card was an interim layout — removed
            so the BP affordance stays compact and the dashboard flows hero →
            chip+BP → CTA → stats → recent → PR, matching the mockup. */}

        {/* Recent Workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl tracking-[0.12em] uppercase" style={{ color: 'var(--pump-text)' }}>
              Recent
            </h2>
            {recentSessions.length > 0 && (
              <button
                onClick={onViewHistory}
                className="text-xs tracking-[0.18em] uppercase font-bold transition-colors"
                style={{ color: 'var(--pump-cyan-deep)' }}
              >
                View all
              </button>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <EmptyState onStart={onStartWorkout} />
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session, index) => (
                <motion.button
                  key={session.id}
                  onClick={() => onViewSession(session)}
                  className="w-full text-left flex items-center gap-3 rounded-2xl p-3 transition-all"
                  style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.06 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    session.type === 'gym' ? 'text-[color:var(--pump-hot)]' : 'text-[color:var(--pump-cyan-deep)]'
                  }`}
                    style={{ background: session.type === 'gym' ? 'rgba(255,0,128,0.08)' : 'rgba(0,168,158,0.10)' }}>
                    {session.type === 'gym' ? <Dumbbell className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate" style={{ color: 'var(--pump-text)' }}>{sessionLabel(session, plan)}</span>
                      {!session.completed && (
                        <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold shrink-0"
                          style={{ background: 'rgba(0,168,158,0.12)', color: 'var(--pump-cyan-deep)' }}>
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--pump-text-dim)' }}>
                      {formatDate(session.date)}
                      {session.endTime ? ` · ${formatDuration(session.startTime, session.endTime)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {session.type === 'gym' && session.exercises && (
                      <p className="text-sm tabular-nums" style={{ color: 'var(--pump-text-mid)' }}>
                        {session.exercises.length} exercises
                      </p>
                    )}
                    {session.type === 'cardio' && session.cardio && (
                      <p className="text-sm tabular-nums" style={{ color: 'var(--pump-cyan-deep)' }}>
                        {session.cardio.reduce((sum, c) => sum + (c.distance ?? 0), 0).toFixed(1)} mi
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Personal Records — featured Latest PR on the darker motif, then a calm
            list of the next-best below. */}
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="font-display text-xl tracking-[0.12em] uppercase mb-3" style={{ color: 'var(--pump-text)' }}>
              Personal Records
            </h2>

            {/* Featured: Latest PR — dark navy/purple motif */}
            <div className="relative overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #0A0020 0%, #180845 50%, #3a0868 100%)',
                boxShadow: '0 6px 24px -8px rgba(139,0,255,0.5), inset 0 0 0 1px rgba(0,255,238,0.15)',
              }}>
              {/* Cyan horizon line — the one V2 accent */}
              <div className="absolute inset-x-4 top-3 h-px" style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,255,238,0.6), transparent)',
                boxShadow: '0 0 8px rgba(0,255,238,0.4)',
              }} />
              <div className="px-5 py-5 text-center relative">
                <p className="text-[10px] tracking-[0.3em] uppercase font-bold"
                  style={{ color: 'rgba(0,255,238,0.85)' }}>
                  Latest Personal Record
                </p>
                <p className="text-white text-3xl mt-2 leading-tight"
                  style={{ fontFamily: 'var(--font-pacifico), cursive', textShadow: '0 0 18px rgba(255,0,128,0.55), 0 0 36px rgba(139,0,255,0.4)' }}>
                  {prs[0].exercise}
                </p>
                <p className="text-white font-display text-3xl tabular-nums mt-1"
                  style={{ textShadow: '0 0 12px rgba(0,255,238,0.45)' }}>
                  {prs[0].weight} × {prs[0].reps}
                </p>
                <p className="text-[11px] tracking-wider uppercase mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {parseSessionDate(prs[0].achievedOn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Next-best PRs — calm list below the featured one */}
            {prs.length > 1 && (
              <div className="mt-3 space-y-2">
                {prs.slice(1, 7).map((pr, index) => (
                  <motion.div
                    key={`${pr.exercise}-${pr.kind}`}
                    className="flex items-center gap-3 rounded-2xl p-3"
                    style={{ background: '#FFFFFF', boxShadow: '0 1px 2px rgba(10,0,32,0.05)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                  >
                    <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--pump-text)' }}>{pr.exercise}</span>
                    <span className="tag tag--pr tabular-nums">{pr.weight}×{pr.reps}</span>
                    <span
                      className="text-[9px] tracking-[0.15em] uppercase font-bold rounded-full px-1.5 py-0.5"
                      style={{
                        background: pr.kind === 'load' ? 'rgba(255,0,128,0.10)' : 'rgba(0,168,158,0.12)',
                        color: pr.kind === 'load' ? 'var(--pump-hot)' : 'var(--pump-cyan-deep)',
                      }}
                    >
                      {pr.kind}
                    </span>
                    <span className="text-[10px] tracking-wider tabular-nums shrink-0" style={{ color: 'var(--pump-text-dim)' }}>
                      {parseSessionDate(pr.achievedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* CloudSyncCard hidden in Pass 2 — the Upstash sync is being retired.
            Sessions sync to Supabase automatically; status is surfaced on the
            workout-complete screen ("Synced to trainer"). Component is kept in
            the codebase for the Phase 2 cleanup. */}

        {/* Export / Backup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full font-display tracking-wider border-dashed border opacity-50 hover:opacity-100 transition-opacity"
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT BACKUP
          </Button>
        </motion.div>
      </div>

      <BloodPressureSheet open={showBP} onOpenChange={setShowBP} />
    </div>
  );
}

// Stat Card Component
function StatCard({
  value,
  label,
  accent = false,
  delay = 0,
  onClick,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      className={`${accent ? 'surface-warm--hot' : 'surface-warm'} rounded-2xl p-4 text-center ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay * 0.1 }}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
    >
      <p className="font-display text-3xl tabular-nums"
        style={{ color: accent ? 'var(--pump-hot)' : 'var(--pump-text)' }}>
        {value}
      </p>
      <p className="text-[10px] tracking-[0.18em] uppercase mt-1 font-bold"
        style={{ color: 'var(--pump-text-dim)' }}>
        {label}
      </p>
    </motion.div>
  );
}

// Empty State — first-run scene moment (mockup §06). Full-bleed beach scene
// (a calm "chill arrival" mood, distinct from sign-in's dramatic dumbbell
// scene) with a cyan caps eyebrow + Pacifico call. The whole card starts a
// workout so the first set is one tap away.
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onStart}
      className="relative block w-full overflow-hidden rounded-3xl text-left"
      style={{ aspectRatio: '3 / 4', boxShadow: '0 16px 48px -16px rgba(139,0,255,0.45)' }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      whileTap={{ scale: 0.99 }}
    >
      <Image src="/pump-scene-beach.png" alt="" fill priority className="object-cover" />
      <div
        className="absolute inset-x-0 bottom-0 p-6 text-center"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(10,0,32,0.65) 100%)' }}
      >
        <p
          className="text-[11px] tracking-[0.35em] uppercase font-bold"
          style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 14px rgba(0,255,238,0.6)' }}
        >
          Ready when you are
        </p>
        <p
          className="text-white mt-1"
          style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '34px', lineHeight: 1.1, textShadow: '0 0 16px rgba(255,0,128,0.6)' }}
        >
          Log your first set
        </p>
        <p className="text-white/70 text-sm mt-2">Tap to start — your plan is waiting above.</p>
      </div>
    </motion.button>
  );
}

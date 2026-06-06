'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, Download, ClipboardList, ChevronRight, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecentSessions, getWorkoutStats, exportData } from '@/lib/storage';
import { WorkoutSession, TrainerPlan } from '@/lib/types';
import { parseSessionDate } from '@/lib/utils';
import { CloudSyncCard } from './CloudSyncCard';
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
}

export function Dashboard({ onStartWorkout, onViewHistory, onViewSession, onOpenPlan, plan, sync }: DashboardProps) {
  const stats = useMemo(() => getWorkoutStats(), []);
  const recentSessions = useMemo(() => getRecentSessions(5), []);
  // Records come from the curated Supabase `prs` table (cached locally for
  // instant first paint). The local PersonalRecord store is no longer read
  // here — it stays only for the in-session "new best" badge.
  const [prsAll, setPrsAll] = useState<CuratedPR[]>(() => getCachedPRs());
  useEffect(() => {
    let cancelled = false;
    fetchPRs().then(fresh => { if (!cancelled) setPrsAll(fresh); });
    return () => { cancelled = true; };
  }, []);
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

        {/* Plan status bar — tap to open Plan tab */}
        <motion.button
          onClick={onOpenPlan}
          className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-10 h-10 rounded-lg bg-[color:var(--pump-cyan-deep)]/14 flex items-center justify-center text-[color:var(--pump-cyan-deep)] shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
              {plan ? 'ACTIVE PLAN' : 'NO PLAN LOADED'}
            </p>
            <p className="text-sm font-semibold truncate">
              {plan ? `${plan.name} · v${plan.version}` : 'Paste a trainer plan →'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[color:var(--pump-hot)] transition-colors shrink-0" />
        </motion.button>

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

        {/* Blood pressure — quick log + last reading */}
        <motion.button
          type="button"
          onClick={() => setShowBP(true)}
          aria-label="Log blood pressure"
          className="pump-card w-full p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[color:var(--pump-hot)]/10 shrink-0">
            <Heart className="w-5 h-5 text-[color:var(--pump-hot)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Blood Pressure</p>
            <p className="font-display text-lg tracking-wide text-[color:var(--pump-text)]">Log a reading</p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ background: 'var(--pump-grad-hot)', boxShadow: '0 4px 12px -4px rgba(255,0,128,0.6)' }}
          >
            <Plus className="w-5 h-5" />
          </div>
        </motion.button>

        {/* Recent Workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl tracking-wider text-gradient-vertical">
              RECENT
            </h2>
            {recentSessions.length > 0 && (
              <button
                onClick={onViewHistory}
                className="text-sm text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase"
              >
                View All
              </button>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session, index) => (
                <motion.button
                  key={session.id}
                  onClick={() => onViewSession(session)}
                  className="w-full text-left glass rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      session.type === 'gym'
                        ? 'bg-primary/20 group-hover:bg-primary/30 text-primary'
                        : 'bg-accent/20 group-hover:bg-accent/30 text-accent'
                    } transition-colors`}>
                      {session.type === 'gym' ? <Dumbbell className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{session.type}</span>
                        {!session.completed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.date)}
                        {session.endTime ? ` · ${formatDuration(session.startTime, session.endTime)}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      {session.type === 'gym' && session.exercises && (
                        <p className="text-sm font-medium text-primary">
                          {session.exercises.length} exercises
                        </p>
                      )}
                      {session.type === 'cardio' && session.cardio && (
                        <p className="text-sm font-medium text-accent">
                          {session.cardio.reduce((sum, c) => sum + (c.distance ?? 0), 0).toFixed(1)} mi
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* PRs Section */}
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="font-display text-2xl tracking-wider text-gradient-vertical mb-4">
              PERSONAL RECORDS
            </h2>
            <div className="glass rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto hide-scrollbar">
              {prs.slice(0, 8).map((pr, index) => (
                <motion.div
                  key={`${pr.exercise}-${pr.kind}`}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                >
                  <span className="text-sm font-medium truncate mr-4">{pr.exercise}</span>
                  <div className="flex items-center gap-2">
                    <span className="tag tag--pr">
                      {pr.weight}×{pr.reps}
                    </span>
                    <span
                      className="text-[9px] tracking-wider uppercase font-bold rounded-full px-1.5 py-0.5"
                      style={{
                        background: pr.kind === 'load' ? 'rgba(255,0,128,0.10)' : 'rgba(0,168,158,0.12)',
                        color: pr.kind === 'load' ? 'var(--pump-hot)' : 'var(--pump-cyan-deep)',
                      }}
                    >
                      {pr.kind}
                    </span>
                    <span className="text-[10px] tracking-wider text-muted-foreground">
                      {parseSessionDate(pr.achievedOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cloud Sync */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <CloudSyncCard sync={sync} />
        </motion.div>

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
      className={`glass rounded-xl p-4 text-center relative overflow-hidden group ${
        accent ? 'border-accent/30' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay * 0.1 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
    >
      <motion.p
        className={`font-display text-4xl tracking-wide ${
          accent ? 'text-accent text-glow-hot' : 'text-primary text-glow-neon'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + delay * 0.1 }}
      >
        {value}
      </motion.p>
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mt-1">
        {label}
      </p>

      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
        accent
          ? 'bg-gradient-to-t from-accent/10 to-transparent'
          : 'bg-gradient-to-t from-primary/10 to-transparent'
      }`} />
    </motion.div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <motion.div
      className="glass rounded-xl p-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center"
        animate={{
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <Dumbbell className="w-10 h-10 text-primary" />
      </motion.div>
      <p className="font-display text-xl tracking-wider text-muted-foreground">
        NO WORKOUTS YET
      </p>
      <p className="text-sm text-muted-foreground/60 mt-2">
        Start your first workout above
      </p>
    </motion.div>
  );
}

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecentSessions, getWorkoutStats, getPRs } from '@/lib/storage';
import { WorkoutSession, TrainerPlan } from '@/lib/types';
import { PlanLoader } from './PlanLoader';

interface DashboardProps {
  onStartWorkout: () => void;
  onViewHistory: () => void;
  onViewSession: (session: WorkoutSession) => void;
  plan: TrainerPlan | null;
  onPlanLoaded: (plan: TrainerPlan) => void;
  onPlanCleared: () => void;
}

export function Dashboard({ onStartWorkout, onViewHistory, onViewSession, plan, onPlanLoaded, onPlanCleared }: DashboardProps) {
  const stats = useMemo(() => getWorkoutStats(), []);
  const recentSessions = useMemo(() => getRecentSessions(5), []);
  const prs = useMemo(() => getPRs(), []);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
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
    <div className="min-h-screen pb-24 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-50" />

      {/* Decorative glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 space-y-8">
        {/* Hero Header */}
        <motion.div
          className="text-center pt-8 pb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1
            className="font-display text-7xl md:text-8xl tracking-wider text-gradient"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            PUMP
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm tracking-[0.3em] uppercase mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Track. Lift. Conquer.
          </motion.p>
        </motion.div>

        {/* Plan Loader */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <PlanLoader
            currentPlan={plan}
            onPlanLoaded={onPlanLoaded}
            onPlanCleared={onPlanCleared}
          />
        </motion.div>

        {/* Start Workout CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Button
            onClick={onStartWorkout}
            className="w-full h-20 text-2xl font-display tracking-widest relative overflow-hidden group touch-target"
            size="lg"
          >
            <span className="relative z-10">START WORKOUT</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 glow-neon opacity-50 group-hover:opacity-100 transition-opacity" />
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
                        {formatDate(session.date)} · {formatDuration(session.startTime, session.endTime)}
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
                          {session.cardio.reduce((sum, c) => sum + c.distance, 0).toFixed(1)} mi
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
                  key={pr.exerciseName}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                >
                  <span className="text-sm font-medium truncate mr-4">{pr.exerciseName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary font-bold">
                      {pr.weight}×{pr.reps}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  value,
  label,
  accent = false,
  delay = 0
}: {
  value: string | number;
  label: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      className={`glass rounded-xl p-4 text-center relative overflow-hidden group ${
        accent ? 'border-accent/30' : ''
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + delay * 0.1 }}
      whileHover={{ scale: 1.05 }}
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

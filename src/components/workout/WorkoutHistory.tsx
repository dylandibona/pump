'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Activity, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWorkoutData, deleteSession, getPlan, isWorkingSet } from '@/lib/storage';
import { WorkoutSession } from '@/lib/types';
import { parseSessionDate, sessionLabel } from '@/lib/utils';

interface WorkoutHistoryProps {
  onBack: () => void;
  onViewSession: (session: WorkoutSession) => void;
}

export function WorkoutHistory({ onBack, onViewSession }: WorkoutHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'gym' | 'cardio'>('all');
  const data = useMemo(() => getWorkoutData(), []);
  const plan = useMemo(() => getPlan(), []);
  const [sessions, setSessions] = useState(data.sessions);

  const filteredSessions = useMemo(() => {
    const filtered = filter === 'all'
      ? sessions
      : sessions.filter((s) => s.type === filter);

    return [...filtered].sort(
      (a, b) => parseSessionDate(b.date).getTime() - parseSessionDate(a.date).getTime()
    );
  }, [sessions, filter]);

  // Group by month
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: WorkoutSession[] } = {};

    filteredSessions.forEach((session) => {
      const date = parseSessionDate(session.date);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(session);
    });

    return groups;
  }, [filteredSessions]);

  const handleDelete = (sessionId: string) => {
    if (confirm('Delete this workout?')) {
      deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  };

  const formatDate = (dateStr: string): string => {
    return parseSessionDate(dateStr).toLocaleDateString('en-US', {
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

  const thisMonthCount = filteredSessions.filter((s) => {
    // Use parseSessionDate to avoid the UTC-rolling bug: raw `new Date('2026-04-30')`
    // parses as UTC midnight, which shifts to Apr 29 in west-of-UTC timezones and
    // attributes last-of-month sessions to the previous month (review N1).
    const date = parseSessionDate(s.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  // Topline totals for the header banner (respect the active filter).
  const totalVolume = useMemo(
    () =>
      filteredSessions.reduce(
        (sum, s) =>
          sum +
          (s.exercises?.reduce(
            (v, ex) => v + ex.sets.filter(isWorkingSet).reduce((a, set) => a + set.weight * set.reps, 0),
            0,
          ) ?? 0),
        0,
      ),
    [filteredSessions],
  );
  const totalDistance = useMemo(
    () => filteredSessions.reduce((sum, s) => sum + (s.cardio?.reduce((d, c) => d + (c.distance ?? 0), 0) ?? 0), 0),
    [filteredSessions],
  );
  const fmtVol = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`);
  // Third stat adapts to the filter: cardio → miles, otherwise → lbs moved.
  const thirdStat =
    filter === 'cardio'
      ? { value: totalDistance > 0 ? totalDistance.toFixed(1) : '—', label: 'Miles' }
      : { value: totalVolume > 0 ? fmtVol(totalVolume) : '—', label: 'Lbs Moved' };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header banner — repurposes the calm beach scene (formerly only on the
            first-run empty state) as the History hero, with the topline totals
            overlaid. Full-bleed within the column; filter-aware stats. */}
        <motion.div
          className="-mx-4 relative h-[172px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Image src="/pump-scene-beach.png" alt="" fill priority className="object-cover" style={{ objectPosition: 'center 35%' }} />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(10,0,32,0.15) 0%, rgba(10,0,32,0.0) 35%, rgba(10,0,32,0.0) 50%, rgba(10,0,32,0.72) 100%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
            <p
              className="text-[10px] tracking-[0.35em] uppercase font-bold mb-2"
              style={{ color: 'rgba(0,255,238,0.95)', textShadow: '0 0 12px rgba(0,255,238,0.55)' }}
            >
              Your training
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: filteredSessions.length, label: 'Workouts' },
                { value: thisMonthCount, label: 'This Month' },
                { value: thirdStat.value, label: thirdStat.label },
              ].map((s) => (
                <div key={s.label}>
                  <p
                    className="font-display text-3xl tabular-nums text-white leading-none"
                    style={{ textShadow: '0 2px 12px rgba(10,0,32,0.6)' }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[9px] tracking-[0.18em] uppercase font-bold mt-1 text-white/80">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex gap-2 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {(['all', 'gym', 'cardio'] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              onClick={() => setFilter(type)}
              className={`font-display tracking-wider ${
                filter === type
                  ? type === 'gym'
                    ? 'bg-primary text-primary-foreground'
                    : type === 'cardio'
                    ? 'bg-accent text-accent-foreground'
                    : ''
                  : ''
              }`}
            >
              {type.toUpperCase()}
            </Button>
          ))}
        </motion.div>

        {/* Sessions List */}
        <AnimatePresence mode="wait">
          {filteredSessions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/20 flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Inbox className="w-10 h-10 text-muted-foreground" />
              </motion.div>
              <p className="font-display text-xl tracking-[0.18em] uppercase" style={{ color: 'var(--pump-text-mid)' }}>
                No workouts found
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Time to start lifting!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Object.entries(groupedSessions).map(([month, monthSessions], groupIndex) => (
                <motion.div
                  key={month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + groupIndex * 0.1 }}
                >
                  <h2 className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                    {month.toUpperCase()}
                  </h2>
                  <div className="space-y-2">
                    {monthSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + groupIndex * 0.1 + index * 0.05 }}
                      >
                        <motion.button
                          onClick={() => onViewSession(session)}
                          className="w-full text-left rounded-2xl p-3 transition-all"
                          style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)' }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${
                                session.type === 'gym'
                                  ? 'text-[color:var(--pump-hot)]'
                                  : 'text-[color:var(--pump-cyan-deep)]'
                              }`}
                                style={{ background: session.type === 'gym' ? 'rgba(255,0,128,0.08)' : 'rgba(0,168,158,0.10)' }}>
                                {session.type === 'gym' ? <Dumbbell className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-semibold" style={{ color: 'var(--pump-text)' }}>
                                  {sessionLabel(session, plan)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--pump-text-dim)' }}>
                                  {formatDate(session.date)}
                                  {session.endTime ? ` · ${formatDuration(session.startTime, session.endTime)}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {session.type === 'gym' && session.exercises && (
                                <p className="text-sm tabular-nums" style={{ color: 'var(--pump-text-mid)' }}>
                                  {session.exercises.length} exercises
                                </p>
                              )}
                              {session.type === 'cardio' && session.cardio && (
                                <p className="text-sm tabular-nums" style={{ color: 'var(--pump-cyan-deep)' }}>
                                  {session.cardio.reduce((sum, c) => sum + (c.distance ?? 0), 0).toFixed(2)} mi
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Exercise preview badges */}
                          {session.type === 'gym' && session.exercises && session.exercises.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 ml-[52px]">
                              {session.exercises.slice(0, 4).map((ex) => (
                                <span key={ex.id} className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{ background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)' }}>
                                  {ex.name}
                                </span>
                              ))}
                              {session.exercises.length > 4 && (
                                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                                  style={{ background: 'transparent', color: 'var(--pump-text-dim)', border: '1px solid var(--pump-border-card)' }}>
                                  +{session.exercises.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </motion.button>

                        {/* Delete — demoted to a tiny low-contrast affordance so a
                            mis-tap can't easily nuke a session. */}
                        <div className="flex justify-end mt-1 pr-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(session.id);
                            }}
                            className="text-[10px] tracking-[0.18em] uppercase font-semibold px-2 py-1 rounded-md transition-colors"
                            style={{ color: 'var(--pump-text-dim)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

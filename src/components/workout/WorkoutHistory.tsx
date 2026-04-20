'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Activity, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWorkoutData, deleteSession } from '@/lib/storage';
import { WorkoutSession } from '@/lib/types';
import { parseSessionDate } from '@/lib/utils';

interface WorkoutHistoryProps {
  onBack: () => void;
  onViewSession: (session: WorkoutSession) => void;
}

export function WorkoutHistory({ onBack, onViewSession }: WorkoutHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'gym' | 'cardio'>('all');
  const data = useMemo(() => getWorkoutData(), []);
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

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />

      <div className="relative z-10 space-y-6">
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

        {/* Stats Summary */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-xl p-4 text-center">
            <p className="font-display text-4xl text-primary text-glow-neon">
              {filteredSessions.length}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Workouts
            </p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="font-display text-4xl text-accent text-glow-hot">
              {thisMonthCount}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              This Month
            </p>
          </div>
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
              <p className="font-display text-2xl tracking-wider text-muted-foreground">
                NO WORKOUTS FOUND
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
                          className="w-full text-left glass rounded-xl p-4 hover:border-primary/30 transition-all group"
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <motion.div
                                className={`w-12 h-12 flex items-center justify-center rounded-xl ${
                                  session.type === 'gym'
                                    ? 'bg-primary/20 group-hover:bg-primary/30 text-primary'
                                    : 'bg-accent/20 group-hover:bg-accent/30 text-accent'
                                } transition-colors`}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                              >
                                {session.type === 'gym' ? <Dumbbell className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                              </motion.div>
                              <div>
                                <p className="font-display text-xl tracking-wider">
                                  {session.type.toUpperCase()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(session.date)} · {formatDuration(session.startTime, session.endTime)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {session.type === 'gym' && session.exercises && (
                                <p className="font-mono text-primary">
                                  {session.exercises.length} exercises
                                </p>
                              )}
                              {session.type === 'cardio' && session.cardio && (
                                <p className="font-mono text-accent">
                                  {session.cardio.reduce((sum, c) => sum + (c.distance ?? 0), 0).toFixed(2)} mi
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Exercise preview badges */}
                          {session.type === 'gym' && session.exercises && session.exercises.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3 ml-16">
                              {session.exercises.slice(0, 4).map((ex) => (
                                <Badge
                                  key={ex.id}
                                  variant="secondary"
                                  className="text-xs bg-secondary/50"
                                >
                                  {ex.name}
                                </Badge>
                              ))}
                              {session.exercises.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{session.exercises.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                        </motion.button>

                        <div className="flex justify-end mt-1 pr-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(session.id);
                            }}
                            className="text-destructive text-xs hover:bg-destructive/10"
                          >
                            Delete
                          </Button>
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

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Timer as TimerIcon, Dumbbell, Activity } from 'lucide-react';
import { Dashboard } from '@/components/workout/Dashboard';
import { SessionStart } from '@/components/workout/SessionStart';
import { GymWorkout } from '@/components/workout/GymWorkout';
import { CardioWorkout } from '@/components/workout/CardioWorkout';
import { SessionSummary } from '@/components/workout/SessionSummary';
import { WorkoutHistory } from '@/components/workout/WorkoutHistory';
import { Timer } from '@/components/workout/Timer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WorkoutSession, WorkoutType } from '@/lib/types';
import { useWorkout } from '@/hooks/useWorkout';

type View = 'dashboard' | 'start' | 'gym' | 'cardio' | 'summary' | 'history' | 'session-detail';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  const { session, startSession, newPRs, clearNewPRs } = useWorkout({
    sessionId: activeSessionId || undefined,
  });

  const handleStartWorkout = useCallback((type: WorkoutType, date: string) => {
    const newSession = startSession(type, date);
    setActiveSessionId(newSession.id);
    setView(type === 'gym' ? 'gym' : 'cardio');
  }, [startSession]);

  const handleWorkoutComplete = useCallback(() => {
    setView('summary');
  }, []);

  const handleCloseSummary = useCallback(() => {
    setActiveSessionId(null);
    clearNewPRs();
    setView('dashboard');
  }, [clearNewPRs]);

  const handleViewSession = useCallback((session: WorkoutSession) => {
    setViewingSession(session);
    setView('session-detail');
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'start') {
      setView('dashboard');
    } else if (view === 'gym' || view === 'cardio') {
      if (confirm('Leave current workout? Your progress is saved.')) {
        setActiveSessionId(null);
        setView('dashboard');
      }
    } else if (view === 'history' || view === 'session-detail') {
      setViewingSession(null);
      setView(view === 'session-detail' ? 'history' : 'dashboard');
    } else {
      setView('dashboard');
    }
  }, [view]);

  const getViewTitle = () => {
    switch (view) {
      case 'start': return 'NEW WORKOUT';
      case 'gym': return 'GYM SESSION';
      case 'cardio': return 'CARDIO SESSION';
      case 'history': return 'HISTORY';
      case 'session-detail': return 'SESSION';
      default: return '';
    }
  };

  return (
    <main className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="max-w-lg mx-auto px-4 py-6 relative z-10">
        {/* Navigation Bar */}
        <AnimatePresence mode="wait">
          {view !== 'dashboard' && view !== 'summary' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between mb-6"
            >
              <motion.button
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5 group-hover:text-primary transition-colors" />
                <span className="font-display tracking-wider">BACK</span>
              </motion.button>

              <motion.h1
                className="font-display text-xl tracking-wider text-gradient"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {getViewTitle()}
              </motion.h1>

              <Sheet open={showTimer} onOpenChange={setShowTimer}>
                <SheetTrigger
                  render={
                    <motion.button
                      className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-primary/20 hover:scale-105 transition-all text-primary"
                      whileTap={{ scale: 0.95 }}
                    />
                  }
                >
                  <TimerIcon className="w-5 h-5" />
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] glass-strong border-t-2 border-primary/30">
                  <SheetHeader>
                    <SheetTitle className="font-display text-3xl tracking-wider text-gradient text-center">
                      TIMER
                    </SheetTitle>
                  </SheetHeader>
                  <Timer className="mt-6" />
                </SheetContent>
              </Sheet>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content with View Transitions */}
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard
                onStartWorkout={() => setView('start')}
                onViewHistory={() => setView('history')}
                onViewSession={handleViewSession}
              />
            </motion.div>
          )}

          {view === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SessionStart onStart={handleStartWorkout} />
            </motion.div>
          )}

          {view === 'gym' && activeSessionId && (
            <motion.div
              key="gym"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GymWorkout
                sessionId={activeSessionId}
                onComplete={handleWorkoutComplete}
              />
            </motion.div>
          )}

          {view === 'cardio' && activeSessionId && (
            <motion.div
              key="cardio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CardioWorkout
                sessionId={activeSessionId}
                onComplete={handleWorkoutComplete}
              />
            </motion.div>
          )}

          {view === 'summary' && session && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <SessionSummary
                session={session}
                onClose={handleCloseSummary}
                newPRs={newPRs}
              />
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WorkoutHistory
                onBack={() => setView('dashboard')}
                onViewSession={handleViewSession}
              />
            </motion.div>
          )}

          {view === 'session-detail' && viewingSession && (
            <motion.div
              key="session-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SessionDetailView
                session={viewingSession}
                onBack={() => {
                  setViewingSession(null);
                  setView('history');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// Session Detail View Component
function SessionDetailView({
  session,
  onBack,
}: {
  session: WorkoutSession;
  onBack: () => void;
}) {
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 mx-auto ${
            isGym ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {isGym ? <Dumbbell className="w-10 h-10" /> : <Activity className="w-10 h-10" />}
        </motion.div>
        <h1 className={`font-display text-4xl tracking-wider ${
          isGym ? 'text-primary text-glow-neon' : 'text-accent text-glow-hot'
        }`}>
          {session.type.toUpperCase()} WORKOUT
        </h1>
        <p className="text-muted-foreground mt-2">{formatDate(session.date)}</p>
      </motion.div>

      {/* Gym Exercises */}
      {session.type === 'gym' && session.exercises && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {session.exercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              className="glass rounded-xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <h3 className="font-display text-xl tracking-wider text-foreground mb-3">
                {exercise.name.toUpperCase()}
              </h3>
              <div className="space-y-2">
                {exercise.sets.map((set, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                      set.isWarmup ? 'bg-secondary/20 text-muted-foreground' : 'bg-secondary/40'
                    }`}
                  >
                    <span className="font-display">
                      {set.isWarmup ? 'WARMUP' : `SET ${i + 1}`}
                    </span>
                    <span className="font-mono text-primary">
                      {set.weight} lbs × {set.reps}
                    </span>
                  </div>
                ))}
              </div>
              {exercise.notes && (
                <p className="text-sm text-muted-foreground mt-3 italic border-l-2 border-primary/30 pl-3">
                  {exercise.notes}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Cardio Activities */}
      {session.type === 'cardio' && session.cardio && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {session.cardio.map((entry, index) => (
            <motion.div
              key={entry.id}
              className="glass rounded-xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl tracking-wider capitalize">
                  {entry.activity}
                </h3>
                <span className="font-display text-2xl text-accent text-glow-hot">
                  {entry.distance} mi
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-mono">{formatTime(entry.duration)}</span>
                <span className="mx-2">·</span>
                <span className="font-mono text-accent">
                  {Math.floor(entry.duration / entry.distance / 60)}:
                  {Math.round((entry.duration / entry.distance) % 60).toString().padStart(2, '0')}/mi
                </span>
              </p>
              {entry.notes && (
                <p className="text-sm text-muted-foreground mt-3 italic border-l-2 border-accent/30 pl-3">
                  {entry.notes}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Session Notes */}
      {session.notes && (
        <motion.div
          className="glass rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-display text-lg tracking-wider text-muted-foreground mb-2">
            NOTES
          </h3>
          <p className="text-foreground">{session.notes}</p>
        </motion.div>
      )}

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full h-14 font-display text-lg tracking-wider hover:border-primary/50 transition-all"
        >
          BACK TO HISTORY
        </Button>
      </motion.div>
    </div>
  );
}

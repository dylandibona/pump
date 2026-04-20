'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Timer as TimerIcon, Dumbbell, Activity, Pencil, Send, Check } from 'lucide-react';
import { Dashboard } from '@/components/workout/Dashboard';
import { SessionStart } from '@/components/workout/SessionStart';
import { GymWorkout } from '@/components/workout/GymWorkout';
import { CardioWorkout } from '@/components/workout/CardioWorkout';
import { SessionPreview } from '@/components/workout/SessionPreview';
import { SessionSummary } from '@/components/workout/SessionSummary';
import { WorkoutHistory } from '@/components/workout/WorkoutHistory';
import { BottomTabBar, TabKey } from '@/components/workout/BottomTabBar';
import { Timer } from '@/components/workout/Timer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WorkoutSession, WorkoutType, TrainerPlan, PlanSession } from '@/lib/types';
import { useWorkout } from '@/hooks/useWorkout';
import { getSession, getPlan, getNextPlanSession, getPRs } from '@/lib/storage';
import { generateBrief } from '@/lib/brief';
import { parseSessionDate } from '@/lib/utils';
import { PlanLoader } from '@/components/workout/PlanLoader';

type View = 'dashboard' | 'start' | 'preview' | 'gym' | 'cardio' | 'summary' | 'history' | 'plan' | 'session-detail';

// Views that are "root tabs" — the tab bar highlights one of them and is shown.
// Other views (start, preview, gym, cardio, summary, session-detail) are
// workflow/drill-down screens where the tab bar is hidden.
function activeTab(view: View): TabKey | null {
  if (view === 'dashboard' || view === 'start') return 'workout';
  if (view === 'history') return 'history';
  if (view === 'plan') return 'plan';
  return null;
}

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [plan, setPlan] = useState<TrainerPlan | null>(() => getPlan());
  const [activePlanSession, setActivePlanSession] = useState<PlanSession | null>(null);
  const [showSessionBrief, setShowSessionBrief] = useState(false);
  const [sessionBriefText, setSessionBriefText] = useState('');
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<{ planSession: PlanSession; date: string } | null>(null);

  const { session, startSession, newPRs, newBaselines, clearNewPRs } = useWorkout({
    sessionId: activeSessionId || undefined,
  });

  const suggestedSessionId = plan ? getNextPlanSession(plan) : null;

  const handleStartWorkout = useCallback((type: WorkoutType, date: string, planSession?: PlanSession) => {
    // Persist planSession.id onto the WorkoutSession so plan rotation can
    // match deterministically next time (review M6). Free-form (non-plan)
    // sessions pass undefined and stay untagged.
    const newSession = startSession(type, date, planSession?.id);
    setActiveSessionId(newSession.id);
    setActivePlanSession(planSession ?? null);
    setView(type === 'gym' ? 'gym' : 'cardio');
  }, [startSession]);

  const handleOpenPreview = useCallback((planSession: PlanSession, date: string) => {
    setPendingPreview({ planSession, date });
    setView('preview');
  }, []);

  const handleStartFromPreview = useCallback((adjusted: PlanSession) => {
    if (!pendingPreview) return;
    handleStartWorkout('gym', pendingPreview.date, adjusted);
    setPendingPreview(null);
  }, [pendingPreview, handleStartWorkout]);

  const handleCancelPreview = useCallback(() => {
    setPendingPreview(null);
    setView('start');
  }, []);

  const handleWorkoutComplete = useCallback(() => {
    if (isEditingExisting && viewingSession) {
      if (!activeSessionId) return;
      // Reload the updated session from storage, return to session detail
      const updated = getSession(activeSessionId);
      if (updated) setViewingSession(updated);
      setActiveSessionId(null);
      setIsEditingExisting(false);
      setView('session-detail');
    } else {
      setView('summary');
    }
  }, [isEditingExisting, viewingSession, activeSessionId]);

  const handleCloseSummary = useCallback(() => {
    setActiveSessionId(null);
    clearNewPRs();
    setView('dashboard');
  }, [clearNewPRs]);

  const handleViewSession = useCallback((session: WorkoutSession) => {
    setViewingSession(session);
    setShowSessionBrief(false);
    setSessionBriefText('');
    setView('session-detail');
  }, []);

  const handleEditSession = useCallback((session: WorkoutSession) => {
    setActiveSessionId(session.id);
    setActivePlanSession(null);
    setIsEditingExisting(true);
    setView(session.type === 'gym' ? 'gym' : 'cardio');
  }, []);

  const handleCopySessionBrief = useCallback((session: WorkoutSession) => {
    const plan = getPlan();
    const brief = generateBrief(session, plan, []);
    setSessionBriefText(brief);
    setShowSessionBrief(true);
    navigator.clipboard.writeText(brief).catch(() => {});
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'start') {
      setView('dashboard');
    } else if (view === 'preview') {
      setPendingPreview(null);
      setView('start');
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

  const handleTabChange = useCallback((tab: TabKey) => {
    if (tab === 'workout') setView('dashboard');
    else if (tab === 'history') setView('history');
    else if (tab === 'plan') setView('plan');
  }, []);

  const getViewTitle = () => {
    switch (view) {
      case 'start': return 'New Workout';
      case 'preview': return 'SESSION PREVIEW';
      case 'gym': return 'GYM SESSION';
      case 'cardio': return 'CARDIO SESSION';
      case 'history': return 'History';
      case 'plan': return 'Plan';
      case 'session-detail': return 'SESSION';
      default: return '';
    }
  };

  // These views carry their title in the nav bar using Pacifico script.
  // Workflow views deep inside a session (preview/gym/cardio/session-detail)
  // keep the Outfit 800 uppercase treatment.
  const isScriptTitle = view === 'plan' || view === 'history' || view === 'start';

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
                className={
                  isScriptTitle
                    ? 'text-3xl text-[color:var(--pump-hot)] text-glow-hot'
                    : 'font-display text-xl tracking-wider text-gradient'
                }
                style={isScriptTitle ? { fontFamily: 'var(--font-pacifico), cursive' } : undefined}
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
                onOpenPlan={() => setView('plan')}
                plan={plan}
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
              <SessionStart
                onStart={handleStartWorkout}
                onPreview={handleOpenPreview}
                plan={plan}
                suggestedSessionId={suggestedSessionId}
              />
            </motion.div>
          )}

          {view === 'preview' && pendingPreview && plan && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SessionPreview
                plan={plan}
                planSession={pendingPreview.planSession}
                onStart={handleStartFromPreview}
                onCancel={handleCancelPreview}
              />
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
                planSession={activePlanSession}
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

          {view === 'summary' && activeSessionId && (getSession(activeSessionId) || session) && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <SessionSummary
                session={(activeSessionId ? getSession(activeSessionId) : null) ?? session!}
                onClose={handleCloseSummary}
                newPRs={newPRs}
                newBaselines={newBaselines}
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

          {view === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PlanView
                plan={plan}
                onPlanLoaded={(p) => setPlan(p)}
                onPlanCleared={() => setPlan(null)}
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
                onEdit={() => handleEditSession(viewingSession)}
                onCopyBrief={() => handleCopySessionBrief(viewingSession)}
                showBrief={showSessionBrief}
                brief={sessionBriefText}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent bottom tab bar on root views only */}
      {activeTab(view) && (
        <BottomTabBar active={activeTab(view)!} onChange={handleTabChange} />
      )}
    </main>
  );
}

// Plan View — dedicated tab for managing the TrainerPlan JSON
function PlanView({
  plan,
  onPlanLoaded,
  onPlanCleared,
}: {
  plan: TrainerPlan | null;
  onPlanLoaded: (plan: TrainerPlan) => void;
  onPlanCleared: () => void;
}) {
  return (
    <div className="space-y-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PlanLoader
          currentPlan={plan}
          onPlanLoaded={onPlanLoaded}
          onPlanCleared={onPlanCleared}
        />
      </motion.div>
    </div>
  );
}

// Session Detail View Component
function SessionDetailView({
  session,
  onBack,
  onEdit,
  onCopyBrief,
  showBrief,
  brief,
}: {
  session: WorkoutSession;
  onBack: () => void;
  onEdit: () => void;
  onCopyBrief: () => void;
  showBrief: boolean;
  brief: string;
}) {
  const [copied, setCopied] = useState(false);
  const briefRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    onCopyBrief();
    setTimeout(() => briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const formatDate = (dateStr: string): string => {
    return parseSessionDate(dateStr).toLocaleDateString('en-US', {
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
                  {entry.distance != null ? `${entry.distance} mi` : entry.duration != null ? `${Math.floor(entry.duration / 60)}m` : '—'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-mono">{entry.duration != null ? formatTime(entry.duration) : '—'}</span>
                {entry.distance != null && entry.duration != null && (
                  <>
                    <span className="mx-2">·</span>
                    <span className="font-mono text-accent">
                      {Math.floor(entry.duration / entry.distance / 60)}:
                      {Math.round((entry.duration / entry.distance) % 60).toString().padStart(2, '0')}/mi
                    </span>
                  </>
                )}
                {entry.incline != null && <span className="font-mono text-muted-foreground">{entry.incline}% incline</span>}
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
        transition={{ delay: 0.45 }}
      >
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full h-14 font-display text-lg tracking-wider hover:border-primary/50 transition-all"
        >
          BACK TO HISTORY
        </Button>
      </motion.div>

      {/* Edit Session */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onEdit}
          variant="outline"
          className="w-full h-14 font-display text-lg tracking-widest border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Pencil className="w-5 h-5 mr-2" />
          EDIT SESSION
        </Button>
      </motion.div>

      {/* Copy Brief for Trainer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="space-y-3"
      >
        <Button
          onClick={handleCopy}
          variant="outline"
          className="w-full h-14 font-display text-lg tracking-widest border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 mr-2 text-primary" />
              COPIED! PASTE INTO HEALTH PROJECT
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              COPY WORKOUT SUMMARY FOR TRAINER
            </>
          )}
        </Button>
        {showBrief && (
          <div ref={briefRef} className="glass rounded-2xl p-4 space-y-2">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              YOUR BRIEF — paste into Health Project
            </p>
            <textarea
              readOnly
              value={brief}
              className="w-full min-h-[200px] bg-background/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-foreground resize-none focus:outline-none focus:border-primary/50"
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}

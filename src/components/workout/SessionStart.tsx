'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Activity, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkoutType, TrainerPlan, PlanSession } from '@/lib/types';

interface SessionStartProps {
  onStart: (type: WorkoutType, date: string, planSession?: PlanSession) => void;
  plan: TrainerPlan | null;
  suggestedSessionId: string | null;
}

export function SessionStart({ onStart, plan, suggestedSessionId }: SessionStartProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const formatDate = (date: Date): string => date.toISOString().split('T')[0];

  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return 'TODAY';
    if (isYesterday) return 'YESTERDAY';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  };

  const suggestedSession = plan?.sessions.find(s => s.id === suggestedSessionId) ?? plan?.sessions[0] ?? null;

  return (
    <div className="min-h-[80vh] flex flex-col relative">
      <motion.div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: hoveredType
            ? `radial-gradient(ellipse at center, oklch(0.85 0.25 125 / 0.12) 0%, transparent 60%)`
            : 'none'
        }}
        animate={{ opacity: hoveredType ? 1 : 0 }}
      />

      <div className="relative z-10 flex flex-col h-full space-y-6">
        {/* Date Selection */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-3">WORKOUT DATE</p>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger
              render={<button className="w-full glass p-4 flex items-center justify-between group hover:border-primary/30 transition-all" />}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display text-2xl tracking-wider text-primary">{formatDisplayDate(date)}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass border-primary/20" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) { setDate(d); setShowCalendar(false); } }}
                disabled={(d) => d > new Date()}
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2 mt-3">
            <Button
              variant={date.toDateString() === new Date().toDateString() ? 'default' : 'outline'}
              size="sm" onClick={() => setDate(new Date())}
              className="font-display tracking-wider"
            >TODAY</Button>
            <Button
              variant={(() => { const y = new Date(); y.setDate(y.getDate() - 1); return date.toDateString() === y.toDateString() ? 'default' : 'outline'; })()}
              size="sm"
              onClick={() => { const y = new Date(); y.setDate(y.getDate() - 1); setDate(y); }}
              className="font-display tracking-wider"
            >YESTERDAY</Button>
          </div>
        </motion.div>

        {/* Plan Sessions — shown when a plan is loaded */}
        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-3">
                FROM YOUR PLAN — {plan.name.toUpperCase()}
              </p>
              <div className="space-y-2">
                {plan.sessions.map((session) => {
                  const isSuggested = session.id === suggestedSession?.id;
                  return (
                    <motion.button
                      key={session.id}
                      onClick={() => onStart('gym', formatDate(date), session)}
                      onHoverStart={() => setHoveredType(session.id)}
                      onHoverEnd={() => setHoveredType(null)}
                      className={`relative w-full glass p-4 text-left group transition-all overflow-hidden ${
                        isSuggested ? 'border-l-2 border-primary/60' : 'border-l-2 border-transparent hover:border-primary/30'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-xl tracking-wider text-foreground group-hover:text-primary transition-colors">
                              {session.name.toUpperCase()}
                            </span>
                            {isSuggested && (
                              <span className="text-xs font-display tracking-wider text-primary/70 bg-primary/10 px-2 py-0.5">
                                NEXT UP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.exercises.slice(0, 4).map(e => e.name).join(' · ')}
                            {session.exercises.length > 4 ? ` +${session.exercises.length - 4}` : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Free-form options */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: plan ? 0.3 : 0.2 }}>
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-3">
            {plan ? 'OR START FREE-FORM' : 'SELECT WORKOUT TYPE'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => onStart('gym', formatDate(date))}
              onHoverStart={() => setHoveredType('gym')}
              onHoverEnd={() => setHoveredType(null)}
              className="relative glass p-5 overflow-hidden group text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div
                  className="w-12 h-12 bg-primary/20 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Dumbbell className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="font-display text-2xl tracking-wider text-primary">GYM</h3>
                <p className="text-muted-foreground text-xs mt-1">Weights & strength</p>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 transition-colors" />
            </motion.button>

            <motion.button
              onClick={() => onStart('cardio', formatDate(date))}
              onHoverStart={() => setHoveredType('cardio')}
              onHoverEnd={() => setHoveredType(null)}
              className="relative glass p-5 overflow-hidden group text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div
                  className="w-12 h-12 bg-accent/20 flex items-center justify-center mb-3"
                  whileHover={{ scale: 1.2, x: 8 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Activity className="w-6 h-6 text-accent" />
                </motion.div>
                <h3 className="font-display text-2xl tracking-wider text-accent">CARDIO</h3>
                <p className="text-muted-foreground text-xs mt-1">Run, bike & more</p>
              </div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/50 transition-colors" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

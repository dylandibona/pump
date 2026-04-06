'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Activity, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkoutType } from '@/lib/types';

interface SessionStartProps {
  onStart: (type: WorkoutType, date: string) => void;
}

export function SessionStart({ onStart }: SessionStartProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [hoveredType, setHoveredType] = useState<WorkoutType | null>(null);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date): string => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'TODAY';
    if (isYesterday) return 'YESTERDAY';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  };

  const handleStart = (type: WorkoutType) => {
    onStart(type, formatDate(date));
  };

  return (
    <div className="min-h-[80vh] flex flex-col relative">
      {/* Background glow based on hovered type */}
      <motion.div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: hoveredType === 'gym'
            ? 'radial-gradient(ellipse at center, oklch(0.85 0.25 125 / 0.15) 0%, transparent 60%)'
            : hoveredType === 'cardio'
            ? 'radial-gradient(ellipse at center, oklch(0.7 0.25 350 / 0.15) 0%, transparent 60%)'
            : 'none'
        }}
        animate={{ opacity: hoveredType ? 1 : 0 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Date Selection */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-3">
            WORKOUT DATE
          </p>

          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger
              render={
                <button className="w-full glass rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all" />
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display text-2xl tracking-wider text-primary">
                  {formatDisplayDate(date)}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass border-primary/20" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setShowCalendar(false);
                  }
                }}
                disabled={(d) => d > new Date()}
              />
            </PopoverContent>
          </Popover>

          {/* Quick date buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={date.toDateString() === new Date().toDateString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDate(new Date())}
              className="font-display tracking-wider"
            >
              TODAY
            </Button>
            <Button
              variant={(() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return date.toDateString() === yesterday.toDateString() ? 'default' : 'outline';
              })()}
              size="sm"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setDate(yesterday);
              }}
              className="font-display tracking-wider"
            >
              YESTERDAY
            </Button>
          </div>
        </motion.div>

        {/* Workout Type Selection */}
        <motion.div
          className="flex-1 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-4">
            SELECT WORKOUT TYPE
          </p>

          <div className="flex-1 grid grid-rows-2 gap-4">
            {/* Gym Card */}
            <motion.button
              onClick={() => handleStart('gym')}
              onHoverStart={() => setHoveredType('gym')}
              onHoverEnd={() => setHoveredType(null)}
              className="relative glass rounded-2xl p-6 overflow-hidden group text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.2, rotate: -10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Dumbbell className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="font-display text-4xl tracking-wider text-primary group-hover:text-glow-neon transition-all">
                    GYM
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Weights, machines & strength training
                  </p>
                </div>

                <div className="flex items-center gap-2 text-primary/70 group-hover:text-primary transition-colors">
                  <span className="text-sm font-medium">Start lifting</span>
                  <motion.div animate={{ x: hoveredType === 'gym' ? 4 : 0 }}>
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </div>

              {/* Border glow on hover */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition-colors" />
            </motion.button>

            {/* Cardio Card */}
            <motion.button
              onClick={() => handleStart('cardio')}
              onHoverStart={() => setHoveredType('cardio')}
              onHoverEnd={() => setHoveredType(null)}
              className="relative glass rounded-2xl p-6 overflow-hidden group text-left"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-all" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.2, x: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Activity className="w-8 h-8 text-accent" />
                  </motion.div>
                  <h3 className="font-display text-4xl tracking-wider text-accent group-hover:text-glow-hot transition-all">
                    CARDIO
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Run, bike, swim & endurance
                  </p>
                </div>

                <div className="flex items-center gap-2 text-accent/70 group-hover:text-accent transition-colors">
                  <span className="text-sm font-medium">Start moving</span>
                  <motion.div animate={{ x: hoveredType === 'cardio' ? 4 : 0 }}>
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </div>

              {/* Border glow on hover */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-accent/50 transition-colors" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

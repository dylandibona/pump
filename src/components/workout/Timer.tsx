'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer as TimerIcon, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimer } from '@/hooks/useTimer';

interface TimerProps {
  onComplete?: () => void;
  className?: string;
}

const PRESET_TIMES = [
  { label: '30s', seconds: 30 },
  { label: '45s', seconds: 45 },
  { label: '1m', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
];

export function Timer({ onComplete, className }: TimerProps) {
  const [mode, setMode] = useState<'countdown' | 'countup'>('countdown');
  const timer = useTimer({ onComplete, playSound: true, vibrate: true });

  const handlePresetClick = (seconds: number) => {
    timer.start(seconds, 'countdown');
  };

  const handleStopwatchStart = () => {
    timer.start(0, 'countup', 'Stopwatch');
  };

  const isUrgent = timer.isRunning && timer.mode === 'countdown' && timer.remaining <= 10;
  const progress = timer.mode === 'countdown' && timer.duration > 0
    ? (timer.remaining / timer.duration) * 100
    : 0;

  return (
    <motion.div
      className={`glass rounded-2xl p-6 relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Background glow effect */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isUrgent ? 'opacity-100' : timer.isRunning ? 'opacity-50' : 'opacity-0'
        }`}
        style={{
          background: isUrgent
            ? 'radial-gradient(ellipse at center, oklch(0.7 0.25 350 / 0.2) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, oklch(0.85 0.25 125 / 0.1) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10">
        {/* Timer Display */}
        <motion.div
          className="text-center mb-6"
          animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        >
          <motion.div
            className={`font-display text-8xl tracking-wider tabular-nums transition-colors ${
              isUrgent
                ? 'text-accent text-glow-hot'
                : timer.isRunning
                ? 'text-primary text-glow-neon'
                : 'text-foreground'
            }`}
            key={timer.formattedTime}
            initial={{ opacity: 0.8, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1 }}
          >
            {timer.formattedTime}
          </motion.div>

          {timer.label && (
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mt-2">
              {timer.label}
            </p>
          )}

          {/* Progress bar for countdown */}
          {timer.mode === 'countdown' && timer.isRunning && (
            <motion.div
              className="mt-4 h-1 bg-secondary/50 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className={`h-full transition-colors ${isUrgent ? 'bg-accent' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center gap-3 mb-6">
          <AnimatePresence mode="wait">
            {!timer.isRunning ? (
              <motion.div
                key="stopped-controls"
                className="flex gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {(timer.remaining > 0 || timer.mode === 'countup') && (
                  <Button
                    onClick={timer.resume}
                    className="touch-target px-10 font-display text-lg tracking-wider relative group"
                    size="lg"
                  >
                    <span className="relative z-10">
                      {timer.remaining === timer.duration && timer.mode === 'countdown' ? 'START' : 'RESUME'}
                    </span>
                    <div className="absolute inset-0 glow-neon opacity-0 group-hover:opacity-100 transition-opacity rounded-md" />
                  </Button>
                )}
                <Button
                  onClick={timer.reset}
                  variant="outline"
                  className="touch-target font-display tracking-wider"
                  size="lg"
                >
                  RESET
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="running-controls"
                className="flex gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button
                  onClick={timer.pause}
                  variant="secondary"
                  className="touch-target px-10 font-display text-lg tracking-wider"
                  size="lg"
                >
                  PAUSE
                </Button>
                {timer.mode === 'countdown' && (
                  <Button
                    onClick={() => timer.addTime(30)}
                    variant="outline"
                    className="touch-target font-display tracking-wider"
                    size="lg"
                  >
                    +30s
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={mode === 'countdown' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('countdown')}
            className="font-display tracking-wider"
          >
            COUNTDOWN
          </Button>
          <Button
            variant={mode === 'countup' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('countup');
              handleStopwatchStart();
            }}
            className="font-display tracking-wider"
          >
            STOPWATCH
          </Button>
        </div>

        {/* Presets (only for countdown mode) */}
        <AnimatePresence>
          {mode === 'countdown' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase text-center mb-3">
                QUICK START
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_TIMES.map((preset, index) => (
                  <motion.div
                    key={preset.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full touch-target font-display text-lg tracking-wider hover:border-primary/50 hover:bg-primary/10 transition-all"
                      onClick={() => handlePresetClick(preset.seconds)}
                    >
                      {preset.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Compact inline rest timer for between sets
interface RestTimerInlineProps {
  defaultDuration?: number;
  onComplete?: () => void;
}

export function RestTimerInline({ defaultDuration = 90, onComplete }: RestTimerInlineProps) {
  const timer = useTimer({ onComplete, playSound: true, vibrate: true });
  const [isExpanded, setIsExpanded] = useState(false);

  const isUrgent = timer.isRunning && timer.remaining <= 10;

  if (!timer.isRunning && timer.remaining === timer.duration && !isExpanded) {
    return (
      <motion.button
        onClick={() => {
          timer.start(defaultDuration, 'countdown', 'Rest');
          setIsExpanded(true);
        }}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <TimerIcon className="w-5 h-5" />
        <span className="text-sm font-display tracking-wider">START REST TIMER</span>
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
        isUrgent
          ? 'bg-accent/20 border border-accent/30'
          : 'bg-primary/10 border border-primary/20'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isUrgent ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
          }`}
          animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3, repeat: isUrgent ? Infinity : 0 }}
        >
          <TimerIcon className="w-5 h-5" />
        </motion.div>
        <div>
          <motion.span
            className={`font-display text-3xl tracking-wider tabular-nums ${
              isUrgent ? 'text-accent text-glow-hot' : 'text-primary text-glow-neon'
            }`}
            key={timer.formattedTime}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {timer.formattedTime}
          </motion.span>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">REST</p>
        </div>
      </div>

      <div className="flex gap-2">
        {timer.isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={timer.pause}
            className="font-display tracking-wider"
          >
            PAUSE
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={timer.resume}
            className="font-display tracking-wider text-primary"
          >
            RESUME
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            timer.reset();
            setIsExpanded(false);
          }}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

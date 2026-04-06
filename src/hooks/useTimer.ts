'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface TimerState {
  mode: 'countdown' | 'countup';
  duration: number; // target duration in seconds (for countdown) or elapsed (for countup)
  remaining: number; // current time in seconds
  isRunning: boolean;
  label?: string;
}

interface UseTimerOptions {
  onComplete?: () => void;
  playSound?: boolean;
  vibrate?: boolean;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { onComplete, playSound = true, vibrate = true } = options;

  const [state, setState] = useState<TimerState>({
    mode: 'countdown',
    duration: 90,
    remaining: 90,
    isRunning: false,
    label: undefined,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/timer-complete.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const triggerComplete = useCallback(() => {
    clearTimer();
    setState(prev => ({ ...prev, isRunning: false }));

    // Play sound
    if (playSound && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay policy
      });
    }

    // Vibrate
    if (vibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    onComplete?.();
  }, [clearTimer, onComplete, playSound, vibrate]);

  const start = useCallback((duration: number, mode: 'countdown' | 'countup' = 'countdown', label?: string) => {
    clearTimer();

    setState({
      mode,
      duration,
      remaining: mode === 'countdown' ? duration : 0,
      isRunning: true,
      label,
    });

    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.mode === 'countdown') {
          const newRemaining = prev.remaining - 1;
          if (newRemaining <= 0) {
            triggerComplete();
            return { ...prev, remaining: 0, isRunning: false };
          }
          return { ...prev, remaining: newRemaining };
        } else {
          // Countup mode
          return { ...prev, remaining: prev.remaining + 1 };
        }
      });
    }, 1000);
  }, [clearTimer, triggerComplete]);

  const pause = useCallback(() => {
    clearTimer();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (state.remaining > 0 || state.mode === 'countup') {
      setState(prev => ({ ...prev, isRunning: true }));

      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.mode === 'countdown') {
            const newRemaining = prev.remaining - 1;
            if (newRemaining <= 0) {
              triggerComplete();
              return { ...prev, remaining: 0, isRunning: false };
            }
            return { ...prev, remaining: newRemaining };
          } else {
            return { ...prev, remaining: prev.remaining + 1 };
          }
        });
      }, 1000);
    }
  }, [state.remaining, state.mode, triggerComplete]);

  const reset = useCallback(() => {
    clearTimer();
    setState(prev => ({
      ...prev,
      remaining: prev.mode === 'countdown' ? prev.duration : 0,
      isRunning: false,
    }));
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const addTime = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      remaining: Math.max(0, prev.remaining + seconds),
      duration: prev.mode === 'countdown' ? prev.duration + seconds : prev.duration,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    formattedTime: formatTime(state.remaining),
    start,
    pause,
    resume,
    reset,
    stop,
    addTime,
    toggle: state.isRunning ? pause : resume,
  };
}

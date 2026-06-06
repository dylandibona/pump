'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Full-screen PR reward (mockup §03). Fires when a new best lands mid-session.
// Full-bleed `pump-pr-burst.png` (dark-centered 3:4 burst) with the brushy
// `new-PR.png` wordmark over its center, the exercise name in Pacifico, the
// PR set in big tabular numerals with a cyan glow, and an "up from" caption.
// Tap anywhere (or wait out the auto-dismiss) to return to the cockpit.
interface PRMomentScreenProps {
  exercise: string;
  weight: number;
  reps: number;
  prevWeight?: number;
  prevReps?: number;
  onDismiss: () => void;
}

export function PRMomentScreen({ exercise, weight, reps, prevWeight, prevReps, onDismiss }: PRMomentScreenProps) {
  // Auto-dismiss if untouched so the reward never blocks the next set.
  useEffect(() => {
    const id = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(id);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] overflow-hidden"
      style={{ background: '#0A0020' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onDismiss}
      role="button"
      aria-label="Dismiss personal record"
    >
      {/* Burst backdrop — fills the viewport; the dark center frames the text. */}
      <Image src="/pump-pr-burst.png" alt="" fill priority className="object-cover" />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* "New PR!" brushy wordmark — the hero headline. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
          style={{ filter: 'drop-shadow(0 8px 28px rgba(255,0,128,0.5)) drop-shadow(0 0 22px rgba(0,255,238,0.2))' }}
        >
          <Image src="/new-PR.png" alt="New PR!" width={900} height={420} priority className="w-[64vw] max-w-[300px] h-auto" />
        </motion.div>

        <motion.p
          className="text-white mt-4"
          style={{ fontFamily: 'var(--font-pacifico), cursive', fontSize: '40px', lineHeight: 1.05, textShadow: '0 0 22px rgba(255,0,128,0.65)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {exercise}
        </motion.p>

        <motion.p
          className="text-white tabular-nums font-display mt-2"
          style={{ fontSize: '60px', lineHeight: 1, textShadow: '0 0 16px rgba(0,255,238,0.6)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {weight} × {reps}
        </motion.p>

        {prevWeight != null && prevReps != null && (
          <motion.p
            className="text-[11px] tracking-[0.2em] uppercase mt-3 font-semibold"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            up from {prevWeight} × {prevReps}
          </motion.p>
        )}

        <motion.button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="mt-10 rounded-full px-8 py-3 text-sm tracking-[0.2em] uppercase font-bold text-white"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.96 }}
        >
          Keep going
        </motion.button>
      </div>
    </motion.div>
  );
}

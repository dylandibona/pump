'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useHeartRate } from '@/hooks/useHeartRate';

// Live heart-rate connect/readout. Native-only: renders nothing in the web PWA
// (no Web Bluetooth on iOS). Phase 3 proof surface — Phase 4 wires the live bpm
// into the cardio session record (avg/max HR).
export function HeartRateConnect() {
  const { supported, status, bpm, deviceName, connect, disconnect } = useHeartRate();
  if (!supported) return null;

  const connected = status === 'connected';

  return (
    <div className="px-1">
      {connected ? (
        <button
          type="button"
          onClick={() => void disconnect()}
          className="w-full flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,0,128,0.08)', border: '1px solid rgba(255,0,128,0.25)' }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: bpm ? Math.max(0.4, 60 / bpm) : 1, repeat: Infinity, ease: 'easeInOut' }}
              style={{ color: 'var(--pump-hot)' }}
            >
              <Heart className="w-5 h-5" fill="currentColor" />
            </motion.div>
            <div className="text-left">
              <p className="font-display text-2xl tabular-nums leading-none" style={{ color: 'var(--pump-text)' }}>
                {bpm ?? '—'} <span className="text-sm font-bold" style={{ color: 'var(--pump-text-dim)' }}>BPM</span>
              </p>
              <p className="text-[10px] tracking-[0.18em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>
                {deviceName ?? 'HR monitor'} · tap to disconnect
              </p>
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void connect()}
          disabled={status === 'connecting'}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-display tracking-wider disabled:opacity-60"
          style={{ background: 'var(--pump-bg-input)', color: 'var(--pump-text)', border: '1px solid var(--pump-border-card)' }}
        >
          <Heart className="w-4 h-4" style={{ color: 'var(--pump-hot)' }} />
          {status === 'connecting' ? 'CONNECTING…' : 'CONNECT HR MONITOR'}
        </button>
      )}
    </div>
  );
}

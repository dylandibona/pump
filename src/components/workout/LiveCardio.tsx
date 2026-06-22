'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, Square, Activity, Bike, Waves, Ship, Footprints } from 'lucide-react';
import { useHeartRate } from '@/hooks/useHeartRate';
import { zoneForBpm, zoneIndexForBpm } from '@/lib/hr-zones';
import type { CardioActivity } from '@/lib/types';

// Live cardio session driven by the BLE heart-rate strap. Native-only (renders
// nothing on web — the manual logger below it remains the fallback). Flow:
// connect HR → pick activity → Start (stopwatch + live BPM, accumulating
// avg/max) → Stop, which hands a finished entry up to be logged. The HR ride-
// along lands on the CardioEntry, so it flows to the coach via the session payload.
const ACTIVITIES: { value: CardioActivity; label: string; icon: React.ElementType }[] = [
  { value: 'run', label: 'RUN', icon: Activity },
  { value: 'bike', label: 'BIKE', icon: Bike },
  { value: 'swim', label: 'SWIM', icon: Waves },
  { value: 'row', label: 'ROW', icon: Ship },
  { value: 'elliptical', label: 'ELLIP', icon: Footprints },
  { value: 'walk', label: 'WALK', icon: Footprints },
];

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LiveCardio({
  onLog,
}: {
  onLog: (entry: { activity: CardioActivity; durationSec: number; avgHr?: number; maxHr?: number; zoneSeconds?: number[] }) => void;
}) {
  const { supported, status, bpm, deviceName, connect, disconnect } = useHeartRate();
  const [activity, setActivity] = useState<CardioActivity>('run');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [runningAvg, setRunningAvg] = useState<number | null>(null);

  // HR accumulation refs (avoid re-render churn); avg/max/zones computed on stop.
  const startMsRef = useRef(0);
  const hrSumRef = useRef(0);
  const hrCountRef = useRef(0);
  const hrMaxRef = useRef(0);
  // Time-in-zone: seconds per zone, credited to the bpm HELD over each interval.
  const zoneSecRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const lastSampleMsRef = useRef(0);
  const lastBpmRef = useRef<number | null>(null);

  const connected = status === 'connected';

  // Tick the stopwatch while recording (Date.now() in a callback, not render).
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMsRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Accumulate HR samples while recording.
  useEffect(() => {
    if (!recording || bpm == null) return;
    const now = Date.now();
    // Credit the time since the last sample to the zone of the bpm held over it.
    if (lastBpmRef.current != null) {
      const dt = (now - lastSampleMsRef.current) / 1000;
      zoneSecRef.current[zoneIndexForBpm(lastBpmRef.current)] += dt;
    }
    lastBpmRef.current = bpm;
    lastSampleMsRef.current = now;
    hrSumRef.current += bpm;
    hrCountRef.current += 1;
    if (bpm > hrMaxRef.current) hrMaxRef.current = bpm;
    setRunningAvg(Math.round(hrSumRef.current / hrCountRef.current));
  }, [bpm, recording]);

  const start = useCallback(() => {
    const now = Date.now();
    startMsRef.current = now;
    hrSumRef.current = 0;
    hrCountRef.current = 0;
    hrMaxRef.current = 0;
    zoneSecRef.current = [0, 0, 0, 0, 0];
    lastSampleMsRef.current = now;
    lastBpmRef.current = null;
    setElapsed(0);
    setRunningAvg(null);
    setRecording(true);
  }, []);

  const stop = useCallback(() => {
    setRecording(false);
    const now = Date.now();
    // Credit the final interval to the last-held bpm's zone.
    if (lastBpmRef.current != null) {
      zoneSecRef.current[zoneIndexForBpm(lastBpmRef.current)] += (now - lastSampleMsRef.current) / 1000;
    }
    const durationSec = Math.max(1, Math.floor((now - startMsRef.current) / 1000));
    const avgHr = hrCountRef.current > 0 ? Math.round(hrSumRef.current / hrCountRef.current) : undefined;
    const maxHr = hrMaxRef.current > 0 ? hrMaxRef.current : undefined;
    const zoneSeconds = zoneSecRef.current.map((s) => Math.round(s));
    const hasZones = zoneSeconds.some((s) => s > 0);
    onLog({ activity, durationSec, avgHr, maxHr, zoneSeconds: hasZones ? zoneSeconds : undefined });
    setElapsed(0);
  }, [activity, onLog]);

  if (!supported) return null;

  // ── Not connected: prompt to connect ──
  if (!connected) {
    return (
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
    );
  }

  // ── Connected: live session control ──
  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{ background: 'rgba(255,0,128,0.06)', border: '1px solid rgba(255,0,128,0.22)' }}
    >
      {/* Live BPM + (when recording) elapsed */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: bpm ? Math.max(0.4, 60 / bpm) : 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'var(--pump-hot)' }}
          >
            <Heart className="w-6 h-6" fill="currentColor" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-3xl tabular-nums leading-none" style={{ color: 'var(--pump-text)' }}>
                {bpm ?? '—'} <span className="text-sm font-bold" style={{ color: 'var(--pump-text-dim)' }}>BPM</span>
              </p>
              {bpm != null && (
                <span
                  className="text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: zoneForBpm(bpm).color }}
                >
                  Z{zoneForBpm(bpm).zone} {zoneForBpm(bpm).name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void disconnect()}
              className="text-[10px] tracking-[0.18em] uppercase font-bold mt-1"
              style={{ color: 'var(--pump-text-dim)' }}
            >
              {deviceName ?? 'HR monitor'} · disconnect
            </button>
          </div>
        </div>
        {recording && (
          <div className="text-right">
            <p className="font-display text-3xl tabular-nums leading-none" style={{ color: 'var(--pump-hot)' }}>
              {fmt(elapsed)}
            </p>
            <p className="text-[10px] tracking-[0.18em] uppercase font-bold mt-1" style={{ color: 'var(--pump-text-dim)' }}>
              {activity} · avg {runningAvg ?? '—'}
            </p>
          </div>
        )}
      </div>

      {/* Activity picker (only before starting) */}
      {!recording && (
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITIES.map((a) => {
            const Icon = a.icon;
            const active = activity === a.value;
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => setActivity(a.value)}
                className="p-2 rounded-xl text-center transition-all"
                style={
                  active
                    ? { background: 'var(--pump-grad-hot)', color: '#fff' }
                    : { background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }
                }
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <span className="font-display text-xs tracking-wider">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Start / Stop */}
      {recording ? (
        <button
          type="button"
          onClick={stop}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-display tracking-wider text-white"
          style={{ background: 'var(--pump-grad-hot)', boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)' }}
        >
          <Square className="w-4 h-4" fill="currentColor" />
          STOP &amp; SAVE
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-display tracking-wider text-white"
          style={{ background: 'var(--pump-grad-hot)', boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)' }}
        >
          <Play className="w-4 h-4" fill="currentColor" />
          START {activity.toUpperCase()}
        </button>
      )}
    </div>
  );
}

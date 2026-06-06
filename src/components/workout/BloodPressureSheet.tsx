'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, X, Check, Copy } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getBPReadings, saveBPReading, classifyBP, generateId, type BPCategory } from '@/lib/storage';
import { pushUnsyncedBP } from '@/lib/bp-sync';
import type { BPMedTimingBucket, BPReading } from '@/lib/types';

const MED_NAME = 'lisinopril 10mg';

const MED_BUCKETS: { key: BPMedTimingBucket; label: string }[] = [
  { key: 'lt1h', label: '<1h' },
  { key: '1to3h', label: '1–3h' },
  { key: '3to6h', label: '3–6h' },
  { key: '6to12h', label: '6–12h' },
  { key: 'gt12h', label: '12h+' },
  { key: 'not_today', label: 'Not yet' },
];

// How meds read in the recent list + the doctor export.
const MED_PHRASE: Record<BPMedTimingBucket, string> = {
  lt1h: '<1h ago',
  '1to3h': '1–3h ago',
  '3to6h': '3–6h ago',
  '6to12h': '6–12h ago',
  gt12h: '12h+ ago',
  not_today: 'not yet today',
};

const CATEGORY_META: Record<BPCategory, { label: string; color: string }> = {
  normal: { label: 'Normal', color: '#00A89E' },
  elevated: { label: 'Elevated', color: '#D98C00' },
  stage1: { label: 'Stage 1', color: '#FF6B00' },
  stage2: { label: 'Stage 2', color: '#FF0080' },
  crisis: { label: 'Crisis', color: '#C20000' },
};

// ISO <-> <input type="datetime-local"> (which works in LOCAL time, no tz).
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function medSummary(r: BPReading): string {
  if (!r.onMeds) return 'no meds';
  return `lisinopril ${MED_PHRASE[r.medTakenAgo ?? 'not_today']}`;
}

// Plain-text block for pasting to a PCP. Newest first, one reading per line.
function formatExport(readings: BPReading[]): string {
  const lines = readings.map(r => {
    const cat = CATEGORY_META[classifyBP(r.systolic, r.diastolic)].label;
    const pulse = r.pulse ? `, pulse ${r.pulse}` : '';
    const notes = r.notes ? ` — ${r.notes}` : '';
    return `${fmtDateTime(r.measuredAt)} — ${r.systolic}/${r.diastolic} mmHg (${cat})${pulse}, ${medSummary(r)}${notes}`;
  });
  const n = readings.length;
  return `Blood pressure — last ${n} reading${n === 1 ? '' : 's'}\n\n${lines.join('\n')}`;
}

export function BloodPressureSheet({
  open,
  onOpenChange,
  onSaved,
  nowIso,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  // Passed in from the parent; defaults to a fresh local now-string on open.
  nowIso?: string;
}) {
  const [view, setView] = useState<'log' | 'recent'>('log');

  // Log form — always starts EMPTY (a new reading, never pre-filled from the
  // last one, which read as "editing the previous value").
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [when, setWhen] = useState('');
  const [onMeds, setOnMeds] = useState(true);
  const [takenAgo, setTakenAgo] = useState<BPMedTimingBucket | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [readings, setReadings] = useState<BPReading[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setView('log');
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setWhen(toLocalInput(nowIso ?? new Date().toISOString()));
    setOnMeds(true);
    setTakenAgo(null);
    setNotes('');
    setSaving(false);
    setCopied(false);
    setReadings(getBPReadings().slice(0, 10));
  }, [open, nowIso]);

  const sys = parseInt(systolic, 10);
  const dia = parseInt(diastolic, 10);
  const valid = sys >= 40 && sys <= 300 && dia >= 20 && dia <= 200 && (!onMeds || takenAgo !== null);
  const category = useMemo(() => (sys > 0 && dia > 0 ? classifyBP(sys, dia) : null), [sys, dia]);

  const handleSave = () => {
    if (!valid || saving) return;
    setSaving(true);
    const reading: BPReading = {
      id: generateId(),
      measuredAt: new Date(when).toISOString(),
      systolic: sys,
      diastolic: dia,
      ...(pulse.trim() && parseInt(pulse, 10) > 0 ? { pulse: parseInt(pulse, 10) } : {}),
      onMeds,
      ...(onMeds ? { medName: MED_NAME, medTakenAgo: takenAgo ?? undefined } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    saveBPReading(reading);
    void pushUnsyncedBP();
    onSaved?.();
    onOpenChange(false);
  };

  const handleCopy = async () => {
    if (readings.length === 0) return;
    try {
      await navigator.clipboard.writeText(formatExport(readings));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked — leave copied=false; the text is still on-screen.
    }
  };

  const numClass =
    'w-full text-center font-display text-5xl text-[color:var(--pump-text)] bg-transparent outline-none tabular-nums';
  const labelClass = 'text-[10px] tracking-[0.18em] uppercase text-muted-foreground';

  const segBtn = (v: 'log' | 'recent', label: string) => {
    const active = view === v;
    return (
      <button
        key={v}
        type="button"
        onClick={() => setView(v)}
        aria-pressed={active}
        className="flex-1 rounded-lg py-2 text-sm tracking-[0.18em] uppercase font-bold transition-all"
        style={
          active
            ? { background: 'var(--pump-bg-card)', color: 'var(--pump-hot)', boxShadow: '0 1px 4px rgba(255,0,128,0.15)' }
            : { color: 'var(--pump-text-dim)' }
        }
      >
        {label}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Inline height beats the base primitive's `data-[side=bottom]:h-auto`
        // variant (higher specificity than a plain h-[90dvh] class), which let
        // the sheet size to content and push its header off the top.
        style={{ height: '90dvh', maxHeight: '90dvh' }}
        className="glass-strong border-t-2 border-primary/30 flex flex-col p-0 gap-0"
      >
        <SheetHeader className="shrink-0 px-4 pt-4 pb-2 relative">
          <SheetTitle className="font-display text-lg tracking-[0.18em] uppercase text-center flex items-center justify-center gap-2" style={{ color: 'var(--pump-text)' }}>
            <Heart className="w-5 h-5" style={{ color: 'var(--pump-hot)' }} />
            Blood Pressure
          </SheetTitle>
          <SheetClose
            aria-label="Close"
            render={
              <button className="absolute top-1 right-1 touch-target flex items-center justify-center rounded-full text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-text)] active:scale-95 transition" />
            }
          >
            <X className="w-6 h-6" />
          </SheetClose>

          {/* Log / Recent toggle */}
          <div
            className="flex gap-1 mt-3 p-1 rounded-xl"
            style={{ background: 'var(--pump-bg-input)' }}
          >
            {segBtn('log', 'Log')}
            {segBtn('recent', 'Recent')}
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {view === 'log' ? (
            <div className="space-y-5">
              {/* SYS / DIA */}
              <div className="pump-card p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1">
                    <input
                      inputMode="numeric"
                      value={systolic}
                      onChange={e => setSystolic(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="—"
                      aria-label="Systolic"
                      className={numClass}
                      autoFocus
                    />
                    <p className={`text-center ${labelClass} mt-1`}>Systolic</p>
                  </div>
                  <div className="text-4xl text-[color:var(--pump-text-dim)] font-display pb-5">/</div>
                  <div className="flex-1">
                    <input
                      inputMode="numeric"
                      value={diastolic}
                      onChange={e => setDiastolic(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="—"
                      aria-label="Diastolic"
                      className={numClass}
                    />
                    <p className={`text-center ${labelClass} mt-1`}>Diastolic</p>
                  </div>
                </div>
                {category && (
                  <div className="flex justify-center mt-3">
                    <span
                      className="text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
                      style={{ color: '#fff', background: CATEGORY_META[category].color }}
                    >
                      {CATEGORY_META[category].label}
                    </span>
                  </div>
                )}
              </div>

              {/* Pulse + When */}
              <div className="grid grid-cols-2 gap-3">
                <label className="pump-card p-3 block">
                  <span className={labelClass}>Pulse (bpm)</span>
                  <input
                    inputMode="numeric"
                    value={pulse}
                    onChange={e => setPulse(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="optional"
                    aria-label="Pulse"
                    className="w-full bg-transparent outline-none font-display text-2xl text-[color:var(--pump-text)] tabular-nums mt-1"
                  />
                </label>
                <label className="pump-card p-3 block">
                  <span className={labelClass}>When</span>
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={e => setWhen(e.target.value)}
                    aria-label="Measured at"
                    className="w-full bg-transparent outline-none text-sm text-[color:var(--pump-text)] mt-2"
                  />
                </label>
              </div>

              {/* Meds */}
              <div className="pump-card p-4 space-y-3">
                <p className="text-xs tracking-[0.18em] uppercase text-[color:var(--pump-cyan-deep)]">
                  Took lisinopril 10mg today?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: true, label: 'Yes' },
                    { v: false, label: 'No' },
                  ].map(opt => {
                    const active = onMeds === opt.v;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => { setOnMeds(opt.v); if (!opt.v) setTakenAgo(null); }}
                        aria-pressed={active}
                        className="touch-target rounded-xl tracking-[0.18em] uppercase font-bold text-sm transition-all"
                        style={
                          active
                            ? { background: 'var(--pump-grad-hot)', color: '#fff' }
                            : { background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {onMeds && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 overflow-hidden">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">How long ago?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {MED_BUCKETS.map(b => {
                        const active = takenAgo === b.key;
                        return (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() => setTakenAgo(b.key)}
                            aria-pressed={active}
                            className="touch-target rounded-lg text-sm font-bold transition-all"
                            style={
                              active
                                ? { background: 'var(--pump-cyan-deep)', color: '#fff' }
                                : { background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)', border: '1px solid var(--pump-border-card)' }
                            }
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes (optional) — symptoms, context…"
                rows={2}
                className="w-full rounded-xl p-3 bg-[color:var(--pump-bg-input)] border border-[color:var(--pump-border-card)] text-sm text-[color:var(--pump-text)] placeholder:text-[color:var(--pump-text-dim)] outline-none focus:border-[color:var(--pump-hot)]/40 resize-none"
              />
            </div>
          ) : (
            /* Recent */
            <div className="space-y-2">
              {readings.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">No readings yet.</p>
              ) : (
                readings.map(r => {
                  const cat = classifyBP(r.systolic, r.diastolic);
                  return (
                    <div key={r.id} className="pump-card p-3">
                      <p className="font-display text-lg flex items-center gap-2">
                        <span className="tabular-nums">{r.systolic}/{r.diastolic}</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                          style={{ background: CATEGORY_META[cat].color }}
                        >
                          {CATEGORY_META[cat].label}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtDateTime(r.measuredAt)}
                        {r.pulse ? ` · ${r.pulse} bpm` : ''} · {medSummary(r)}
                      </p>
                      {r.notes && <p className="text-xs text-[color:var(--pump-text-mid)] mt-1 italic">{r.notes}</p>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Contextual footer: Save on Log, Copy on Recent */}
        <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[color:var(--pump-bg-card)] border-t border-[color:var(--pump-border-card)]">
          {view === 'log' ? (
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={!valid || saving}
              whileTap={{ scale: 0.98 }}
              className="touch-target w-full rounded-xl text-white text-2xl disabled:opacity-50 transition-opacity"
              style={{
                fontFamily: 'var(--font-pacifico), cursive',
                background: 'var(--pump-grad-hot)',
                boxShadow: '0 8px 24px -8px rgba(255,0,128,0.6)',
              }}
            >
              Save Reading
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleCopy}
              disabled={readings.length === 0}
              whileTap={{ scale: 0.98 }}
              className="touch-target w-full rounded-xl text-lg font-display tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={
                copied
                  ? { background: 'var(--pump-cyan-deep)', color: '#fff' }
                  : { background: 'var(--pump-bg-input)', color: 'var(--pump-text)', border: '1px solid var(--pump-border-card)' }
              }
            >
              {copied ? (
                <><Check className="w-5 h-5" /> COPIED FOR YOUR DOCTOR</>
              ) : (
                <><Copy className="w-5 h-5" /> COPY LAST {readings.length} FOR DOCTOR</>
              )}
            </motion.button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

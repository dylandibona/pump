'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';
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

export function BloodPressureSheet({
  open,
  onOpenChange,
  onSaved,
  nowIso,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  // Passed in from the parent (Date.now() isn't available in some contexts);
  // defaults to a fresh local now-string when the sheet opens.
  nowIso?: string;
}) {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [when, setWhen] = useState('');
  const [onMeds, setOnMeds] = useState(true);
  const [takenAgo, setTakenAgo] = useState<BPMedTimingBucket | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Seed each open: prefill last reading's values (quick re-logging) + now.
  useEffect(() => {
    if (!open) return;
    const last = getBPReadings()[0];
    setSystolic(last ? String(last.systolic) : '');
    setDiastolic(last ? String(last.diastolic) : '');
    setPulse(last?.pulse ? String(last.pulse) : '');
    setWhen(toLocalInput(nowIso ?? new Date().toISOString()));
    setOnMeds(last ? last.onMeds : true);
    setTakenAgo(null);
    setNotes('');
    setSaving(false);
  }, [open, nowIso]);

  const sys = parseInt(systolic, 10);
  const dia = parseInt(diastolic, 10);
  const valid = sys >= 40 && sys <= 300 && dia >= 20 && dia <= 200 && (!onMeds || takenAgo !== null);

  const category = useMemo(
    () => (sys > 0 && dia > 0 ? classifyBP(sys, dia) : null),
    [sys, dia],
  );

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

  const numClass =
    'w-full text-center font-display text-5xl text-[color:var(--pump-text)] bg-transparent outline-none tabular-nums';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Inline height beats the base primitive's `data-[side=bottom]:h-auto`
        // variant (higher specificity than a plain h-[90dvh] class), which was
        // letting the sheet size to its content and push its header above the
        // viewport with no way to reach the close button.
        style={{ height: '90dvh', maxHeight: '90dvh' }}
        className="glass-strong border-t-2 border-primary/30 flex flex-col p-0 gap-0"
      >
        <SheetHeader className="shrink-0 px-4 pt-4 pb-2 relative">
          <SheetTitle className="font-display text-2xl tracking-wider text-gradient text-center flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-[color:var(--pump-hot)]" />
            BLOOD PRESSURE
          </SheetTitle>
          <SheetClose
            aria-label="Close"
            render={
              <button className="absolute top-1 right-1 touch-target flex items-center justify-center rounded-full text-[color:var(--pump-text-dim)] hover:text-[color:var(--pump-text)] active:scale-95 transition" />
            }
          >
            <X className="w-6 h-6" />
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-5">
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
                <p className="text-center text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mt-1">Systolic</p>
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
                <p className="text-center text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-mono mt-1">Diastolic</p>
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
              <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-mono">Pulse (bpm)</span>
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
              <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-mono">When</span>
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
            <p className="text-xs tracking-[0.18em] uppercase text-[color:var(--pump-cyan-deep)] font-mono">
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
                    className="touch-target rounded-xl font-display tracking-wider transition-all"
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
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">How long ago?</p>
                <div className="grid grid-cols-3 gap-2">
                  {MED_BUCKETS.map(b => {
                    const active = takenAgo === b.key;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => setTakenAgo(b.key)}
                        aria-pressed={active}
                        className="touch-target rounded-lg text-sm font-mono transition-all"
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

        {/* Save — pinned footer (does not scroll) */}
        <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[color:var(--pump-bg-card)] border-t border-[color:var(--pump-border-card)]">
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={!valid || saving}
            whileTap={{ scale: 0.98 }}
            className="touch-target w-full rounded-xl text-white text-lg font-display tracking-widest disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--pump-grad-hot)', boxShadow: '0 8px 24px -8px rgba(255,0,128,0.6)' }}
          >
            SAVE READING
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

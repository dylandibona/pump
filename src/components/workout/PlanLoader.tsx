'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrainerPlan } from '@/lib/types';
import { savePlan, clearPlan } from '@/lib/storage';
import { validateAndNormalizePlan } from '@/lib/plan-validation';

interface PlanLoaderProps {
  currentPlan: TrainerPlan | null;
  onPlanLoaded: (plan: TrainerPlan) => void;
  onPlanCleared: () => void;
}

export function PlanLoader({ currentPlan, onPlanLoaded, onPlanCleared }: PlanLoaderProps) {
  const [showInput, setShowInput] = useState(false);
  const [pastedText, setPastedText] = useState('');
  // errors is a list so every problem in the pasted plan is visible at
  // once — Dylan can copy them back to the trainer in one pass instead of
  // discovering one at a time. Empty array = no errors.
  const [errors, setErrors] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const handleLoad = () => {
    setErrors([]);

    // Extract JSON from a markdown code block if present, then parse.
    const jsonMatch = pastedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = (jsonMatch ? jsonMatch[1] : pastedText).trim();

    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown parse error.';
      setErrors([`JSON parse error: ${msg}`, 'Make sure you copied the complete JSON block including braces.']);
      return;
    }

    const { plan, errors: validationErrors } = validateAndNormalizePlan(raw);
    if (!plan) {
      setErrors(validationErrors);
      return;
    }

    savePlan(plan);
    onPlanLoaded(plan);
    setPastedText('');
    setShowInput(false);
  };

  const handleClear = () => {
    if (confirm('Remove current plan? Your session logs are kept.')) {
      clearPlan();
      onPlanCleared();
    }
  };

  if (!currentPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <AnimatePresence mode="wait">
          {showInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)', borderLeft: '3px solid var(--pump-hot)' }}
            >
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-cyan-deep)' }}>
                Paste plan from trainer
              </p>
              <Textarea
                value={pastedText}
                onChange={e => { setPastedText(e.target.value); setErrors([]); }}
                placeholder="Paste the JSON plan your trainer generated..."
                className="min-h-[140px] tabular-nums text-sm bg-background/50"
                autoFocus
              />
              {errors.length > 0 && (
                <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center gap-2 text-destructive text-xs font-bold tracking-[0.18em] uppercase">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Plan won&rsquo;t load — {errors.length} {errors.length === 1 ? 'issue' : 'issues'}</span>
                  </div>
                  <ul className="space-y-1 text-sm text-destructive/90 list-disc pl-4">
                    {errors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground pt-1">
                    Copy these back to the trainer — they know what to fix.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleLoad}
                  disabled={!pastedText.trim()}
                  className="flex-1 tracking-[0.18em] uppercase font-bold"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Load plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowInput(false); setErrors([]); setPastedText(''); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInput(true)}
              className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-all"
              style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)', borderLeft: '3px dashed var(--pump-border-card)' }}
            >
              <Upload className="w-4 h-4" style={{ color: 'var(--pump-text-dim)' }} />
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: 'var(--pump-text-dim)' }}>
                  No active plan
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--pump-text-dim)' }}>
                  Load a plan from your trainer to get started
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,0,32,0.05)', borderLeft: '3px solid var(--pump-hot)' }}
    >
      {/* Plan header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,0,128,0.10)' }}>
            <Check className="w-4 h-4" style={{ color: 'var(--pump-hot)' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--pump-text)' }}>
              {currentPlan.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--pump-text-dim)' }}>
              v{currentPlan.version} · {currentPlan.blockType ?? 'Training'} · {currentPlan.sessions.length} sessions
            </p>
          </div>
        </div>
        {showDetails ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Plan details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--pump-border-card)' }}>
              {currentPlan.weeklyStructure && (
                <div className="pt-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-2" style={{ color: 'var(--pump-text-dim)' }}>Weekly Rotation</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPlan.weeklyStructure.map((name, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'var(--pump-bg-input)', color: 'var(--pump-text-mid)' }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentPlan.sessions.map(session => (
                <div key={session.id} className="pt-2">
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--pump-text)' }}>
                    {session.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pump-text-dim)' }}>
                    {session.exercises.map(e => e.name).join(' · ')}
                  </p>
                </div>
              ))}

              {currentPlan.trainerNotes && (
                <div className="pt-2" style={{ borderTop: '1px solid var(--pump-border-card)' }}>
                  <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-1" style={{ color: 'var(--pump-cyan-deep)' }}>Trainer Notes</p>
                  <p className="text-xs italic" style={{ color: 'var(--pump-text-mid)' }}>{currentPlan.trainerNotes}</p>
                </div>
              )}

              {/* Replace / Remove */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowInput(true); setShowDetails(false); }}
                  className="flex-1 tracking-[0.18em] uppercase font-bold text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Replace plan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <AnimatePresence>
                {showInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    <Textarea
                      value={pastedText}
                      onChange={e => { setPastedText(e.target.value); setErrors([]); }}
                      placeholder="Paste updated plan JSON from trainer..."
                      className="min-h-[120px] tabular-nums text-sm bg-background/50"
                      autoFocus
                    />
                    {errors.length > 0 && (
                      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <div className="flex items-center gap-2 text-destructive text-xs font-bold tracking-[0.18em] uppercase">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Plan won&rsquo;t load — {errors.length} {errors.length === 1 ? 'issue' : 'issues'}</span>
                        </div>
                        <ul className="space-y-1 text-sm text-destructive/90 list-disc pl-4">
                          {errors.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button onClick={handleLoad} disabled={!pastedText.trim()} className="w-full tracking-[0.18em] uppercase font-bold">
                      Load updated plan
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

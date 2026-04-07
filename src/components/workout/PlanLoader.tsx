'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TrainerPlan } from '@/lib/types';
import { savePlan, clearPlan } from '@/lib/storage';

interface PlanLoaderProps {
  currentPlan: TrainerPlan | null;
  onPlanLoaded: (plan: TrainerPlan) => void;
  onPlanCleared: () => void;
}

export function PlanLoader({ currentPlan, onPlanLoaded, onPlanCleared }: PlanLoaderProps) {
  const [showInput, setShowInput] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleLoad = () => {
    setError(null);
    try {
      // Extract JSON from a markdown code block if present
      const jsonMatch = pastedText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : pastedText;
      const parsed = JSON.parse(jsonText.trim()) as TrainerPlan;

      // Basic validation
      if (!parsed.planId || !parsed.sessions?.length) {
        setError('Invalid plan format. Make sure you copied the full JSON from your trainer.');
        return;
      }

      savePlan(parsed);
      onPlanLoaded(parsed);
      setPastedText('');
      setShowInput(false);
    } catch {
      setError('Could not parse plan. Copy just the JSON block from your trainer and try again.');
    }
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
              className="glass p-4 space-y-3 border-l-2 border-primary/50"
            >
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                PASTE PLAN FROM TRAINER
              </p>
              <Textarea
                value={pastedText}
                onChange={e => { setPastedText(e.target.value); setError(null); }}
                placeholder="Paste the JSON plan your trainer generated..."
                className="min-h-[140px] font-mono text-sm bg-background/50"
                autoFocus
              />
              {error && (
                <div className="flex items-start gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleLoad}
                  disabled={!pastedText.trim()}
                  className="flex-1 font-display tracking-wider"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  LOAD PLAN
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowInput(false); setError(null); setPastedText(''); }}
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
              className="w-full glass p-4 flex items-center gap-3 border-l-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors group text-left"
            >
              <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-display tracking-wider text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                  NO ACTIVE PLAN
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
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
      className="glass border-l-2 border-primary/50"
    >
      {/* Plan header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display tracking-wider text-primary text-sm">
              {currentPlan.name.toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
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
            <div className="px-4 pb-4 space-y-3 border-t border-white/5">
              {currentPlan.weeklyStructure && (
                <div className="pt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Weekly Rotation</p>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.weeklyStructure.map((name, i) => (
                      <span key={i} className="text-xs font-display tracking-wider px-2 py-1 bg-secondary/40 text-muted-foreground">
                        {name.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentPlan.sessions.map(session => (
                <div key={session.id} className="pt-2">
                  <p className="text-xs font-display tracking-wider text-foreground mb-1">
                    {session.name.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.exercises.map(e => e.name).join(' · ')}
                  </p>
                </div>
              ))}

              {currentPlan.trainerNotes && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Trainer Notes</p>
                  <p className="text-xs text-muted-foreground/80 italic">{currentPlan.trainerNotes}</p>
                </div>
              )}

              {/* Replace / Remove */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowInput(true); setShowDetails(false); }}
                  className="flex-1 font-display tracking-wider text-xs hover:border-primary/50"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  REPLACE PLAN
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
                      onChange={e => { setPastedText(e.target.value); setError(null); }}
                      placeholder="Paste updated plan JSON from trainer..."
                      className="min-h-[120px] font-mono text-sm bg-background/50"
                      autoFocus
                    />
                    {error && (
                      <div className="flex items-start gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    <Button onClick={handleLoad} disabled={!pastedText.trim()} className="w-full font-display tracking-wider">
                      LOAD UPDATED PLAN
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

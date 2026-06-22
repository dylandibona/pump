'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bike, Waves, Ship, Dumbbell, Footprints, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWorkout } from '@/hooks/useWorkout';
import { CardioActivity, CardioEntry } from '@/lib/types';
import { CardioSceneHeader } from './CardioSceneHeader';
import { LiveCardio } from './LiveCardio';
import { LucideIcon } from 'lucide-react';

interface CardioWorkoutProps {
  sessionId?: string;
  onComplete?: () => void;
}

const ACTIVITY_OPTIONS: { value: CardioActivity; label: string; icon: LucideIcon }[] = [
  { value: 'run', label: 'RUN', icon: Activity },
  { value: 'bike', label: 'BIKE', icon: Bike },
  { value: 'swim', label: 'SWIM', icon: Waves },
  { value: 'row', label: 'ROW', icon: Ship },
  { value: 'elliptical', label: 'ELLIPTICAL', icon: Dumbbell },
  { value: 'walk', label: 'WALK', icon: Footprints },
];

export function CardioWorkout({ sessionId, onComplete }: CardioWorkoutProps) {
  const {
    session,
    addCardioEntry,
    updateCardioEntry,
    removeCardioEntry,
    completeSession,
    getSessionStats,
  } = useWorkout({ sessionId });

  const [showAddForm, setShowAddForm] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<CardioActivity>('run');
  // Cardio has no persisted session-name field; the cinematic header derives a
  // friendly default and lets it be renamed in-session (kept local — it's an
  // atmospheric label, not data the trainer needs).
  const [sessionName, setSessionName] = useState('Today’s cardio');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [incline, setIncline] = useState('');
  const [speed, setSpeed] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [maxHr, setMaxHr] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddEntry = () => {
    const totalSecs =
      (parseInt(hours) || 0) * 3600 +
      (parseInt(minutes) || 0) * 60 +
      (parseInt(seconds) || 0);

    if (totalSecs > 0) {
      const distOrUndef = parseFloat(distance) > 0 ? parseFloat(distance) : undefined;
      const inclOrUndef = parseFloat(incline) > 0 ? parseFloat(incline) : undefined;
      const speedOrUndef = parseFloat(speed) > 0 ? parseFloat(speed) : undefined;
      const entry = addCardioEntry(selectedActivity, distOrUndef, totalSecs, notes || undefined, inclOrUndef, speedOrUndef);
      // Manual HR (for strap-less sessions; the live session fills these
      // automatically). Stored after creation so addCardioEntry stays unchanged.
      const avgHrNum = parseInt(avgHr) > 0 ? parseInt(avgHr) : undefined;
      const maxHrNum = parseInt(maxHr) > 0 ? parseInt(maxHr) : undefined;
      if (avgHrNum != null || maxHrNum != null) updateCardioEntry(entry.id, { avgHr: avgHrNum, maxHr: maxHrNum });
      setDistance('');
      setHours('');
      setMinutes('');
      setSeconds('');
      setIncline('');
      setSpeed('');
      setAvgHr('');
      setMaxHr('');
      setNotes('');
      setShowAddForm(false);
    }
  };

  const handleComplete = () => {
    completeSession();
    onComplete?.();
  };

  if (!session) return null;

  const stats = getSessionStats();

  // Totals for the cinematic header — the cardio banked so far.
  const totalDurationSec = session.cardio?.reduce((sum, e) => sum + (e.duration ?? 0), 0) ?? 0;
  const totalDistanceMi = session.cardio?.reduce((sum, e) => sum + (e.distance ?? 0), 0) ?? 0;
  // Eyebrow activity: the latest logged activity once entries exist, otherwise
  // whatever's selected in the picker (updates live as you choose).
  const headerActivity = session.cardio?.length
    ? session.cardio[session.cardio.length - 1].activity
    : selectedActivity;

  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = (distance: number, durationSeconds: number): string => {
    if (distance <= 0) return '--:--';
    const paceSeconds = durationSeconds / distance;
    const paceMins = Math.floor(paceSeconds / 60);
    const paceSecs = Math.round(paceSeconds % 60);
    return `${paceMins}:${paceSecs.toString().padStart(2, '0')}/mi`;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Cinematic scene header (mockup §05) — the cardio "moment". Replaces
          the old inline countdown/stopwatch card; entry durations are logged
          per-activity below and totaled into the hero timer here. */}
      <CardioSceneHeader
        activity={headerActivity}
        name={sessionName}
        onNameChange={setSessionName}
        totalDurationSec={totalDurationSec}
        totalDistanceMi={totalDistanceMi}
      />

      {/* Live cardio session driven by the BLE HR strap (native app only).
          Connect → Start → live BPM + stopwatch → Stop saves an entry with
          avg/max HR. The manual logger below remains the fallback. */}
      <LiveCardio
        onLog={({ activity, durationSec, avgHr, maxHr }) => {
          const entry = addCardioEntry(activity, undefined, durationSec);
          if (avgHr != null || maxHr != null) updateCardioEntry(entry.id, { avgHr, maxHr });
        }}
      />

      {/* Existing Entries */}
      {session.cardio?.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CardioEntryCard
            entry={entry}
            onUpdate={(updates) => updateCardioEntry(entry.id, updates)}
            onRemove={() => removeCardioEntry(entry.id)}
            formatTime={formatTime}
            calculatePace={calculatePace}
          />
        </motion.div>
      ))}

      {/* Add Entry Form */}
      <AnimatePresence mode="wait">
        {showAddForm ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/5">
              <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                LOG ACTIVITY
              </p>
            </div>

            <div className="p-4 space-y-6">
              {/* Activity Selection */}
              <div>
                <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3">
                  SELECT ACTIVITY
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_OPTIONS.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => setSelectedActivity(option.value)}
                        className={`relative p-4 rounded-xl text-center transition-all ${
                          selectedActivity === option.value
                            ? 'bg-accent/20 border-2 border-accent/50'
                            : 'bg-secondary/30 border-2 border-transparent hover:border-accent/30'
                        }`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={`flex justify-center mb-1 ${
                            selectedActivity === option.value ? 'text-accent' : 'text-muted-foreground'
                          }`}
                          animate={selectedActivity === option.value ? { scale: [1, 1.2, 1] } : {}}
                        >
                          <IconComponent className="w-8 h-8" />
                        </motion.div>
                        <span className={`font-display text-sm tracking-wider ${
                          selectedActivity === option.value ? 'text-accent' : 'text-muted-foreground'
                        }`}>
                          {option.label}
                        </span>
                        {selectedActivity === option.value && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border-2 border-accent glow-hot"
                            layoutId="activityHighlight"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Duration (required) */}
              <div>
                <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                  TOTAL TIME
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <Input
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="0"
                      className="touch-target text-2xl tabular-nums text-center bg-background/50"
                    />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 block">
                      Hours
                    </span>
                  </div>
                  <div className="text-center">
                    <Input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      placeholder="0"
                      className="touch-target text-2xl tabular-nums text-center bg-background/50"
                    />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 block">
                      Min
                    </span>
                  </div>
                  <div className="text-center">
                    <Input
                      type="number"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                      placeholder="0"
                      className="touch-target text-2xl tabular-nums text-center bg-background/50"
                    />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1 block">
                      Sec
                    </span>
                  </div>
                </div>
              </div>

              {/* Distance (optional for all; prominent for run) */}
              <div>
                <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                  DISTANCE (MILES){selectedActivity !== 'run' && <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">— optional</span>}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g., 3.1"
                  className="touch-target text-2xl tabular-nums text-center bg-background/50"
                />
              </div>

              {/* Incline — walk and run */}
              {(selectedActivity === 'walk' || selectedActivity === 'run') && (
                <div>
                  <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                    INCLINE (%) <span className="normal-case tracking-normal text-muted-foreground/60">— optional</span>
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={incline}
                    onChange={(e) => setIncline(e.target.value)}
                    placeholder="e.g., 15"
                    className="touch-target text-2xl tabular-nums text-center bg-background/50"
                  />
                </div>
              )}

              {/* Speed — walk only */}
              {selectedActivity === 'walk' && (
                <div>
                  <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                    SPEED (MPH) <span className="normal-case tracking-normal text-muted-foreground/60">— optional</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="e.g., 3.5"
                    className="touch-target text-2xl tabular-nums text-center bg-background/50"
                  />
                </div>
              )}

              {/* Heart rate (optional) — manual entry for strap-less sessions;
                  the live HR session fills these in automatically. */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                    AVG HR (OPTIONAL)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={avgHr}
                    onChange={(e) => setAvgHr(e.target.value)}
                    placeholder="bpm"
                    className="touch-target text-2xl tabular-nums text-center bg-background/50"
                  />
                </div>
                <div>
                  <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                    MAX HR (OPTIONAL)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={maxHr}
                    onChange={(e) => setMaxHr(e.target.value)}
                    placeholder="bpm"
                    className="touch-target text-2xl tabular-nums text-center bg-background/50"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs tracking-[0.2em] text-muted-foreground uppercase block mb-2">
                  NOTES (OPTIONAL)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it feel? Weather, terrain, etc..."
                  className="min-h-[80px] bg-background/50"
                />
              </div>

              {/* Preview */}
              <AnimatePresence>
                {(parseInt(hours) || parseInt(minutes) || parseInt(seconds)) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-accent/10 border border-accent/20"
                  >
                    <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-2">
                      PREVIEW
                    </p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {distance && (
                        <>
                          <span className="font-display text-4xl tabular-nums text-[color:var(--pump-cyan-deep)]">
                            {distance}
                          </span>
                          <span className="text-muted-foreground">mi ·</span>
                        </>
                      )}
                      <span className="font-display text-4xl tabular-nums text-[color:var(--pump-cyan-deep)]">
                        {formatTime(
                          (parseInt(hours) || 0) * 3600 +
                          (parseInt(minutes) || 0) * 60 +
                          (parseInt(seconds) || 0)
                        )}
                      </span>
                      {incline && (
                        <span className="tabular-nums text-lg text-accent">· {incline}% incline</span>
                      )}
                    </div>
                    {distance && (
                      <p className="text-lg tabular-nums text-accent mt-1">
                        {calculatePace(
                          parseFloat(distance),
                          (parseInt(hours) || 0) * 3600 +
                          (parseInt(minutes) || 0) * 60 +
                          (parseInt(seconds) || 0)
                        )}
                      </p>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <Button
                onClick={handleAddEntry}
                className="w-full h-14 font-display text-lg tracking-widest relative overflow-hidden group touch-target"
                size="lg"
                disabled={!(parseInt(hours) || parseInt(minutes) || parseInt(seconds))}
              >
                <span className="relative z-10">ADD ACTIVITY</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="add-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full touch-target font-display text-lg tracking-wider border-dashed border-2 hover:border-accent/50 hover:bg-accent/5 transition-all"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              ADD ANOTHER ACTIVITY
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Stats */}
      {stats && 'totalDistance' in stats && session.cardio && session.cardio.length > 0 && (
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3 text-center">
            SESSION STATS
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-4xl tabular-nums text-[color:var(--pump-cyan-deep)]">
                {stats.activityCount}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Activities</p>
            </div>
            <div>
              <p className="font-display text-4xl tabular-nums text-[color:var(--pump-cyan-deep)]">
                {(stats.totalDistance as number).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Miles</p>
            </div>
            <div>
              <p className="font-display text-4xl tabular-nums text-[color:var(--pump-cyan-deep)]">
                {formatTime(stats.totalDuration as number)}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Complete Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          type="button"
          onClick={handleComplete}
          disabled={!session.cardio?.length}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl py-4 text-white text-2xl touch-target disabled:opacity-50 transition-opacity"
          style={{
            fontFamily: 'var(--font-pacifico), cursive',
            background: 'var(--pump-grad-hot)',
            boxShadow: '0 8px 24px -8px rgba(255,0,128,0.55)',
          }}
        >
          Finish Workout
        </motion.button>
      </motion.div>
    </div>
  );
}

// Individual Cardio Entry Card
interface CardioEntryCardProps {
  entry: CardioEntry;
  onUpdate: (updates: Partial<CardioEntry>) => void;
  onRemove: () => void;
  formatTime: (seconds: number) => string;
  calculatePace: (distance: number, duration: number) => string;
}

function CardioEntryCard({
  entry,
  onRemove,
  formatTime,
  calculatePace,
}: CardioEntryCardProps) {
  const activityInfo = ACTIVITY_OPTIONS.find((a) => a.value === entry.activity);
  const IconComponent = activityInfo?.icon || Activity;

  return (
    <motion.div
      className="glass rounded-2xl p-4"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center text-accent"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <IconComponent className="w-7 h-7" />
          </motion.div>
          <div>
            <p className="font-display text-2xl tracking-wider text-foreground">
              {entry.activity.toUpperCase()}
            </p>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              {entry.duration != null && (
                <span className="tabular-nums text-foreground">
                  {formatTime(entry.duration)}
                </span>
              )}
              {entry.distance != null && entry.duration != null && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="tabular-nums text-accent text-glow-hot">
                    {entry.distance} mi
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="tabular-nums text-accent">
                    {calculatePace(entry.distance, entry.duration)}
                  </span>
                </>
              )}
              {entry.incline != null && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="tabular-nums text-foreground">
                    {entry.incline}% incline
                  </span>
                </>
              )}
              {entry.speed != null && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="tabular-nums text-foreground">
                    {entry.speed} mph
                  </span>
                </>
              )}
              {entry.avgHr != null && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="tabular-nums" style={{ color: 'var(--pump-hot)' }}>
                    ♥ {entry.avgHr}{entry.maxHr != null ? `/${entry.maxHr}` : ''} bpm
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:bg-destructive/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      {entry.notes && (
        <p className="text-sm text-muted-foreground mt-3 pl-18 italic">
          {entry.notes}
        </p>
      )}
    </motion.div>
  );
}

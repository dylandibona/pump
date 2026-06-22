import { WorkoutSession, TrainerPlan, ExerciseStatus, ExerciseStatusReason } from './types';
import { getPRForExercise, isWorkingSet, MIN_PR_REPS } from './storage';
import { parseSessionDate } from './utils';

// Human-readable status labels for the BRIEF. Trainer parses these, so
// stable + short. Keep in sync with the summary-screen picker copy.
const STATUS_LABEL: Record<ExerciseStatus, string> = {
  completed: 'COMPLETED',
  partial: 'PARTIAL',
  skipped: 'SKIPPED',
  substituted: 'SUBSTITUTED',
};

const REASON_LABEL: Record<ExerciseStatusReason, string> = {
  crowded_gym: 'crowded gym',
  equipment_unavailable: 'equipment unavailable',
  form_issue: 'form issue',
  pain: 'pain / discomfort',
  out_of_time: 'out of time',
  other: 'other',
};

export function generateBrief(
  session: WorkoutSession,
  plan: TrainerPlan | null,
  newPRs: string[],
  newBaselines: string[] = []
): string {
  const date = parseSessionDate(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const duration = session.endTime
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
    : null;

  // Resolve the plan session the SAME way the stored label does — by the
  // session's own planSessionId first — so the brief header names the session
  // that was actually run. Falling back to exercise-name overlap (free-form
  // sessions) previously returned the first matching plan session, which
  // mislabeled e.g. a Lower day as "Session A — Upper".
  const planSession =
    (session.planSessionId
      ? plan?.sessions.find(ps => ps.id === session.planSessionId)
      : undefined) ??
    plan?.sessions.find(ps =>
      session.exercises?.some(ex => ps.exercises.some(pe => pe.name.toLowerCase() === ex.name.toLowerCase()))
    );

  let brief = `PUMP BRIEF — ${planSession ? planSession.name + ' — ' : ''}${date}${duration ? ` — ${duration}m` : ''}\n`;
  if (plan) brief += `PLAN: ${plan.name} v${plan.version}\n`;
  brief += '\n';

  if (session.exercises?.length) {
    brief += 'EXERCISES:\n';
    session.exercises.forEach(ex => {
      const planEx = planSession?.exercises.find(p => p.name.toLowerCase() === ex.name.toLowerCase());
      const target = planEx
        ? `target: ${planEx.sets}×${planEx.targetReps}${planEx.isBodyweight ? ' BW' : planEx.targetWeight ? ` @ ${planEx.targetWeight}lbs` : ''}`
        : null;
      const superset = ex.supersetGroupId ? ' ⚡SUPERSET' : '';
      const equipStr = ex.equipment ? ` [${ex.equipment}]` : '';
      const prFlag = newPRs.includes(ex.name) ? ' 🏆PR' : '';
      brief += `${ex.name.toUpperCase()}${equipStr}${superset}${prFlag}${target ? ` (${target})` : ''}\n`;

      // Emit explicit status line per trainer request — no more inferring
      // skipped from empty set lists. Reason appended when present so the
      // trainer doesn't have to ask "why" on every anomaly.
      const status = ex.status ?? 'completed';
      const reasonPart = ex.statusReason ? ` — ${REASON_LABEL[ex.statusReason]}` : '';
      brief += `  STATUS: ${STATUS_LABEL[status]}${reasonPart}\n`;

      // Identify the PR-candidate set for annotation: heaviest working set
      // with reps >= MIN_PR_REPS, tiebreak on reps. Matches the PR selection
      // rule in storage.bestPRCandidate so the BRIEF shows the same set the
      // PR system actually committed.
      let bestIdx = -1;
      let bestW = 0;
      let bestR = 0;
      ex.sets.forEach((set, i) => {
        if (!isWorkingSet(set)) return;
        if (set.reps < MIN_PR_REPS) return;
        if (set.weight > bestW || (set.weight === bestW && set.reps > bestR)) {
          bestW = set.weight;
          bestR = set.reps;
          bestIdx = i;
        }
      });

      const isPR = newPRs.includes(ex.name);
      const isBaseline = newBaselines.includes(ex.name);
      const storedPR = (isPR || isBaseline) ? getPRForExercise(ex.name) : undefined;

      ex.sets.forEach((set, i) => {
        if (set.isWarmup) return;
        const label = set.isBodyweight ? 'BW' : `${set.weight}lbs${ex.weightType === 'per_side' ? ' ea.' : ''}`;
        const targetW = planEx?.targetWeight;
        const indicator = !targetW ? '' : set.weight > targetW ? ' ↑' : set.weight < targetW ? ' ↓' : ' ✓';

        let mark = '';
        if (i === bestIdx) {
          if (isPR) {
            const prev = storedPR?.previousWeight != null
              ? `, prev: ${storedPR.previousWeight}lbs × ${storedPR.previousReps ?? '?'}`
              : '';
            mark = ` 🏆 PR${prev}`;
          } else if (isBaseline) {
            mark = ' ★Baseline';
          }
        }

        brief += `  Set ${i + 1}: ${label} × ${set.reps}${indicator}${mark}\n`;
      });

      // Exercise-level notes (user-typed during the session) — trainer needs
      // to see these. Plan notes stay in the plan itself so we don't echo
      // them back; this is the user's own commentary.
      if (ex.notes && ex.notes.trim()) {
        brief += `  NOTE: ${ex.notes.trim()}\n`;
      }
    });
  }

  if (session.intervals?.length) {
    brief += '\nINTERVALS:\n';
    session.intervals.forEach(iv => {
      const shape = iv.sequence.blocks
        .map(b => `[${b.steps.map(s => `${s.label} ${s.duration}s`).join(' / ')}] × ${b.rounds}`)
        .join(' + ');
      const mins = Math.floor(iv.totalDuration / 60);
      const secs = iv.totalDuration % 60;
      brief += `  ${iv.name.toUpperCase()} — ${shape} (${mins}:${String(secs).padStart(2, '0')})\n`;
    });
  }

  if (session.cardio?.length) {
    brief += '\nCARDIO:\n';
    session.cardio.forEach(c => {
      const dist = c.distance ?? 0;
      const dur = c.duration ?? 0;
      const pace = dist > 0 && dur > 0 ? `${Math.floor(dur / dist / 60)}:${Math.round((dur / dist) % 60).toString().padStart(2, '0')}/mi` : '';
      const distStr = dist > 0 ? `${dist}mi` : '';
      const durStr = dur > 0 ? `${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')}` : '';
      const inclineStr = c.incline != null ? ` ${c.incline}% incline` : '';
      const hrStr = c.avgHr != null ? ` — HR ${c.avgHr}${c.maxHr != null ? `/${c.maxHr}` : ''} bpm avg/max` : '';
      brief += `  ${c.activity.toUpperCase()} —${distStr ? ` ${distStr}` : ''}${durStr ? ` in ${durStr}` : ''}${pace ? ` (${pace})` : ''}${inclineStr}${hrStr}\n`;
    });
  }

  const totalVolume = session.exercises?.reduce((sum, ex) =>
    sum + ex.sets.filter(isWorkingSet).reduce((s2, set) => s2 + set.weight * set.reps, 0), 0) ?? 0;

  if (totalVolume > 0) brief += `\nVOLUME: ${totalVolume.toLocaleString()} lbs\n`;
  if (newPRs.length) brief += `NEW BESTS: ${newPRs.join(', ')}\n`;
  if (newBaselines.length) brief += `BASELINES: ${newBaselines.join(', ')}\n`;
  if (session.feelScore) brief += `FEEL: ${session.feelScore}/5\n`;
  if (session.notes) brief += `\nNOTES: ${session.notes}\n`;

  return brief.trim();
}

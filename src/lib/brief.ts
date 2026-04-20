import { WorkoutSession, TrainerPlan } from './types';
import { computeE1RM, getPRForExercise } from './storage';
import { parseSessionDate } from './utils';

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

  const planSession = plan?.sessions.find(ps =>
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
      brief += `${ex.name.toUpperCase()}${equipStr}${superset}${target ? ` (${target})` : ''}\n`;

      // Identify the best set (highest e1RM) for PR/baseline annotation.
      // Skip warmup, bodyweight, and zero-weight sets.
      let bestIdx = -1;
      let bestE1rm = 0;
      ex.sets.forEach((set, i) => {
        if (set.isWarmup || set.isBodyweight || set.weight <= 0 || set.reps <= 0) return;
        const e1rm = computeE1RM(set.weight, set.reps);
        if (e1rm > bestE1rm) { bestE1rm = e1rm; bestIdx = i; }
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
          const e1 = Math.round(bestE1rm);
          if (isPR) {
            const prev = storedPR?.previousE1rm != null ? `, prev: ${Math.round(storedPR.previousE1rm)}` : '';
            mark = ` ⚡PR (e1RM: ${e1}${prev})`;
          } else if (isBaseline) {
            mark = ` ★Baseline (e1RM: ${e1})`;
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
      brief += `  ${c.activity.toUpperCase()} —${distStr ? ` ${distStr}` : ''}${durStr ? ` in ${durStr}` : ''}${pace ? ` (${pace})` : ''}${inclineStr}\n`;
    });
  }

  const totalVolume = session.exercises?.reduce((sum, ex) =>
    sum + ex.sets.filter(s => !s.isWarmup && !s.isBodyweight).reduce((s2, set) => s2 + set.weight * set.reps, 0), 0) ?? 0;

  if (totalVolume > 0) brief += `\nVOLUME: ${totalVolume.toLocaleString()} lbs\n`;
  if (newPRs.length) brief += `NEW PRs: ${newPRs.join(', ')}\n`;
  if (newBaselines.length) brief += `BASELINES: ${newBaselines.join(', ')}\n`;
  if (session.notes) brief += `\nNOTES: ${session.notes}\n`;

  return brief.trim();
}

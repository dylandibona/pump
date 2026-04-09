import { WorkoutSession, TrainerPlan } from './types';

export function generateBrief(session: WorkoutSession, plan: TrainerPlan | null, newPRs: string[]): string {
  const date = new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
      ex.sets.forEach((set, i) => {
        if (set.isWarmup) return;
        const label = set.isBodyweight ? 'BW' : `${set.weight}lbs${ex.weightType === 'per_side' ? ' ea.' : ''}`;
        const targetW = planEx?.targetWeight;
        const indicator = !targetW ? '' : set.weight > targetW ? ' ↑' : set.weight < targetW ? ' ↓' : ' ✓';
        const prMark = newPRs.includes(ex.name) && i === ex.sets.filter(s => !s.isWarmup).length - 1 ? ' 🏆PR' : '';
        brief += `  Set ${i + 1}: ${label} × ${set.reps}${indicator}${prMark}\n`;
      });
    });
  }

  if (session.cardio?.length) {
    brief += '\nCARDIO:\n';
    session.cardio.forEach(c => {
      const pace = c.distance > 0 ? `${Math.floor(c.duration / c.distance / 60)}:${Math.round((c.duration / c.distance) % 60).toString().padStart(2, '0')}/mi` : '';
      brief += `  ${c.activity.toUpperCase()} — ${c.distance}mi in ${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}${pace ? ` (${pace})` : ''}\n`;
    });
  }

  const totalVolume = session.exercises?.reduce((sum, ex) =>
    sum + ex.sets.filter(s => !s.isWarmup && !s.isBodyweight).reduce((s2, set) => s2 + set.weight * set.reps, 0), 0) ?? 0;

  if (totalVolume > 0) brief += `\nVOLUME: ${totalVolume.toLocaleString()} lbs\n`;
  if (newPRs.length) brief += `NEW PRs: ${newPRs.join(', ')}\n`;
  if (session.notes) brief += `\nNOTES: ${session.notes}\n`;

  return brief.trim();
}

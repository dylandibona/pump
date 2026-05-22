// Pure, isomorphic merge logic shared by the client sync layer and the
// /api/data route handler. No browser or Node APIs at module scope so it
// can be imported on both sides.

import type { WorkoutData, WorkoutSession, PersonalRecord, WorkoutTemplate, TrainerPlan, UserSettings } from './types';

// The full sync payload. localStorage splits workout data and the active
// plan across two keys; the envelope carries both plus a write timestamp
// used as the last-writer-wins tiebreaker for whole-object fields.
export interface SyncEnvelope {
  updatedAt: string;        // ISO timestamp of the writing client's snapshot
  data: WorkoutData;
  plan: TrainerPlan | null;
}

function sessionRecency(s: WorkoutSession): number {
  return new Date(s.endTime ?? s.startTime ?? s.date).getTime() || 0;
}

// Union by id. On the same id, prefer a completed session over an in-progress
// one, then the more recently finished. This makes concurrent edits on two
// devices converge instead of one device clobbering the other.
function mergeSessions(a: WorkoutSession[], b: WorkoutSession[]): WorkoutSession[] {
  const byId = new Map<string, WorkoutSession>();
  for (const s of [...a, ...b]) {
    const existing = byId.get(s.id);
    if (!existing) { byId.set(s.id, s); continue; }
    if (s.completed !== existing.completed) {
      byId.set(s.id, s.completed ? s : existing);
    } else if (sessionRecency(s) >= sessionRecency(existing)) {
      byId.set(s.id, s);
    }
  }
  return [...byId.values()].sort((x, y) => sessionRecency(y) - sessionRecency(x));
}

// One PR per exercise (case-insensitive name). PRs compare by weight, so the
// heavier wins; equal weight keeps the more recent record. PRs never regress.
function mergePRs(a: PersonalRecord[], b: PersonalRecord[]): PersonalRecord[] {
  const byName = new Map<string, PersonalRecord>();
  for (const pr of [...a, ...b]) {
    const key = pr.exerciseName.toLowerCase();
    const existing = byName.get(key);
    if (!existing) { byName.set(key, pr); continue; }
    if (pr.weight > existing.weight) byName.set(key, pr);
    else if (pr.weight === existing.weight && new Date(pr.date).getTime() > new Date(existing.date).getTime()) {
      byName.set(key, pr);
    }
  }
  return [...byName.values()];
}

function mergeTemplates(a: WorkoutTemplate[], b: WorkoutTemplate[]): WorkoutTemplate[] {
  const byId = new Map<string, WorkoutTemplate>();
  for (const t of [...a, ...b]) {
    const existing = byId.get(t.id);
    if (!existing || new Date(t.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      byId.set(t.id, t);
    }
  }
  return [...byId.values()];
}

// Merge two envelopes into one. List-shaped data (sessions, PRs, templates)
// is unioned so nothing is lost; whole-object fields (settings, plan) use
// last-writer-wins by envelope timestamp.
export function mergeEnvelopes(a: SyncEnvelope, b: SyncEnvelope): SyncEnvelope {
  const aNewer = new Date(a.updatedAt).getTime() >= new Date(b.updatedAt).getTime();
  const newer = aNewer ? a : b;
  const settings: UserSettings = newer.data.settings;

  return {
    updatedAt: new Date(Math.max(new Date(a.updatedAt).getTime() || 0, new Date(b.updatedAt).getTime() || 0)).toISOString(),
    data: {
      sessions: mergeSessions(a.data.sessions ?? [], b.data.sessions ?? []),
      personalRecords: mergePRs(a.data.personalRecords ?? [], b.data.personalRecords ?? []),
      templates: mergeTemplates(a.data.templates ?? [], b.data.templates ?? []),
      settings,
    },
    plan: newer.plan,
  };
}

// Push finished sessions to Supabase (pump_build_spec_v2.md §3). PUMP only
// WRITES sessions; the coach reads them. localStorage stays primary — this is
// additive and non-blocking.
//
// Strategy: a reconciliation sweep. Any completed session whose id isn't in the
// local "synced" set gets inserted; on success its id is recorded. This covers
// every finish path (summary Done AND the Back-button auto-finish) with one
// mechanism, dedups client-side (the sessions table has no PUMP id column), and
// is self-healing offline — a failed insert just stays unsynced and retries on
// the next sweep (load / dashboard return / window focus).
//
// First run seeds the synced set with all EXISTING completed sessions, so the
// coach's table only receives sessions finished from here forward — no
// back-flood of history with stale plan/feel attribution.
import { supabase, isSupabaseConfigured } from './supabase';
import { getWorkoutData, getPlan, isWorkingSet, sessionDurationMin } from './storage';
import { generateBrief } from './brief';
import type { WorkoutSession, TrainerPlan } from './types';

const SYNCED_KEY = 'pump-synced-sessions';

function getSyncedIds(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(SYNCED_KEY) || '[]'));
  } catch {
    return new Set<string>();
  }
}

function saveSyncedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage full / unavailable — sweep will retry next time */
  }
}

// Seed the baseline on first ever run so only forward sessions are pushed.
function ensureBaseline(): Set<string> {
  if (localStorage.getItem(SYNCED_KEY) === null) {
    const ids = new Set(
      getWorkoutData().sessions.filter(s => s.completed).map(s => s.id),
    );
    saveSyncedIds(ids);
    return ids;
  }
  return getSyncedIds();
}

// Best-effort label: the plan session this workout ran from (by id, else by
// exercise-name overlap), used by the coach to group sessions.
function sessionLabel(session: WorkoutSession, plan: TrainerPlan | null): string | null {
  if (!plan) return null;
  if (session.planSessionId) {
    const byId = plan.sessions.find(s => s.id === session.planSessionId);
    if (byId) return byId.name;
  }
  const byOverlap = plan.sessions.find(ps =>
    session.exercises?.some(ex => ps.exercises.some(pe => pe.name.toLowerCase() === ex.name.toLowerCase())),
  );
  return byOverlap?.name ?? null;
}

function totalVolume(session: WorkoutSession): number {
  return (
    session.exercises?.reduce(
      (sum, ex) => sum + ex.sets.filter(isWorkingSet).reduce((s, set) => s + set.weight * set.reps, 0),
      0,
    ) ?? 0
  );
}

// Map a PUMP session to a row in the coach's `sessions` table. exercises stay
// in PUMP's native GymExercise[] shape (the coach parses that). PR info and
// cardio ride along in raw_brief (the table is gym/exercise-shaped). The brief
// is regenerated with the persisted PR/baseline names so highlights survive.
function buildRow(session: WorkoutSession, plan: TrainerPlan | null) {
  const brief = generateBrief(
    session,
    plan,
    session.prSummary?.prs ?? [],
    session.prSummary?.baselines ?? [],
  );
  const vol = totalVolume(session);
  return {
    session_date: session.date,
    plan_id: plan?.planId ?? null,
    plan_version: plan?.version ?? null,
    label: sessionLabel(session, plan),
    duration_min: sessionDurationMin(session),
    total_volume: vol > 0 ? vol : null,
    feel_score: session.feelScore ?? null,
    exercises: session.exercises ?? [],
    raw_brief: brief,
    processed: false,
  };
}

// Push any completed-but-unsynced sessions. Inert when Supabase is unconfigured
// or no user is signed in (RLS would reject the write — leave them for later).
export async function pushUnsyncedSessions(): Promise<{ pushed: number }> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return { pushed: 0 };

  const synced = ensureBaseline();
  const pending = getWorkoutData().sessions.filter(s => s.completed && !synced.has(s.id));
  if (pending.length === 0) return { pushed: 0 };

  // RLS requires an authenticated session for writes.
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return { pushed: 0 };

  const plan = getPlan();
  let pushed = 0;
  for (const session of pending) {
    const { error } = await supabase.from('sessions').insert(buildRow(session, plan));
    if (error) {
      console.warn('Session push failed (will retry):', session.id, error.message);
      continue; // leave unsynced — retried on the next sweep
    }
    synced.add(session.id);
    pushed += 1;
  }
  if (pushed > 0) saveSyncedIds(synced);
  return { pushed };
}

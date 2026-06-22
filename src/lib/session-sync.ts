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
import { getWorkoutData, saveWorkoutData, getPlan, isWorkingSet, sessionDurationMin } from './storage';
import { generateBrief } from './brief';
import type { WorkoutSession, TrainerPlan, GymExercise } from './types';

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
    // Stable idempotency key — hits the partial unique index so a retry/double
    // dedups to one row. Null for legacy sessions started before this shipped.
    client_session_id: session.clientSessionId ?? null,
    session_date: session.date,
    plan_id: plan?.planId ?? null,
    plan_version: plan?.version ?? null,
    label: sessionLabel(session, plan),
    duration_min: sessionDurationMin(session),
    total_volume: vol > 0 ? vol : null,
    feel_score: session.feelScore ?? null,
    exercises: session.exercises ?? [],
    // Lossless complete session (native PUMP shape) so the coach gets cardio +
    // intervals + notes structurally, not just as prose in raw_brief. Additive;
    // the shaped columns above are unchanged. Column added 2026-06-17.
    payload: session,
    raw_brief: brief,
    processed: false,
  };
}

// Single-flight guard: the sweep is triggered from several places (dashboard
// return, window focus, load). Without this, two triggers fire concurrently,
// both read the same session as unsynced before either records it, and both
// insert — the double-row bug. Concurrent callers share the one in-flight run.
let sweepInFlight: Promise<{ pushed: number }> | null = null;

export function pushUnsyncedSessions(): Promise<{ pushed: number }> {
  if (sweepInFlight) return sweepInFlight;
  sweepInFlight = runSweep().finally(() => {
    sweepInFlight = null;
  });
  return sweepInFlight;
}

// Push any completed-but-unsynced sessions. Inert when Supabase is unconfigured
// or no user is signed in (RLS would reject the write — leave them for later).
async function runSweep(): Promise<{ pushed: number }> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return { pushed: 0 };

  const synced = ensureBaseline();
  const pending = getWorkoutData().sessions.filter(s => s.completed && !synced.has(s.id));
  if (pending.length === 0) return { pushed: 0 };

  // RLS requires an authenticated session for writes.
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return { pushed: 0 };

  const plan = getPlan();
  let pushed = 0;
  let changed = false;
  for (const session of pending) {
    // Payload assembled in full (brief + notes + all fields) synchronously here,
    // before the write — never mid-flight.
    const { error } = await supabase.from('sessions').insert(buildRow(session, plan));
    if (error) {
      // 23505 = unique violation on client_session_id: this session was already
      // written by a prior run / another device / a retry. Idempotent — mark it
      // synced so we never create a second row (first complete write wins).
      if (error.code === '23505') {
        synced.add(session.id);
        changed = true;
        continue;
      }
      console.warn('Session push failed (will retry):', session.id, error.message);
      continue; // leave unsynced — retried on the next sweep
    }
    synced.add(session.id);
    changed = true;
    pushed += 1;
  }
  if (changed) saveSyncedIds(synced);
  return { pushed };
}

// ── Pull (cross-device hydrate) ──────────────────────────────────────────────
// A fresh container (the installed PWA, OR the native iOS app) starts with empty
// localStorage, so history shows nothing even though Supabase has it. This pulls
// the `sessions` table down and merges it into local. Prefer the lossless
// `payload` (complete WorkoutSession); for legacy rows without payload (the bulk
// of history), reconstruct a gym session from the coach-shaped columns so it
// still appears. Merge is union-only (never overwrites a local session), keyed
// by id + client_session_id; pulled ids are marked synced so the push sweep
// can't re-upload them as duplicate rows.
interface SessionRow {
  id: string;
  client_session_id: string | null;
  session_date: string;
  exercises: unknown;
  feel_score: number | null;
  duration_min: number | null;
  label: string | null;
  payload: unknown;
}

function rowToSession(row: SessionRow, plan: TrainerPlan | null): WorkoutSession | null {
  // Lossless path: the stored payload IS the complete WorkoutSession.
  if (row.payload && typeof row.payload === 'object') {
    const p = row.payload as WorkoutSession;
    if (p.id && p.date) return p;
  }
  // Reconstruct a gym session from shaped columns (legacy rows).
  const id = row.client_session_id ?? row.id;
  if (!id || !row.session_date) return null;
  let exercises: GymExercise[] = [];
  try {
    const raw = typeof row.exercises === 'string' ? JSON.parse(row.exercises) : row.exercises;
    if (Array.isArray(raw)) {
      // Defensive: guarantee each exercise has a sets[] so detail/history
      // renderers (which map ex.sets) never crash on a malformed row.
      exercises = (raw as GymExercise[]).map(ex => ({ ...ex, sets: Array.isArray(ex.sets) ? ex.sets : [] }));
    }
  } catch { /* leave empty */ }
  const startTime = `${row.session_date}T12:00:00.000Z`;
  const endTime = row.duration_min
    ? new Date(new Date(startTime).getTime() + row.duration_min * 60000).toISOString()
    : undefined;
  // Restore the plan-session label linkage when the loaded plan has a match.
  const planSessionId = plan && row.label
    ? plan.sessions.find(s => s.name.toLowerCase() === String(row.label).toLowerCase())?.id
    : undefined;
  return {
    id,
    ...(row.client_session_id ? { clientSessionId: row.client_session_id } : {}),
    date: row.session_date,
    type: 'gym',
    startTime,
    ...(endTime ? { endTime } : {}),
    completed: true,
    exercises,
    cardio: [],
    ...(row.feel_score != null ? { feelScore: row.feel_score } : {}),
    ...(planSessionId ? { planSessionId } : {}),
  };
}

let pullInFlight: Promise<{ pulled: number }> | null = null;

export function pullRemoteSessions(): Promise<{ pulled: number }> {
  if (pullInFlight) return pullInFlight;
  pullInFlight = runPull().finally(() => { pullInFlight = null; });
  return pullInFlight;
}

async function runPull(): Promise<{ pulled: number }> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return { pulled: 0 };

  // RLS scopes the read to the authed user.
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return { pulled: 0 };

  const { data: rows, error } = await supabase
    .from('sessions')
    .select('id, client_session_id, session_date, exercises, feel_score, duration_min, label, payload')
    .order('session_date', { ascending: false });
  if (error || !rows) return { pulled: 0 };

  const plan = getPlan();
  const local = getWorkoutData();
  const localIds = new Set(local.sessions.map(s => s.id));
  const localClientIds = new Set(
    local.sessions.map(s => s.clientSessionId).filter(Boolean) as string[],
  );

  const incoming: WorkoutSession[] = [];
  for (const row of rows as SessionRow[]) {
    const s = rowToSession(row, plan);
    if (!s) continue;
    if (localIds.has(s.id)) continue;                                  // already local
    if (s.clientSessionId && localClientIds.has(s.clientSessionId)) continue;
    incoming.push(s);
    localIds.add(s.id);
    if (s.clientSessionId) localClientIds.add(s.clientSessionId);
  }
  if (incoming.length === 0) return { pulled: 0 };

  local.sessions = [...local.sessions, ...incoming];
  saveWorkoutData(local);

  // Pulled rows came FROM the server — record them as synced so the push sweep
  // never re-inserts them (legacy rows without a client_session_id would
  // otherwise create duplicate rows).
  const synced = getSyncedIds();
  incoming.forEach(s => synced.add(s.id));
  saveSyncedIds(synced);

  return { pulled: incoming.length };
}

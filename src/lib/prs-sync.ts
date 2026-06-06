// Personal Records — read from the curated Supabase `prs` table.
//
// PUMP's *local* personalRecords stay around for ONE job only: the in-session
// "new best" badge (instant, no network, label says "best" not "PR"). Anything
// the user sees as a PR — the dashboard Records section, the records count
// tile, the full PR history view — reads from this module, which mirrors the
// curated `prs` table the trainer maintains.
//
// `prs` row shape:
//   exercise text, weight numeric, reps int, unit text,
//   kind text ('load' | 'rep'), achieved_on date
//
// Local-first: results are cached in localStorage so the dashboard renders
// instantly from cache while the fresh fetch runs in the background. Inert
// when Supabase is unconfigured or no user is signed in (RLS blocks).
import { supabase, isSupabaseConfigured } from './supabase';

export type PRKind = 'load' | 'rep';

export interface CuratedPR {
  exercise: string;
  weight: number;
  reps: number;
  unit: string;
  kind: PRKind;
  achievedOn: string; // 'YYYY-MM-DD'
}

const CACHE_KEY = 'pump-prs-cache';

function readCache(): CuratedPR[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CuratedPR[]) : [];
  } catch {
    return [];
  }
}

function writeCache(prs: CuratedPR[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prs));
  } catch {
    /* storage unavailable — next fetch refills */
  }
}

// Read whatever's already in localStorage (fast, synchronous). The dashboard
// uses this for first paint; pulls the fresh copy in the background.
export function getCachedPRs(): CuratedPR[] {
  return readCache();
}

// Current best per exercise, most recent first.
// `prs` may contain multiple rows per exercise (e.g. load and rep PRs, or a
// history of upgrades). We keep just the highest-weight row per exercise+kind,
// then for each exercise pick the most recently achieved one as the headline.
export function currentBestPerExercise(prs: CuratedPR[]): CuratedPR[] {
  // Group by exercise key
  const byExercise = new Map<string, CuratedPR[]>();
  for (const pr of prs) {
    const key = pr.exercise.toLowerCase();
    const list = byExercise.get(key);
    if (list) list.push(pr);
    else byExercise.set(key, [pr]);
  }
  const winners: CuratedPR[] = [];
  for (const list of byExercise.values()) {
    // Pick the most-recently-achieved as headline (ties → heaviest).
    const headline = [...list].sort((a, b) => {
      if (a.achievedOn !== b.achievedOn) return a.achievedOn < b.achievedOn ? 1 : -1;
      return b.weight - a.weight;
    })[0];
    winners.push(headline);
  }
  // Sort the result set by date desc (most recent at the top).
  winners.sort((a, b) => (a.achievedOn < b.achievedOn ? 1 : -1));
  return winners;
}

// Fetch the full PR table (all rows) and cache. Returns the rows on success,
// the cached snapshot on failure. Idempotent — safe to call from multiple
// triggers (dashboard mount, focus). Run in the background; consumers should
// keep rendering whatever getCachedPRs() returns and accept that one re-render
// with the fresh data is fine.
export async function fetchPRs(): Promise<CuratedPR[]> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return readCache();

  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return readCache();

  const { data, error } = await supabase
    .from('prs')
    .select('exercise, weight, reps, unit, kind, achieved_on')
    .order('achieved_on', { ascending: false });

  if (error || !data) {
    console.warn('PR fetch failed (using cache):', error?.message);
    return readCache();
  }

  // PostgREST returns weight as string for numeric columns; normalize to number.
  const rows: CuratedPR[] = data.map(r => ({
    exercise: String(r.exercise ?? ''),
    weight: Number(r.weight ?? 0),
    reps: Number(r.reps ?? 0),
    unit: String(r.unit ?? 'lb'),
    kind: (r.kind === 'rep' ? 'rep' : 'load') as PRKind,
    achievedOn: String(r.achieved_on ?? ''),
  }));
  writeCache(rows);
  return rows;
}

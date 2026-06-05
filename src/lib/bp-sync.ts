// Push blood-pressure readings to Supabase (`bp_readings`). Same local-first,
// offline-tolerant reconciliation-sweep pattern as session-sync: any local
// reading whose id isn't in the synced set gets inserted; on success its id is
// recorded. Inert when Supabase is unconfigured or no user is signed in. No
// first-run baseline (BP is a new feature — every local reading should sync).
import { supabase, isSupabaseConfigured } from './supabase';
import { getBPReadings } from './storage';
import type { BPReading } from './types';

const SYNCED_KEY = 'pump-bp-synced';

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
    /* storage unavailable — retry next sweep */
  }
}

function buildRow(r: BPReading) {
  return {
    measured_at: r.measuredAt,
    systolic: r.systolic,
    diastolic: r.diastolic,
    pulse: r.pulse ?? null,
    on_meds: r.onMeds,
    med_name: r.onMeds ? r.medName ?? null : null,
    med_taken_ago: r.onMeds ? r.medTakenAgo ?? null : null,
    notes: r.notes?.trim() ? r.notes.trim() : null,
  };
}

export async function pushUnsyncedBP(): Promise<{ pushed: number }> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return { pushed: 0 };

  const synced = getSyncedIds();
  const pending = getBPReadings().filter(r => !synced.has(r.id));
  if (pending.length === 0) return { pushed: 0 };

  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return { pushed: 0 };

  let pushed = 0;
  for (const reading of pending) {
    const { error } = await supabase.from('bp_readings').insert(buildRow(reading));
    if (error) {
      console.warn('BP push failed (will retry):', reading.id, error.message);
      continue;
    }
    synced.add(reading.id);
    pushed += 1;
  }
  if (pushed > 0) saveSyncedIds(synced);
  return { pushed };
}

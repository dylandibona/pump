// Client-side cloud sync. localStorage stays the offline-first source of
// truth; this layer pushes the local snapshot to /api/data, where the server
// merges it with the stored copy and returns the union, which we apply back.
// One round trip therefore syncs in both directions.

import { getWorkoutData, getPlan, applyRemote } from './storage';
import type { SyncEnvelope } from './sync-merge';

const TOKEN_KEY = 'pump-sync-token';
const LAST_SYNCED_KEY = 'pump-sync-last';

export type SyncStatus =
  | 'unconfigured'   // no token entered yet
  | 'syncing'
  | 'synced'
  | 'offline'        // no network
  | 'unauthorized'   // token rejected by server
  | 'error';         // server/store not configured or unexpected failure

export function getSyncToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setSyncToken(token: string): void {
  if (typeof window === 'undefined') return;
  const t = token.trim();
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getLastSynced(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNCED_KEY);
}

function setLastSynced(iso: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(LAST_SYNCED_KEY, iso);
}

function buildLocalEnvelope(): SyncEnvelope {
  return {
    updatedAt: new Date().toISOString(),
    data: getWorkoutData(),
    plan: getPlan(),
  };
}

export interface SyncResult {
  status: SyncStatus;
  changed: boolean; // true if remote data merged in actually altered local state
}

// Push the local snapshot, receive the server-merged union, apply it back.
export async function sync(): Promise<SyncResult> {
  const token = getSyncToken();
  if (!token) return { status: 'unconfigured', changed: false };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 'offline', changed: false };
  }

  try {
    const res = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(buildLocalEnvelope()),
    });

    if (res.status === 401) return { status: 'unauthorized', changed: false };
    if (!res.ok) return { status: 'error', changed: false };

    const body = (await res.json()) as { envelope: SyncEnvelope | null };
    let changed = false;
    if (body.envelope) {
      changed = applyRemote(body.envelope.data, body.envelope.plan);
      setLastSynced(body.envelope.updatedAt);
    } else {
      setLastSynced(new Date().toISOString());
    }
    return { status: 'synced', changed };
  } catch {
    return { status: 'offline', changed: false };
  }
}

// Upstash cloud sync — RETIRED. The app moved to a static export (so the same
// build bundles into the Capacitor native app), which drops the `/api/data`
// route handler that this layer talked to. localStorage stays the offline-first
// source of truth and Supabase is the cloud layer (auth, plan, session, PR, BP).
//
// This module is kept as a thin, inert shim so `useCloudSync` (and the
// dashboard's `dataVersion` wiring) compile unchanged: `sync()` is now a no-op.
// The token getters/setters remain for the (hidden) CloudSyncCard surface.

const TOKEN_KEY = 'pump-sync-token';
const LAST_SYNCED_KEY = 'pump-sync-last';

export type SyncStatus =
  | 'unconfigured'   // sync retired — always this now
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'unauthorized'
  | 'error';

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

export interface SyncResult {
  status: SyncStatus;
  changed: boolean;
}

// No-op: the Upstash round trip is gone. Returns 'unconfigured' so the hook
// settles into an idle state and never bumps dataVersion.
export async function sync(): Promise<SyncResult> {
  return { status: 'unconfigured', changed: false };
}

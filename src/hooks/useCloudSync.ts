'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sync, getSyncToken, setSyncToken, getLastSynced, type SyncStatus } from '@/lib/sync';

const CHANGE_DEBOUNCE_MS = 3000;
const FOCUS_THROTTLE_MS = 10000;

export interface CloudSync {
  status: SyncStatus;
  lastSynced: string | null;
  hasToken: boolean;
  // Bumps whenever a sync pulls in remote changes. Used as a remount key on
  // the dashboard so freshly-merged data is reflected without a full reload.
  dataVersion: number;
  syncNow: () => void;
  saveToken: (token: string) => void;
}

export function useCloudSync(): CloudSync {
  const [status, setStatus] = useState<SyncStatus>(() =>
    getSyncToken() ? 'syncing' : 'unconfigured'
  );
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const inFlight = useRef(false);
  const lastFocusSync = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    if (!getSyncToken()) { setStatus('unconfigured'); return; }
    inFlight.current = true;
    setStatus('syncing');
    const result = await sync();
    inFlight.current = false;
    setStatus(result.status);
    setLastSynced(getLastSynced());
    if (result.changed) setDataVersion((v) => v + 1);
  }, []);

  // Initial sync + change/focus listeners. Set up once.
  useEffect(() => {
    setHasToken(!!getSyncToken());
    setLastSynced(getLastSynced());
    void run();

    const onChange = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => void run(), CHANGE_DEBOUNCE_MS);
    };
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusSync.current < FOCUS_THROTTLE_MS) return;
      lastFocusSync.current = now;
      void run();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') onFocus(); };

    window.addEventListener('pump:changed', onChange);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      window.removeEventListener('pump:changed', onChange);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [run]);

  const syncNow = useCallback(() => { void run(); }, [run]);

  const saveToken = useCallback((token: string) => {
    setSyncToken(token);
    setHasToken(!!getSyncToken());
    void run();
  }, [run]);

  return { status, lastSynced, hasToken, dataVersion, syncNow, saveToken };
}

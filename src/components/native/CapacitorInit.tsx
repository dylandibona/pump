'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Native-only init. No-ops on web (the PWA is untouched). Runs once on mount.
// Currently: keep the web view BELOW the status bar so the app header isn't
// hidden behind the clock / Dynamic Island (the reported "header behind the
// iPhone top readout" bug). More native setup (e.g. hiding the Capacitor splash)
// can hang off this later.
export function CapacitorInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        // overlay:false → content starts under the status bar, matching the PWA.
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Dark text — the app chrome is light.
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* plugin unavailable (e.g. web) — ignore */
      }
    })();
  }, []);
  return null;
}

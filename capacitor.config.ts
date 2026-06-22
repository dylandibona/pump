import type { CapacitorConfig } from '@capacitor/cli';

// PUMP native shell. The web build is a Next.js static export (`output: 'export'`
// → `out/`), bundled into the iOS app so it runs offline-first, same as the PWA.
// Native capabilities (Bluetooth HR for the COROS strap) are added as Capacitor
// plugins on top of the existing web app — no rewrite.
const config: CapacitorConfig = {
  appId: 'com.dylandibona.pump',
  appName: 'PUMP',
  webDir: 'out',
};

export default config;

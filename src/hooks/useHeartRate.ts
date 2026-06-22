'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Standard BLE Heart Rate Service + Measurement characteristic (the COROS strap
// broadcasts these, like every standard HR sensor — so no vendor SDK needed).
const HR_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HR_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';

export type HRStatus = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'error';

// Heart Rate Measurement (0x2A37): byte 0 is flags; bit 0 picks the value width.
function parseHeartRate(value: DataView): number {
  const flags = value.getUint8(0);
  return flags & 0x1 ? value.getUint16(1, true) : value.getUint8(1);
}

export interface HeartRate {
  supported: boolean;       // native only — Web Bluetooth isn't available in the iOS PWA
  status: HRStatus;
  bpm: number | null;       // live beats per minute
  deviceName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

// Live heart-rate from a BLE strap, native-only. The plugin is dynamically
// imported inside the native guard so it never enters the web/PWA bundle path.
export function useHeartRate(): HeartRate {
  const supported = Capacitor.isNativePlatform();
  const [status, setStatus] = useState<HRStatus>(supported ? 'idle' : 'unsupported');
  const [bpm, setBpm] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  const disconnect = useCallback(async () => {
    const id = deviceIdRef.current;
    deviceIdRef.current = null;
    setBpm(null);
    setDeviceName(null);
    setStatus(supported ? 'idle' : 'unsupported');
    if (!supported || !id) return;
    try {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.stopNotifications(id, HR_SERVICE, HR_MEASUREMENT).catch(() => {});
      await BleClient.disconnect(id).catch(() => {});
    } catch {
      /* plugin unavailable */
    }
  }, [supported]);

  const connect = useCallback(async () => {
    if (!supported) { setStatus('unsupported'); return; }
    try {
      setStatus('connecting');
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.initialize();
      // OS picker filtered to heart-rate sensors.
      const device = await BleClient.requestDevice({ services: [HR_SERVICE] });
      deviceIdRef.current = device.deviceId;
      setDeviceName(device.name ?? 'HR monitor');
      await BleClient.connect(device.deviceId, () => {
        // Strap dropped the connection.
        deviceIdRef.current = null;
        setBpm(null);
        setStatus('idle');
      });
      await BleClient.startNotifications(device.deviceId, HR_SERVICE, HR_MEASUREMENT, (value) => {
        setBpm(parseHeartRate(value));
      });
      setStatus('connected');
    } catch (err) {
      // Picker cancelled or connection failed — return to idle (the button
      // simply reappears). Logged for debugging on device.
      console.warn('HR connect failed/cancelled:', err);
      deviceIdRef.current = null;
      setStatus('idle');
    }
  }, [supported]);

  // Tear down the connection if the consumer unmounts.
  useEffect(() => {
    return () => { void disconnect(); };
  }, [disconnect]);

  return { supported, status, bpm, deviceName, connect, disconnect };
}

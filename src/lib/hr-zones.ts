// Dylan's heart-rate zones (BPM). Single-user app — edit here if they change.
// Source: trainer-defined zones (Reboot Block).
export interface HrZone {
  zone: number;   // 1–5
  name: string;
  min: number;    // inclusive lower bound (bpm)
  max: number;    // inclusive upper bound (bpm)
  color: string;  // data-viz color for the zone bar
}

export const HR_ZONES: HrZone[] = [
  { zone: 1, name: 'Recovery',  min: 0,   max: 119, color: '#3B82F6' }, // blue
  { zone: 2, name: 'Aerobic',   min: 120, max: 141, color: '#22C55E' }, // green — the target
  { zone: 3, name: 'Tempo',     min: 142, max: 155, color: '#EAB308' }, // yellow
  { zone: 4, name: 'Threshold', min: 156, max: 165, color: '#F97316' }, // orange
  { zone: 5, name: 'VO2max',    min: 166, max: 999, color: '#EF4444' }, // red
];

// Index (0-based) of the zone a bpm falls into.
export function zoneIndexForBpm(bpm: number): number {
  for (let i = HR_ZONES.length - 1; i >= 0; i--) {
    if (bpm >= HR_ZONES[i].min) return i;
  }
  return 0;
}

export function zoneForBpm(bpm: number): HrZone {
  return HR_ZONES[zoneIndexForBpm(bpm)];
}

// "Z2 24:10 · Z3 4:30 …" — only zones with time. For the BRIEF + compact display.
export function formatZoneSeconds(zoneSeconds: number[]): string {
  return HR_ZONES
    .map((z, i) => ({ z, sec: zoneSeconds[i] ?? 0 }))
    .filter((x) => x.sec > 0)
    .map(({ z, sec }) => `Z${z} ${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`)
    .join(' · ');
}

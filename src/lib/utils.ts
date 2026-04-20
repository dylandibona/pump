import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse a YYYY-MM-DD session-date string as a LOCAL Date (midnight local).
//
// `new Date("2026-04-20")` is treated as UTC midnight by the spec. In any
// timezone west of UTC that shifts to the previous calendar day once you
// format it — which is why every workout was displaying a day early.
// Session dates are stored as local YYYY-MM-DD strings (see
// SessionStart.formatDate), so this helper rehydrates them as local for
// display. Single source of truth for that conversion.
export function parseSessionDate(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) {
    // ISO timestamp or non-standard — let Date handle it normally.
    return new Date(dateStr);
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

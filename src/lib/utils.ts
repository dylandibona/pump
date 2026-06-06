import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TrainerPlan, WorkoutSession } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Display name for a session. Prefer the plan-session name (e.g. "Push Day" /
// "Lower + Core") when the session was launched from a plan — matched by the
// stable planSessionId stored at start, not a name-overlap heuristic. Falls
// back to a capitalized type for free-form sessions. Single source of truth so
// the dashboard, history list, and session detail all label consistently.
export function sessionLabel(session: WorkoutSession, plan: TrainerPlan | null): string {
  if (session.planSessionId && plan) {
    const ps = plan.sessions.find(p => p.id === session.planSessionId);
    if (ps) return ps.name;
  }
  return session.type === 'gym' ? 'Gym' : 'Cardio';
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

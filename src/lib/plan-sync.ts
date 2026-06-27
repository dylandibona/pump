// Pull the coach's active plan from Supabase and save it through the existing
// local plan path. This replaces the manual paste step as the PRIMARY way a
// plan reaches the app — PlanLoader paste stays as a fallback.
//
// Safety (pump_build_spec_v2.md §2): a plan change never alters a session
// already in progress. The plan lives in its own localStorage key
// (`dylan-workout-plan`); running sessions carry their own copied exercises,
// so replacing the plan here can't reach into an active workout.
//
// Inert when Supabase is unconfigured (returns null) so the app still runs
// localStorage-only.
import { supabase, isSupabaseConfigured } from './supabase';
import { validateAndNormalizePlan } from './plan-validation';
import { getPlan, savePlan } from './storage';
import type { TrainerPlan } from './types';

export interface FetchPlanResult {
  plan: TrainerPlan | null;
  changed: boolean; // true when a newer/different plan was saved locally
  error?: string;
}

// Separate key for the row-level version integer. Keeps it out of the plan
// JSON blob so validateAndNormalizePlan never strips it, and the freshness
// check survives a plan that bumps its internal `version` string inconsistently.
const ROW_VERSION_KEY = 'pump-plan-row-version';

function getSavedRowVersion(): number {
  try {
    return parseInt(localStorage.getItem(ROW_VERSION_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveRowVersion(v: number): void {
  try {
    localStorage.setItem(ROW_VERSION_KEY, String(v));
  } catch {}
}

// Fetch the single active plan (is_active = true). Uses maybeSingle so "no
// active plan" is a clean null rather than an error. Skips the local write
// when the active plan already matches (same planId + row version) to avoid
// needless change events / sync churn.
export async function fetchActivePlan(): Promise<FetchPlanResult> {
  if (!isSupabaseConfigured) return { plan: null, changed: false };

  const { data, error } = await supabase
    .from('plans')
    .select('json, version')
    .eq('is_active', true)
    .maybeSingle();

  if (error) return { plan: null, changed: false, error: error.message };
  if (!data?.json) return { plan: null, changed: false };

  const { plan, errors } = validateAndNormalizePlan(data.json);
  if (!plan) {
    return { plan: null, changed: false, error: errors.join('; ') };
  }

  // Use the row-level version column as the authoritative freshness signal so a
  // plan update is picked up even when the json blob's internal version wasn't bumped.
  const rowVersion: number = data.version ?? 0;
  const current = getPlan();
  if (current && current.planId === plan.planId && rowVersion === getSavedRowVersion()) {
    return { plan: current, changed: false };
  }

  saveRowVersion(rowVersion);
  savePlan(plan);
  return { plan, changed: true };
}

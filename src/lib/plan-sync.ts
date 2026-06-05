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

// Fetch the single active plan (is_active = true). Uses maybeSingle so "no
// active plan" is a clean null rather than an error. Skips the local write
// when the active plan already matches (same planId + version) to avoid
// needless change events / sync churn.
export async function fetchActivePlan(): Promise<FetchPlanResult> {
  if (!isSupabaseConfigured) return { plan: null, changed: false };

  const { data, error } = await supabase
    .from('plans')
    .select('json')
    .eq('is_active', true)
    .maybeSingle();

  if (error) return { plan: null, changed: false, error: error.message };
  if (!data?.json) return { plan: null, changed: false };

  const { plan, errors } = validateAndNormalizePlan(data.json);
  if (!plan) {
    return { plan: null, changed: false, error: errors.join('; ') };
  }

  const current = getPlan();
  if (current && current.planId === plan.planId && current.version === plan.version) {
    return { plan: current, changed: false };
  }

  savePlan(plan);
  return { plan, changed: true };
}

// Supabase browser client — PUMP is a pure client-rendered PWA, so we use the
// plain supabase-js client (not @supabase/ssr). Its defaults already do what we
// need: persistSession + autoRefreshToken (session lives in localStorage, so a
// magic-link login is one-time and auto-restores) and detectSessionInUrl (the
// magic-link token in the URL hash is consumed on load).
//
// The publishable key is public by design; Row Level Security on the DD Health
// Supabase project is what actually protects the data. This is health data, so
// keep RLS tight (see pump_build_spec_v2.md §1).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when both env vars are present — lets the app degrade gracefully
// (auth gate falls through, UI falls back to PlanLoader paste) instead of
// crashing when unconfigured.
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // NEXT_PUBLIC_* are inlined at build time — a missing value means a rebuild
  // is needed after setting them in Vercel.
  console.warn(
    'Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (rebuild after changing them). Running localStorage-only.',
  );
}

// IMPORTANT: createClient throws on an empty URL, so only construct the client
// when configured. Every call site must guard on `isSupabaseConfigured` before
// touching `supabase` (the cast keeps types clean without littering null checks
// inside guarded branches).
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : (null as unknown as SupabaseClient);

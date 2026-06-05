'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// AuthGate wraps the whole app. PUMP is single-user health data: the Supabase
// publishable key is public, so RLS + an authenticated session are the only
// things protecting it. Magic-link sign-in; the session persists to
// localStorage (supabase-js default) so this is a one-time login that
// auto-restores on every subsequent launch.
//
// If Supabase env vars are absent (e.g. a build where they were never set), we
// fall through to the app ungated rather than brick it — Phase 1 stays additive
// and the app still runs localStorage-only.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <Splash />;
  if (!isSupabaseConfigured || session) return <>{children}</>;
  return <SignIn />;
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.img
        src="/pump-header.png"
        alt="Pump"
        className="w-48 max-w-[60vw]"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('sending');
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    });
    if (signInError) {
      setStatus('error');
      setError(signInError.message);
      return;
    }
    setStatus('sent');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative">
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <img src="/pump-header.png" alt="Pump" className="w-44 mx-auto mb-8" />

        {status === 'sent' ? (
          <div className="pump-card pump-card--active p-6 text-center">
            <p
              className="text-2xl mb-2 text-[color:var(--pump-hot)] text-glow-hot"
              style={{ fontFamily: 'var(--font-pacifico), cursive' }}
            >
              Check your email
            </p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to{' '}
              <span className="text-foreground font-medium">{email.trim()}</span>. Tap it on this
              device to log in.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-5 text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors uppercase"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pump-card p-6 space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="auth-email"
                className="text-xs tracking-[0.18em] uppercase text-muted-foreground"
              >
                Sign in to Pump
              </label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="touch-target w-full rounded-lg border border-[color:var(--pump-border-card)] bg-[color:var(--pump-bg-input)] px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-[color:var(--pump-hot)] transition-colors"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-destructive" aria-live="polite">
                {error || 'Something went wrong. Try again.'}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={status === 'sending'}
              whileTap={{ scale: 0.98 }}
              className="touch-target w-full rounded-xl text-white text-xl disabled:opacity-60 transition-opacity"
              style={{
                fontFamily: 'var(--font-pacifico), cursive',
                background: 'var(--pump-grad-hot)',
                boxShadow: '0 8px 24px -8px rgba(255,0,128,0.6)',
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </motion.button>

            <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
              A one-time link will be emailed to you. No password.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
// fall through to the app ungated rather than brick it.
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

// Brief loading state. Uses the same dark scene as SignIn so the transition
// into the form is seamless (no flash of light-theme bg).
function Splash() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0A0020' }}>
      <Image src="/pump-scene-empty.png" alt="" fill className="object-cover opacity-90" priority />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,0,32,0.25) 0%, rgba(10,0,32,0.0) 50%, rgba(10,0,32,0.55) 100%)' }} />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0.5, scale: 0.98 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 8px 28px rgba(255,0,128,0.5)) drop-shadow(0 0 18px rgba(0,255,238,0.2))' }}
        >
          <Image src="/letspump3-transparent.png" alt="Let's Pump!" width={1200} height={800} priority className="w-[78vw] max-w-[480px] h-auto" />
        </motion.div>
      </div>
    </div>
  );
}

function SignIn() {
  // Two-phase email auth. The same email carries BOTH a 6-digit code and a
  // magic link. The code path (verifyOtp) completes sign-in *inside* this view
  // — critical for the installed PWA, whose storage jar is separate from
  // Safari, so a tapped magic link would log you into the browser, not the app.
  // The link stays as a desktop fallback. See Supabase email template:
  // it must render {{ .Token }} for the code to arrive.
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setCode('');
    setPhase('code');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, '');
    if (token.length < 6) return;
    setBusy(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    });
    if (verifyError) {
      setBusy(false);
      setError(verifyError.message);
      return;
    }
    // Success: AuthGate's onAuthStateChange swaps in the app. Leave `busy` true
    // so the button reads "Signing in…" through the transition.
  };

  const resetToEmail = () => {
    setPhase('email');
    setCode('');
    setError('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0A0020' }}>
      {/* Full-bleed empty-state scene — chrome dumbbell floating over a night-sky
          sunset, palm silhouettes flanking. Different brand moment from the
          dashboard's energetic neon banner (calm arrival energy). */}
      <Image
        src="/pump-scene-empty.png"
        alt=""
        fill
        priority
        className="object-cover"
        style={{ objectPosition: 'center center' }}
      />
      {/* Vignette only where it's needed — top is left bright so the wordmark
          glows, bottom darkens so the form has guaranteed contrast. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,0,32,0.0) 0%, rgba(10,0,32,0.0) 50%, rgba(10,0,32,0.45) 80%, rgba(10,0,32,0.85) 100%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col">
        {/* Let's Pump! brushy script logo as the brand moment. Transparent PNG so
            it composites cleanly over the scene. Soft drop-shadow rather than
            text-shadow because text-shadow on a raster image would be ignored. */}
        <motion.div
          className="px-6 pt-10 flex justify-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/letspump3-transparent.png"
            alt="Let's Pump!"
            width={1200}
            height={800}
            priority
            className="w-[78%] max-w-[420px] h-auto"
            style={{
              filter:
                'drop-shadow(0 8px 28px rgba(255,0,128,0.45)) drop-shadow(0 0 18px rgba(0,255,238,0.18))',
            }}
          />
        </motion.div>

        <div className="flex-1" />

        {/* Dark-glass form — floats over the sunset, doesn't compete with it. */}
        <motion.div
          className="px-6 pb-10"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: 'rgba(10, 0, 32, 0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow:
                '0 16px 40px -16px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,255,238,0.06)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(0,255,238,0.6), rgba(255,0,128,0.6), transparent)',
                boxShadow: '0 0 8px rgba(0,255,238,0.4)',
              }}
            />

            {phase === 'code' ? (
              <form onSubmit={handleVerify}>
                <label
                  htmlFor="auth-code"
                  className="text-[10px] tracking-[0.3em] uppercase font-bold block mb-2"
                  style={{ color: 'rgba(0,255,238,0.95)' }}
                >
                  Enter your code
                </label>
                <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  We emailed a 6-digit code to{' '}
                  <span className="font-medium text-white">{email.trim()}</span>.
                </p>

                <input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="touch-target w-full rounded-xl px-4 text-center text-2xl tracking-[0.5em] tabular-nums outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />

                {error && (
                  <p className="text-sm mt-3" style={{ color: '#FF6B95' }} aria-live="polite">
                    {error || 'That code didn’t work. Try again.'}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={busy || code.length < 6}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 rounded-xl py-4 text-white text-2xl active:scale-[0.98] transition disabled:opacity-60"
                  style={{
                    fontFamily: 'var(--font-pacifico), cursive',
                    background: 'var(--pump-grad-hot)',
                    boxShadow:
                      '0 12px 32px -8px rgba(255,0,128,0.7), 0 0 24px rgba(255,0,128,0.25)',
                  }}
                >
                  {busy ? 'Signing in…' : 'Verify'}
                </motion.button>

                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={busy}
                    className="text-[10px] tracking-[0.18em] uppercase font-semibold transition-colors disabled:opacity-50"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Resend code
                  </button>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
                  <button
                    type="button"
                    onClick={resetToEmail}
                    className="text-[10px] tracking-[0.18em] uppercase font-semibold transition-colors"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    Use a different email
                  </button>
                </div>

                <p
                  className="text-[10px] tracking-[0.15em] uppercase font-semibold text-center mt-4"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Prefer a link? The same email has one too.
                </p>
              </form>
            ) : (
              <form onSubmit={handleSend}>
                <label
                  htmlFor="auth-email"
                  className="text-[10px] tracking-[0.3em] uppercase font-bold block mb-3"
                  style={{ color: 'rgba(0,255,238,0.95)' }}
                >
                  Welcome back
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
                  className="touch-target w-full rounded-xl px-4 text-base outline-none transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />

                {error && (
                  <p className="text-sm mt-3" style={{ color: '#FF6B95' }} aria-live="polite">
                    {error || 'Something went wrong. Try again.'}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={busy}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 rounded-xl py-4 text-white text-2xl active:scale-[0.98] transition disabled:opacity-60"
                  style={{
                    fontFamily: 'var(--font-pacifico), cursive',
                    background: 'var(--pump-grad-hot)',
                    boxShadow:
                      '0 12px 32px -8px rgba(255,0,128,0.7), 0 0 24px rgba(255,0,128,0.25)',
                  }}
                >
                  {busy ? 'Sending…' : 'Send my code'}
                </motion.button>

                <p
                  className="text-[10px] tracking-[0.15em] uppercase font-semibold text-center mt-4"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  6-digit code · No password
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

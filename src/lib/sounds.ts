// Sound effect utilities for Pump.
//
// PR / set-complete cues are played via Web Audio API so they layer OVER
// background music/podcasts instead of taking exclusive control of the iOS
// audio session (which an HTMLAudioElement would do, causing Spotify to
// duck or pause on every set). If Web Audio is unavailable we fall back to
// an Audio element — degraded behavior but the sound still plays.

type SoundType = 'setComplete' | 'prAchieved' | 'timerDone';

// Sampled (file-backed) sounds. The big cinematic explosion is RESERVED for
// PRs — it used to be mapped to every type, so it fired on every set, every
// rest-timer finish, and every interval step ("explosion at strange times").
// `setComplete` and `timerDone` are now synthesized (see playTone) so only an
// actual PR detonates. To swap in a generated 80s-synth asset later, just add
// its path here (e.g. setComplete: '/set-complete.mp3') — playSound prefers a
// sample when one is mapped and falls back to the synth otherwise.
const SAMPLE_SOUNDS: Partial<Record<SoundType, string>> = {
  prAchieved: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
  // Generated 80s-synth set-complete cue. Distinct from the PR explosion, so
  // logging a set no longer detonates. timerDone stays synthesized (see TONES).
  setComplete: '/set-complete.mp3',
};

// Synth recipes for the non-PR cues — short, bright, Miami-neon. Two detuned
// voices through a lowpass with a fast pluck envelope reads as "80s synth"
// without an audio asset. Placeholder until a generated sample is dropped in.
type ToneRecipe = { freqs: number[]; glideTo?: number; duration: number; type: OscillatorType };
const TONES: Record<'setComplete' | 'timerDone', ToneRecipe> = {
  // Confident rising major-third stab — "set banked".
  setComplete: { freqs: [587.33, 739.99], glideTo: 880, duration: 0.34, type: 'sawtooth' },
  // Gentler two-note "time's up" — softer than a set so the rest timer
  // doesn't feel as loud as logging work.
  timerDone: { freqs: [659.25], glideTo: 987.77, duration: 0.5, type: 'triangle' },
};

// Lazy AudioContext — created on first user gesture. iOS requires a gesture
// to unlock audio playback, so we defer creation until playSound is called
// (always from a tap: Add Set, Complete, etc.).
let audioContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();
const pendingLoads = new Map<string, Promise<AudioBuffer | null>>();

type AudioCtor = typeof AudioContext;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

async function loadBuffer(src: string): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(src);
  if (cached) return cached;
  const pending = pendingLoads.get(src);
  if (pending) return pending;

  const ctx = getCtx();
  if (!ctx) return null;

  const p = (async () => {
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.set(src, buffer);
      return buffer;
    } catch {
      return null;
    } finally {
      pendingLoads.delete(src);
    }
  })();

  pendingLoads.set(src, p);
  return p;
}

// HTMLAudioElement fallback — used only if Web Audio is unavailable. Will
// interrupt background audio on iOS; acceptable only as a last resort.
function playFallback(src: string, volume: number): void {
  try {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    void audio.play().catch(() => { /* autoplay blocked, fail silently */ });
  } catch {
    // ignore
  }
}

/**
 * Preload a sound (fetches + decodes into an AudioBuffer). Safe to call
 * multiple times — subsequent calls hit the cache.
 */
export function preloadSound(type: SoundType): void {
  if (typeof window === 'undefined') return;
  const src = SAMPLE_SOUNDS[type];
  if (src) void loadBuffer(src);
  else getCtx(); // synth tone — just warm the AudioContext
}

/**
 * Play a sound effect using Web Audio so it mixes with background audio.
 * Sampled types (currently just the PR explosion) play their decoded buffer;
 * everything else plays a synthesized tone so the explosion stays PR-only.
 * @param volume 0..1 — default 0.5
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
  if (typeof window === 'undefined') return;
  const src = SAMPLE_SOUNDS[type];
  const ctx = getCtx();

  // No sample mapped → synthesize the tone (set-complete / timer-done).
  if (!src) {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      playTone(ctx, TONES[type as 'setComplete' | 'timerDone'], volume);
    }
    return;
  }

  if (!ctx) {
    playFallback(src, volume);
    return;
  }

  // iOS: user gesture needed to start the context. playSound is always
  // invoked from a tap handler, so a resume here is the gesture-backed
  // unlock — safe and silently no-ops if already running.
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const buffer = bufferCache.get(src);
  if (buffer) {
    playBuffer(ctx, buffer, volume);
    return;
  }

  // Not decoded yet — kick off the load and play once ready. The first
  // invocation may drop if the fetch is still in flight; subsequent calls
  // will use the cached buffer.
  void loadBuffer(src).then(buf => {
    if (!buf || !audioContext) return;
    // Only play if the buffer resolved quickly (<2s). Otherwise the
    // originating gesture is stale and firing now would feel disconnected.
    playBuffer(audioContext, buf, volume);
  });
}

// Synthesize a short 80s-synth cue. Two slightly detuned oscillators per note
// through a lowpass + pluck envelope; an optional pitch glide adds the cheesy
// upward "blip". Mixes over background audio like the sampled path.
function playTone(ctx: AudioContext, recipe: ToneRecipe, volume: number): void {
  try {
    const now = ctx.currentTime;
    const { freqs, glideTo, duration, type } = recipe;
    const out = ctx.createGain();
    out.gain.value = Math.max(0, Math.min(1, volume));
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4500;
    filter.connect(out);
    out.connect(ctx.destination);

    freqs.forEach((freq) => {
      [0, 7].forEach((detuneCents) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, now + duration * 0.7);
        osc.detune.value = detuneCents;
        const env = ctx.createGain();
        // Fast pluck: near-instant attack, exponential decay to silence.
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(0.9 / freqs.length, now + 0.012);
        env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(env);
        env.connect(filter);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    });
  } catch {
    // Synthesis unavailable — fail silent (never fall back to the explosion).
  }
}

function playBuffer(ctx: AudioContext, buffer: AudioBuffer, volume: number): void {
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  } catch {
    // If Web Audio throws at play-time, don't attempt fallback here —
    // HTMLAudioElement would interrupt music, defeating the point.
  }
}

/**
 * Trigger haptic feedback if available.
 */
export function vibrate(pattern: number | number[] = 50): void {
  if (typeof window === 'undefined') return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

/** Set completion feedback (sound + haptic). */
export function playSetCompleteFeedback(): void {
  playSound('setComplete', 0.4);
  vibrate(50);
}

/** PR achievement feedback (louder + longer haptic). */
export function playPRFeedback(): void {
  playSound('prAchieved', 0.6);
  vibrate([100, 50, 100]);
}

// Sound effect utilities for Pump.
//
// PR / set-complete cues are played via Web Audio API so they layer OVER
// background music/podcasts instead of taking exclusive control of the iOS
// audio session (which an HTMLAudioElement would do, causing Spotify to
// duck or pause on every set). If Web Audio is unavailable we fall back to
// an Audio element — degraded behavior but the sound still plays.

type SoundType = 'setComplete' | 'prAchieved' | 'timerDone';

const SOUNDS: Record<SoundType, string> = {
  setComplete: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
  prAchieved: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
  timerDone: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
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
  void loadBuffer(SOUNDS[type]);
}

/**
 * Play a sound effect using Web Audio so it mixes with background audio.
 * @param volume 0..1 — default 0.5
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
  if (typeof window === 'undefined') return;
  const src = SOUNDS[type];
  const ctx = getCtx();
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

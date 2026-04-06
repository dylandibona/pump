// Sound effect utilities for Pump

type SoundType = 'setComplete' | 'prAchieved' | 'timerDone';

const SOUNDS: Record<SoundType, string> = {
  setComplete: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
  prAchieved: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
  timerDone: '/Short But Huge, Very Action Bomb Movie Explosion.mp3',
};

let audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preload a sound file for faster playback
 */
export function preloadSound(type: SoundType): void {
  if (typeof window === 'undefined') return;

  const src = SOUNDS[type];
  if (!audioCache[src]) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache[src] = audio;
  }
}

/**
 * Play a sound effect
 * @param type - The type of sound to play
 * @param volume - Volume level from 0 to 1 (default: 0.5)
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
  if (typeof window === 'undefined') return;

  const src = SOUNDS[type];

  try {
    // Create new audio instance for overlapping sounds
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
      console.log('Sound playback blocked by browser');
    });
  } catch (error) {
    console.log('Sound playback error:', error);
  }
}

/**
 * Trigger haptic feedback if available
 * @param pattern - Vibration pattern in milliseconds
 */
export function vibrate(pattern: number | number[] = 50): void {
  if (typeof window === 'undefined') return;

  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail if vibration not supported
    }
  }
}

/**
 * Play set completion feedback (sound + haptic)
 */
export function playSetCompleteFeedback(): void {
  playSound('setComplete', 0.4);
  vibrate(50);
}

/**
 * Play PR achievement feedback (louder + longer haptic)
 */
export function playPRFeedback(): void {
  playSound('prAchieved', 0.6);
  vibrate([100, 50, 100]);
}

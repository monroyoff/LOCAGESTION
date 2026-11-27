'use client';

/**
 * Service Universel de Notification Sonore & Rétroaction Haptique (LOCAGESTION)
 * Fournit un carillon cristallin, agréable et moderne sur toute la plateforme :
 * - Web (Desktop & Laptops)
 * - Mobile (iOS Safari & Android Chrome)
 * - PWA (Progressive Web App installée)
 * - TWA Android (Google Play Store)
 */

class SoundServiceImpl {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private lastPlayedAt: number = 0;
  private audioFallback: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initListeners();
    }
  }

  /**
   * Initialise les écouteurs de déverrouillage de l'audio lors de la première interaction utilisateur
   */
  private initListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.unlockAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });

    // Écouteur d'événement global pour déclencher le son depuis n'importe quel composant
    window.addEventListener('locagestion:play_sound', () => {
      this.playNotificationSound();
    });
  }

  /**
   * Déverrouille le contexte audio (nécessaire selon les règles de sécurité autoplay des navigateurs)
   */
  public unlockAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      this.isUnlocked = true;
    } catch {
      // Ignorer si non supporté
    }
  }

  /**
   * Joue le carillon harmonique de notification universel
   */
  public playNotificationSound() {
    if (typeof window === 'undefined') return;

    // Débouncing anti-cacophonie : minimum 200ms entre deux sons
    const now = Date.now();
    if (now - this.lastPlayedAt < 200) {
      return;
    }
    this.lastPlayedAt = now;

    // 1. Rétroaction tactile haptique sur smartphone (si supporté)
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([60, 30, 60]);
      }
    } catch {}

    // 2. Synthèse sonore Web Audio API haute fidélité (zéro latence réseau, zéro dépendance)
    let synthesized = false;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }

      if (this.audioCtx) {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }

        const ctx = this.audioCtx;
        const currentTime = ctx.currentTime;

        // Note 1 : G5 (784 Hz) - Doux son d'appel
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(784, currentTime);

        gain1.gain.setValueAtTime(0, currentTime);
        gain1.gain.linearRampToValueAtTime(0.25, currentTime + 0.015);
        gain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.09);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(currentTime);
        osc1.stop(currentTime + 0.1);

        // Note 2 : C6 (1046.5 Hz) avec harmonique cristalline E6 (1318.5 Hz) - Résonance principale
        const osc2 = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, currentTime + 0.08);

        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(2093, currentTime + 0.08);

        gain2.gain.setValueAtTime(0, currentTime + 0.08);
        gain2.gain.linearRampToValueAtTime(0.35, currentTime + 0.095);
        gain2.gain.exponentialRampToValueAtTime(0.0001, currentTime + 0.45);

        osc2.connect(gain2);
        oscHarmonic.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(currentTime + 0.08);
        oscHarmonic.start(currentTime + 0.08);
        osc2.stop(currentTime + 0.46);
        oscHarmonic.stop(currentTime + 0.46);

        synthesized = true;
      }
    } catch (e) {
      synthesized = false;
    }

    // 3. Fallback direct via balise Audio si Web Audio API est bloqué
    if (!synthesized) {
      try {
        if (!this.audioFallback) {
          this.audioFallback = new Audio('/sounds/notification.wav');
          this.audioFallback.volume = 0.5;
        }
        this.audioFallback.currentTime = 0;
        this.audioFallback.play().catch(() => {});
      } catch {}
    }
  }
}

export const SoundService = new SoundServiceImpl();

/**
 * Fonction raccourci exportée utilisable partout
 */
export function playNotificationSound() {
  SoundService.playNotificationSound();
}

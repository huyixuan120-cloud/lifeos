"use client";

import { useCallback, useRef } from "react";

/**
 * Sound types for different notifications
 */
export type SoundType = "work_complete" | "break_complete";

/**
 * Simple notification sounds using Web Audio API
 * More reliable than loading external MP3 files
 */
class SoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize AudioContext only in browser
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a satisfying "ding" sound for work completion
   */
  playWorkComplete() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create oscillator for a pleasant bell sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Bell-like frequency progression
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    // Fade out envelope
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  /**
   * Play a softer sound for break completion
   */
  playBreakComplete() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create two oscillators for a softer, harmonious sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Softer frequencies
    osc1.frequency.setValueAtTime(400, now);
    osc2.frequency.setValueAtTime(600, now);

    // Gentle fade
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  }
}

/**
 * Custom hook for playing notification sounds
 *
 * @example
 * ```tsx
 * const { playSound } = useSound();
 *
 * // When focus session completes
 * playSound("work_complete");
 *
 * // When break completes
 * playSound("break_complete");
 * ```
 */
export function useSound() {
  const soundGeneratorRef = useRef<SoundGenerator | null>(null);

  // Initialize sound generator on first use
  if (soundGeneratorRef.current === null && typeof window !== "undefined") {
    soundGeneratorRef.current = new SoundGenerator();
  }

  const playSound = useCallback((type: SoundType) => {
    const generator = soundGeneratorRef.current;
    if (!generator) return;

    try {
      if (type === "work_complete") {
        generator.playWorkComplete();
      } else if (type === "break_complete") {
        generator.playBreakComplete();
      }
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  }, []);

  return { playSound };
}

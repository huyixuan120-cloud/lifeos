"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { TimerSettings } from "@/types";
import type { User } from "@supabase/supabase-js";

interface UseTimerSettingsReturn {
  settings: TimerSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (settings: TimerSettings) => Promise<void>;
}

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  volume: 50,
  alarmSound: "bell",
};

const STORAGE_KEY = "lifeos_timer_settings";

/**
 * Custom hook for managing timer settings with Supabase
 *
 * Features:
 * - Fetches user's timer settings from Supabase (with RLS)
 * - Auto-creates default settings if none exist
 * - localStorage fallback for unauthenticated users
 * - Silent error handling
 *
 * @returns {UseTimerSettingsReturn} Settings state and operations
 *
 * @example
 * ```tsx
 * function SettingsModal() {
 *   const { settings, isLoading, updateSettings } = useTimerSettings();
 *
 *   const handleSave = async () => {
 *     await updateSettings({
 *       ...settings,
 *       pomodoroDuration: 30,
 *     });
 *   };
 *
 *   return <SettingsForm settings={settings} onSave={handleSave} />;
 * }
 * ```
 */
export function useTimerSettings(): UseTimerSettingsReturn {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  /**
   * Fetches timer settings for the current user
   * Uses localStorage fallback if not authenticated
   */
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user) {
        console.log("⚠️ No authenticated user - using localStorage");

        // Load from localStorage
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsedSettings = JSON.parse(stored);
              setSettings(parsedSettings);
            } catch (e) {
              // Invalid JSON, use defaults
              setSettings(DEFAULT_SETTINGS);
            }
          } else {
            setSettings(DEFAULT_SETTINGS);
          }
        }

        setIsLoading(false);
        return;
      }

      // Fetch existing settings from Supabase
      const { data, error: fetchError } = await supabase
        .from("pomodoro_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        // If no settings exist (404), create default settings
        if (fetchError.code === "PGRST116") {
          const { data: insertData, error: insertError } = await supabase
            .from("pomodoro_settings")
            .insert({
              user_id: user.id,
              pomodoro_duration: DEFAULT_SETTINGS.pomodoroDuration,
              short_break_duration: DEFAULT_SETTINGS.shortBreakDuration,
              long_break_duration: DEFAULT_SETTINGS.longBreakDuration,
              auto_start_breaks: DEFAULT_SETTINGS.autoStartBreaks,
              auto_start_pomodoros: DEFAULT_SETTINGS.autoStartPomodoros,
              volume: DEFAULT_SETTINGS.volume,
              alarm_sound: DEFAULT_SETTINGS.alarmSound,
            })
            .select()
            .single();

          if (insertError) {
            // Silent error handling - table doesn't exist, use defaults
            setSettings(DEFAULT_SETTINGS);
            setIsLoading(false);
            return;
          }

          setSettings(DEFAULT_SETTINGS);
        } else {
          // Silent error handling - use defaults
          setSettings(DEFAULT_SETTINGS);
        }

        setIsLoading(false);
        return;
      }

      if (data) {
        // Map database fields to TimerSettings type
        const mappedSettings: TimerSettings = {
          pomodoroDuration: data.pomodoro_duration,
          shortBreakDuration: data.short_break_duration,
          longBreakDuration: data.long_break_duration,
          autoStartBreaks: data.auto_start_breaks,
          autoStartPomodoros: data.auto_start_pomodoros,
          volume: data.volume,
          alarmSound: data.alarm_sound as TimerSettings["alarmSound"],
        };

        setSettings(mappedSettings);
      }
    } catch (err) {
      // Silent error handling - use defaults
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  /**
   * Updates timer settings (Supabase or localStorage)
   */
  const updateSettings = useCallback(
    async (newSettings: TimerSettings) => {
      try {
        // Check if user is authenticated
        if (!user) {
          console.log("⚠️ Not authenticated - saving to localStorage");

          // Save to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
          }

          // Update local state
          setSettings(newSettings);
          return;
        }

        // Update in Supabase
        const { error: updateError } = await supabase
          .from("pomodoro_settings")
          .update({
            pomodoro_duration: newSettings.pomodoroDuration,
            short_break_duration: newSettings.shortBreakDuration,
            long_break_duration: newSettings.longBreakDuration,
            auto_start_breaks: newSettings.autoStartBreaks,
            auto_start_pomodoros: newSettings.autoStartPomodoros,
            volume: newSettings.volume,
            alarm_sound: newSettings.alarmSound,
          })
          .eq("user_id", user.id);

        if (updateError) {
          // Silent error handling - save to localStorage instead
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
          }
        }

        // Update local state
        setSettings(newSettings);
      } catch (err) {
        // Silent error handling - save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        }
        setSettings(newSettings);
      }
    },
    [supabase, user]
  );

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch settings when user changes
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
}

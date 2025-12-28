"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { TimerSettings } from "@/types";

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

/**
 * Custom hook for managing timer settings with Supabase
 *
 * Features:
 * - Fetches user's timer settings from Supabase (with RLS)
 * - Auto-creates default settings if none exist
 * - Real-time sync across devices
 * - Replaces localStorage with database persistence
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

  const supabase = createClient();

  /**
   * Fetches timer settings for the current user
   * Creates default settings if none exist
   */
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      // Fetch existing settings
      const { data, error: fetchError } = await supabase
        .from("pomodoro_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        // If no settings exist (404), create default settings
        if (fetchError.code === "PGRST116") {
          const { error: insertError } = await supabase
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
            });

          if (insertError) {
            console.error("Error creating default settings:", insertError);
            setError(insertError.message);
            return;
          }

          setSettings(DEFAULT_SETTINGS);
        } else {
          console.error("Error fetching settings:", fetchError);
          setError(fetchError.message);
          return;
        }
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
      console.error("Unexpected error fetching settings:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Updates timer settings in Supabase
   */
  const updateSettings = useCallback(
    async (newSettings: TimerSettings) => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Not authenticated");
        }

        // Update in database
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
          console.error("Error updating settings:", updateError);
          throw updateError;
        }

        // Update local state
        setSettings(newSettings);
      } catch (err) {
        console.error("Failed to update settings:", err);
        throw err;
      }
    },
    [supabase]
  );

  // Fetch settings on mount
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

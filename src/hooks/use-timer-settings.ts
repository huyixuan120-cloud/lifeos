"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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

  // Get NextAuth session
  const { data: session, status } = useSession();
  const supabase = createClient();

  /**
   * Fetches timer settings for the current user
   * Creates default settings if none exist
   */
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for auth to finish loading
      if (status === "loading") {
        console.log("⏳ Auth loading - waiting...");
        return;
      }

      // Check if user is authenticated
      if (!session?.user) {
        console.log("⚠️ No authenticated user - using default settings");
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }

      console.log("📥 Fetching timer settings for user:", session.user.id);

      // Fetch existing settings
      const { data, error: fetchError } = await supabase
        .from("pomodoro_settings")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (fetchError) {
        // Silent error handling for empty errors or missing table
        const isEmpty = !fetchError.code && !fetchError.message && Object.keys(fetchError).length === 0;
        const isMissingTable = fetchError.code === '42P01';

        if (isEmpty || isMissingTable) {
          console.warn("⚠️ Timer settings table issue - using default settings");
          setSettings(DEFAULT_SETTINGS);
          setIsLoading(false);
          return;
        }

        // If no settings exist (404), create default settings
        if (fetchError.code === "PGRST116") {
          console.log("⚙️ No settings found, creating defaults for user:", session.user.id);

          const { data: insertData, error: insertError } = await supabase
            .from("pomodoro_settings")
            .insert({
              user_id: session.user.id,
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
            console.error("❌ Error creating default settings:");
            console.error("Error object:", insertError);
            console.error("Error code:", insertError.code);
            console.error("Error message:", insertError.message);
            console.error("Error details:", insertError.details);
            console.error("Error hint:", insertError.hint);
            console.error("Full error JSON:", JSON.stringify(insertError, null, 2));

            const errorMsg = insertError.message ||
              insertError.hint ||
              (insertError.code === "42P01" ? "Table 'pomodoro_settings' does not exist. Please run the SQL migration in Supabase." :
               "Failed to create default settings. Check Supabase RLS policies.");

            setError(errorMsg);
            return;
          }

          console.log("✅ Default settings created successfully:", insertData);
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
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, session, status]);

  /**
   * Updates timer settings in Supabase
   */
  const updateSettings = useCallback(
    async (newSettings: TimerSettings) => {
      try {
        // Check if auth is still loading
        if (status === "loading") {
          throw new Error("Authentication still loading. Please wait a moment.");
        }

        // Check if user is authenticated
        if (status === "unauthenticated" || !session?.user?.id) {
          console.error("❌ Not authenticated - status:", status);
          throw new Error("Not authenticated. Please sign in to update settings.");
        }

        console.log("📤 Updating timer settings for user:", session.user.id);

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
          .eq("user_id", session.user.id);

        if (updateError) {
          console.error("Error updating settings:", updateError);
          throw updateError;
        }

        // Update local state
        setSettings(newSettings);
        console.log("✅ Timer settings updated successfully");
      } catch (err) {
        console.error("Failed to update settings:", err);
        throw err;
      }
    },
    [supabase, session, status]
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

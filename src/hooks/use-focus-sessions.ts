"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@/utils/supabase/client";

interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  minutes: number;
  mode: "pomodoro" | "shortBreak" | "longBreak";
  completed: boolean;
  created_at: string;
}

interface CreateFocusSessionInput {
  task_id?: string | null;
  minutes: number;
  mode?: "pomodoro" | "shortBreak" | "longBreak";
  completed?: boolean;
}

interface UseFocusSessionsReturn {
  sessions: FocusSession[];
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  addSession: (sessionData: CreateFocusSessionInput) => Promise<void>;
  getTodaySessions: () => FocusSession[];
  getTotalMinutes: () => number;
}

/**
 * Custom hook for managing focus sessions with Supabase
 *
 * Provides operations for focus sessions:
 * - Fetch all sessions for user
 * - Add new focus session
 * - Get today's sessions
 * - Calculate total focus minutes
 *
 * @returns {UseFocusSessionsReturn} Session state and operations
 */
export function useFocusSessions(): UseFocusSessionsReturn {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get NextAuth session
  const { data: session, status } = useSession();
  const supabase = createClient();

  /**
   * Fetches all focus sessions for the current user
   */
  const fetchSessions = useCallback(async () => {
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
        console.log("⚠️ No authenticated user - skipping session fetch");
        setSessions([]);
        setIsLoading(false);
        return;
      }

      console.log("📥 Fetching focus sessions for user:", session.user.id);

      const { data, error: fetchError } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        // Silent error handling for empty errors or missing table
        const isEmpty = !fetchError.code && !fetchError.message && Object.keys(fetchError).length === 0;
        const isMissingTable = fetchError.code === 'PGRST116' || fetchError.code === '42P01';

        if (isEmpty) {
          console.warn("⚠️ Empty error from Supabase - table may not exist or RLS blocking");
          setSessions([]);
          setIsLoading(false);
          return;
        }

        if (isMissingTable) {
          console.error("❌ Table 'focus_sessions' does not exist in Supabase");
          setSessions([]);
          setIsLoading(false);
          return;
        }

        console.error("Error fetching focus sessions:", fetchError);
        setError(fetchError.message || "Failed to fetch focus sessions");
        return;
      }

      if (data) {
        setSessions(data as FocusSession[]);
        console.log(`✅ Loaded ${data.length} focus sessions`);
      }
    } catch (err) {
      console.error("Unexpected error fetching focus sessions:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, session, status]);

  /**
   * Adds a new focus session
   */
  const addSession = useCallback(
    async (sessionData: CreateFocusSessionInput) => {
      try {
        setError(null);

        if (status === "loading") {
          throw new Error("Authentication still loading. Please wait a moment.");
        }

        if (status === "unauthenticated" || !session?.user?.id) {
          console.error("❌ Not authenticated - status:", status);
          throw new Error("Not authenticated. Please sign in to save focus sessions.");
        }

        console.log("📤 Inserting focus session with NextAuth user:", session.user.id);

        const { data, error: insertError } = await supabase
          .from("focus_sessions")
          .insert({
            user_id: session.user.id,
            task_id: sessionData.task_id || null,
            minutes: sessionData.minutes,
            mode: sessionData.mode || "pomodoro",
            completed: sessionData.completed ?? true,
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ Error adding focus session:", insertError);
          const errorMsg = insertError.message ||
            (insertError.code === "42P01" ? "Table 'focus_sessions' does not exist. Please run the SQL migration in Supabase." :
             "Failed to add focus session. Check Supabase setup.");

          setError(errorMsg);
          throw new Error(errorMsg);
        }

        if (data) {
          // Optimistic update: add the new session to the local state
          setSessions((prev) => [data as FocusSession, ...prev]);
          console.log("✅ Focus session created successfully:", data);
        }
      } catch (err) {
        console.error("Unexpected error adding focus session:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase, session, status]
  );

  /**
   * Get today's focus sessions
   */
  const getTodaySessions = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sessions.filter((session) => {
      const sessionDate = new Date(session.created_at);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
  }, [sessions]);

  /**
   * Get total focus minutes
   */
  const getTotalMinutes = useCallback(() => {
    return sessions.reduce((total, session) => total + session.minutes, 0);
  }, [sessions]);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    addSession,
    getTodaySessions,
    getTotalMinutes,
  };
}

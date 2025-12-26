"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import type { LifeOSEvent } from "@/types/calendar";
import type { LifeOSTask } from "@/types/tasks";

interface UseDashboardReturn {
  todayEvents: LifeOSEvent[];
  pendingTasks: LifeOSTask[];
  completedCount: number;
  isLoading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard data with Supabase
 *
 * Fetches aggregated data from both events and tasks tables:
 * - Today's events (between 00:00 and 23:59)
 * - Top 5 pending high-priority tasks
 * - Count of tasks completed today
 *
 * Uses Promise.all for parallel fetching to improve performance.
 *
 * @returns {UseDashboardReturn} Dashboard state and operations
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { todayEvents, pendingTasks, completedCount, isLoading } = useDashboard();
 *
 *   return (
 *     <div>
 *       <EventsList events={todayEvents} />
 *       <TasksList tasks={pendingTasks} />
 *       <Stats completed={completedCount} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboard(): UseDashboardReturn {
  const [todayEvents, setTodayEvents] = useState<LifeOSEvent[]>([]);
  const [pendingTasks, setPendingTasks] = useState<LifeOSTask[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Fetches all dashboard data in parallel
   */
  const refreshDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (
        !supabaseUrl ||
        !supabaseKey ||
        supabaseUrl.includes("placeholder") ||
        supabaseKey === "placeholder-key"
      ) {
        setError(
          "Supabase not configured. Please set up your credentials in .env.local"
        );
        setIsLoading(false);
        return;
      }

      // Get today's date range (00:00 to 23:59)
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Fetch all data in parallel using Promise.all
      const [eventsResult, tasksResult, completedResult] = await Promise.all([
        // Fetch 1: Today's events
        supabase
          .from("events")
          .select("*")
          .gte("start", todayStart)
          .lte("start", todayEnd)
          .order("start", { ascending: true }),

        // Fetch 2: Top 5 pending high-priority tasks
        supabase
          .from("tasks")
          .select("*")
          .eq("is_completed", false)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5),

        // Fetch 3: Count of tasks completed today
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: false })
          .eq("is_completed", true)
          .gte("updated_at", todayStart)
          .lte("updated_at", todayEnd),
      ]);

      // Handle events fetch error
      if (eventsResult.error) {
        console.error("Error fetching events:", eventsResult.error);
        const errorMessage =
          eventsResult.error.message ||
          eventsResult.error.details ||
          (eventsResult.error.code === "PGRST116"
            ? "Table 'events' does not exist. Please run the SQL schema in Supabase."
            : eventsResult.error.hint ||
              "Failed to fetch events. Check Supabase setup and RLS policies.");
        setError(errorMessage);
        return;
      }

      // Handle tasks fetch error
      if (tasksResult.error) {
        console.error("Error fetching tasks:", tasksResult.error);
        const errorMessage =
          tasksResult.error.message ||
          tasksResult.error.details ||
          (tasksResult.error.code === "PGRST116"
            ? "Table 'tasks' does not exist. Please run the SQL schema in Supabase."
            : tasksResult.error.hint ||
              "Failed to fetch tasks. Check Supabase setup and RLS policies.");
        setError(errorMessage);
        return;
      }

      // Handle completed count fetch error
      if (completedResult.error) {
        console.error(
          "Error fetching completed count:",
          completedResult.error
        );
        // Don't fail the entire dashboard for this, just log it
        console.warn("Completed count unavailable");
      }

      // Set the fetched data
      setTodayEvents((eventsResult.data as LifeOSEvent[]) || []);
      setPendingTasks((tasksResult.data as LifeOSTask[]) || []);
      setCompletedCount(completedResult.data?.length || 0);
    } catch (err) {
      console.error("Unexpected error fetching dashboard data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Fetch dashboard data on mount
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return {
    todayEvents,
    pendingTasks,
    completedCount,
    isLoading,
    error,
    refreshDashboard,
  };
}

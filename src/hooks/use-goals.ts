"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Goal, GoalCategory, GoalStatus } from "@/types";

interface CreateGoalInput {
  title: string;
  category: GoalCategory;
  why?: string;
  targetDate?: string | null;
}

interface UpdateGoalInput {
  id: string;
  title?: string;
  category?: GoalCategory;
  status?: GoalStatus;
  progress?: number;
  why?: string;
  targetDate?: string | null;
  totalTasks?: number;
  completedTasks?: number;
}

interface UseGoalsReturn {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (goalData: CreateGoalInput) => Promise<void>;
  updateGoal: (goalData: UpdateGoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing goals with Supabase
 *
 * Features:
 * - Fetches user's goals from Supabase (with RLS)
 * - CRUD operations for goals
 * - Automatic user_id injection (privacy enforced)
 * - Real-time sync across pages
 *
 * @returns {UseGoalsReturn} Goal state and operations
 *
 * @example
 * ```tsx
 * function GoalsView() {
 *   const { goals, isLoading, addGoal, updateGoal } = useGoals();
 *
 *   const handleAdd = async () => {
 *     await addGoal({
 *       title: "Launch SaaS",
 *       category: "business",
 *       why: "Financial freedom",
 *     });
 *   };
 *
 *   return <GoalsList goals={goals} />;
 * }
 * ```
 */
export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Fetches all goals for the current user
   */
  const fetchGoals = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching goals:", fetchError);
        setError(fetchError.message || "Failed to fetch goals");
        return;
      }

      if (data) {
        // Map database fields to Goal type
        const mappedGoals: Goal[] = data.map((goal) => ({
          id: goal.id,
          title: goal.title,
          category: goal.category as GoalCategory,
          status: goal.status as GoalStatus,
          why: goal.why || "",
          targetDate: goal.target_date || null,
          linkedTaskIds: [], // Will be calculated from tasks
          progress: goal.progress,
          totalTasks: goal.total_tasks,
          completedTasks: goal.completed_tasks,
          createdAt: goal.created_at,
          updatedAt: goal.updated_at,
        }));

        setGoals(mappedGoals);
      }
    } catch (err) {
      console.error("Unexpected error fetching goals:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Adds a new goal
   */
  const addGoal = useCallback(
    async (goalData: CreateGoalInput) => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Not authenticated");
        }

        const { error: insertError } = await supabase.from("goals").insert({
          user_id: user.id,
          title: goalData.title,
          category: goalData.category,
          why: goalData.why || "",
          target_date: goalData.targetDate,
          status: "on-track",
          progress: 0,
          total_tasks: 0,
          completed_tasks: 0,
        });

        if (insertError) {
          console.error("Error adding goal:", insertError);
          throw insertError;
        }

        // Refresh goals list
        await fetchGoals();
      } catch (err) {
        console.error("Failed to add goal:", err);
        throw err;
      }
    },
    [supabase, fetchGoals]
  );

  /**
   * Updates an existing goal
   */
  const updateGoal = useCallback(
    async (goalData: UpdateGoalInput) => {
      try {
        const { id, ...updates } = goalData;

        // Map field names to database columns
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
        if (updates.why !== undefined) dbUpdates.why = updates.why;
        if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
        if (updates.totalTasks !== undefined) dbUpdates.total_tasks = updates.totalTasks;
        if (updates.completedTasks !== undefined) dbUpdates.completed_tasks = updates.completedTasks;

        const { error: updateError } = await supabase
          .from("goals")
          .update(dbUpdates)
          .eq("id", id);

        if (updateError) {
          console.error("Error updating goal:", updateError);
          throw updateError;
        }

        // Refresh goals list
        await fetchGoals();
      } catch (err) {
        console.error("Failed to update goal:", err);
        throw err;
      }
    },
    [supabase, fetchGoals]
  );

  /**
   * Deletes a goal
   */
  const deleteGoal = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from("goals")
          .delete()
          .eq("id", id);

        if (deleteError) {
          console.error("Error deleting goal:", deleteError);
          throw deleteError;
        }

        // Refresh goals list
        await fetchGoals();
      } catch (err) {
        console.error("Failed to delete goal:", err);
        throw err;
      }
    },
    [supabase, fetchGoals]
  );

  // Fetch goals on mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    isLoading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}

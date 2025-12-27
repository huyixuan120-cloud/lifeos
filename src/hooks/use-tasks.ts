"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type {
  LifeOSTask,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/tasks";

interface UseTasksReturn {
  tasks: LifeOSTask[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (taskData: CreateTaskInput) => Promise<void>;
  updateTask: (taskData: UpdateTaskInput) => Promise<void>;
  toggleTask: (id: string, isCompleted: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing tasks with Supabase
 *
 * Provides CRUD operations for tasks:
 * - Fetch all tasks on mount
 * - Create new tasks
 * - Update existing tasks
 * - Toggle task completion status
 * - Delete tasks
 *
 * @returns {UseTasksReturn} Task state and operations
 *
 * @example
 * ```tsx
 * function TaskView() {
 *   const { tasks, isLoading, addTask, toggleTask } = useTasks();
 *
 *   const handleAdd = async () => {
 *     await addTask({
 *       title: "New Task",
 *       priority: "medium",
 *     });
 *   };
 *
 *   return <TaskList tasks={tasks} onToggle={toggleTask} />;
 * }
 * ```
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<LifeOSTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Fetches all tasks from Supabase
   */
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey ||
          supabaseUrl.includes("placeholder") ||
          supabaseKey === "placeholder-key") {
        setError("Supabase not configured. Please set up your credentials in .env.local");
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching tasks:", fetchError);
        console.log("Full error object:", JSON.stringify(fetchError, null, 2));

        // Handle different error scenarios
        const errorMessage = fetchError.message ||
          fetchError.details ||
          (fetchError.code === "PGRST116" ? "Table 'tasks' does not exist. Please run the SQL schema in Supabase." :
           fetchError.hint ||
           "Failed to fetch tasks. Check Supabase setup and RLS policies.");

        setError(errorMessage);
        return;
      }

      if (data) {
        setTasks(data as LifeOSTask[]);
      }
    } catch (err) {
      console.error("Unexpected error fetching tasks:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Adds a new task to Supabase
   *
   * @param taskData - The task data to insert
   */
  const addTask = useCallback(
    async (taskData: CreateTaskInput) => {
      try {
        setError(null);

        // Prepare data for database insertion
        const dbTask = {
          title: taskData.title,
          is_completed: taskData.is_completed ?? false,
          priority: taskData.priority ?? "medium",
          due_date: taskData.due_date ?? null,
          is_urgent: taskData.is_urgent ?? false,
          is_important: taskData.is_important ?? false,
          user_id: taskData.user_id ?? null,
        };

        const { data, error: insertError } = await supabase
          .from("tasks")
          .insert([dbTask])
          .select()
          .single();

        if (insertError) {
          console.error("Error adding task:", insertError);
          setError(insertError.message);
          throw insertError;
        }

        if (data) {
          // Optimistic update: add the new task to the local state
          setTasks((prev) => [data as LifeOSTask, ...prev]);
        }

        console.log("✅ Task created successfully:", data);
      } catch (err) {
        console.error("Unexpected error adding task:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase]
  );

  /**
   * Updates an existing task in Supabase
   *
   * @param taskData - The task data to update (must include id)
   */
  const updateTask = useCallback(
    async (taskData: UpdateTaskInput) => {
      try {
        setError(null);

        // Prepare update data (only include provided fields)
        const updateData: any = {};
        if (taskData.title !== undefined) updateData.title = taskData.title;
        if (taskData.is_completed !== undefined) updateData.is_completed = taskData.is_completed;
        if (taskData.priority !== undefined) updateData.priority = taskData.priority;
        if (taskData.due_date !== undefined) updateData.due_date = taskData.due_date;
        if (taskData.is_urgent !== undefined) updateData.is_urgent = taskData.is_urgent;
        if (taskData.is_important !== undefined) updateData.is_important = taskData.is_important;

        const { data, error: updateError } = await supabase
          .from("tasks")
          .update(updateData)
          .eq("id", taskData.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating task:", updateError);
          setError(updateError.message);
          throw updateError;
        }

        if (data) {
          // Optimistic update: update the task in local state
          setTasks((prev) =>
            prev.map((task) => (task.id === taskData.id ? data as LifeOSTask : task))
          );
        }

        console.log("✅ Task updated successfully:", data);
      } catch (err) {
        console.error("Unexpected error updating task:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase]
  );

  /**
   * Toggles a task's completion status
   *
   * @param id - The task ID to toggle
   * @param isCompleted - The new completion status
   */
  const toggleTask = useCallback(
    async (id: string, isCompleted: boolean) => {
      try {
        setError(null);

        const { data, error: updateError } = await supabase
          .from("tasks")
          .update({ is_completed: isCompleted })
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          console.error("Error toggling task:", updateError);
          setError(updateError.message);
          throw updateError;
        }

        if (data) {
          // Optimistic update: update the task in local state
          setTasks((prev) =>
            prev.map((task) => (task.id === id ? data as LifeOSTask : task))
          );
        }

        console.log("✅ Task toggled successfully:", data);
      } catch (err) {
        console.error("Unexpected error toggling task:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase]
  );

  /**
   * Deletes a task from Supabase
   *
   * @param id - The task ID to delete
   */
  const deleteTask = useCallback(
    async (id: string) => {
      try {
        setError(null);

        const { error: deleteError } = await supabase
          .from("tasks")
          .delete()
          .eq("id", id);

        if (deleteError) {
          console.error("Error deleting task:", deleteError);
          setError(deleteError.message);
          throw deleteError;
        }

        // Optimistic update: remove the task from local state
        setTasks((prev) => prev.filter((task) => task.id !== id));

        console.log("✅ Task deleted successfully");
      } catch (err) {
        console.error("Unexpected error deleting task:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase]
  );

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
}

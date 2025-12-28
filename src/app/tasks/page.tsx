"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList } from "@/components/modules/tasks/TaskList";
import { EisenhowerMatrix } from "@/components/modules/tasks/EisenhowerMatrix";
import { TaskCreateDialog } from "@/components/modules/tasks/TaskCreateDialog";
import { CompletedArchive } from "@/components/modules/tasks/CompletedArchive";
import { createClient } from "@/utils/supabase/client";
import type { LifeOSTask } from "@/types/tasks";

/**
 * Tasks Page - SIMPLIFIED WITH PARANOID AUTH CHECK
 *
 * Strategy: Don't block the UI with auth guards.
 * Instead, check auth FRESH every time the user tries to do something.
 *
 * This prevents stale state issues and "not logged in" errors when the user IS logged in.
 */
export default function TasksPage() {
  const supabase = createClient();
  const { tasks, addTask, updateTask, deleteTask, toggleTask, isLoading, error } = useTasks();

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  /**
   * PARANOID AUTH CHECK: Always check user fresh from Supabase
   * This prevents stale state issues
   */
  const getAuthenticatedUser = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("❌ Auth error:", authError);
      return null;
    }

    if (!user) {
      console.warn("⚠️ No user found in session");
      return null;
    }

    console.log("✅ Authenticated user:", user.email, "ID:", user.id);
    return user;
  };

  /**
   * Add Task Handler - WITH PARANOID AUTH CHECK
   */
  const handleAddTask = async (taskData: any) => {
    console.log("🚀 handleAddTask called with:", taskData);

    // STEP 1: Get user FRESH from Supabase (no stale state!)
    const user = await getAuthenticatedUser();
    if (!user) {
      alert("❌ Session expired or not logged in. Please refresh the page and log in again.");
      return;
    }

    // STEP 2: Prepare task data
    const taskPayload = {
      title: taskData.title,
      priority: taskData.priority ?? "medium",
      is_urgent: taskData.is_urgent ?? false,
      is_important: taskData.is_important ?? false,
      is_completed: false,
      due_date: taskData.due_date ?? null,
    };

    console.log("📤 Calling addTask with payload:", taskPayload);
    console.log("👤 User ID that will be injected:", user.id);

    // STEP 3: Call the hook's addTask (which will inject user_id)
    try {
      await addTask(taskPayload);
      console.log("✅ Task added successfully!");
    } catch (error) {
      console.error("❌ Failed to add task:", error);

      // Show user-friendly error
      if (error instanceof Error) {
        if (error.message.includes("Not authenticated")) {
          alert("❌ Session expired. Please refresh the page and log in again.");
        } else {
          alert(`❌ Failed to add task: ${error.message}`);
        }
      } else {
        alert("❌ Failed to add task. Check console for details.");
      }
    }
  };

  /**
   * Update Task Handler - WITH PARANOID AUTH CHECK
   */
  const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      alert("❌ Session expired. Please refresh and log in again.");
      return;
    }

    try {
      await updateTask({ id: taskId, ...updates });
      console.log("✅ Task updated successfully");
    } catch (error) {
      console.error("❌ Failed to update task:", error);
      alert("❌ Failed to update task. Check console for details.");
    }
  };

  /**
   * Create Task from Matrix - WITH PARANOID AUTH CHECK
   */
  const handleCreateTask = async (taskData: any) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      alert("❌ Session expired. Please refresh and log in again.");
      return;
    }

    try {
      await addTask({
        title: taskData.title,
        priority: taskData.priority ?? "medium",
        is_urgent: taskData.is_urgent ?? false,
        is_important: taskData.is_important ?? false,
        is_completed: false,
        due_date: taskData.due_date ?? null,
      });
      console.log("✅ Task created from matrix");
    } catch (error) {
      console.error("❌ Failed to create task:", error);
      alert("❌ Failed to create task. Check console for details.");
    }
  };

  /**
   * Toggle Task Completion - WITH PARANOID AUTH CHECK
   */
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      alert("❌ Session expired. Please refresh and log in again.");
      return;
    }

    try {
      await toggleTask(taskId, isCompleted);
      console.log("✅ Task toggled successfully");
    } catch (error) {
      console.error("❌ Failed to toggle task:", error);
    }
  };

  /**
   * Delete Task - WITH PARANOID AUTH CHECK
   */
  const handleDeleteTask = async (taskId: string) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      alert("❌ Session expired. Please refresh and log in again.");
      return;
    }

    try {
      await deleteTask(taskId);
      console.log("✅ Task deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete task:", error);
      alert("❌ Failed to delete task. Check console for details.");
    }
  };

  /**
   * Edit Task Handler
   */
  const handleEditTask = (task: LifeOSTask) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  /**
   * Edit Submit Handler - WITH PARANOID AUTH CHECK
   */
  const handleEditSubmit = async (taskData: any) => {
    if (!editingTask) return;

    const user = await getAuthenticatedUser();
    if (!user) {
      alert("❌ Session expired. Please refresh and log in again.");
      return;
    }

    try {
      await updateTask({
        id: editingTask.id,
        title: taskData.title,
        priority: taskData.priority,
        is_urgent: taskData.is_urgent,
        is_important: taskData.is_important,
        due_date: taskData.due_date,
      });

      setIsEditDialogOpen(false);
      setEditingTask(null);
      console.log("✅ Task edited successfully");
    } catch (error) {
      console.error("❌ Failed to edit task:", error);
      alert("❌ Failed to edit task. Check console for details.");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#C97152] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-lg p-6 max-w-md">
          <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
            ❌ Error Loading Tasks
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and prioritize your tasks
          </p>
        </div>
      </div>

      {/* VERTICAL SINGLE-COLUMN LAYOUT */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section A: Task Input + Task List (Full Width) */}
          <div className="flex flex-col gap-6">
            <TaskList
              tasks={tasks as LifeOSTask[]}
              onAdd={handleAddTask}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
            />
          </div>

          {/* Section B: Eisenhower Matrix (Full Width, generous spacing above) */}
          <div className="mt-16">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Eisenhower Matrix</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Prioritize tasks by urgency and importance
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card">
              <EisenhowerMatrix
                tasks={tasks as LifeOSTask[]}
                onUpdateTask={handleUpdateTask}
                onCreateTask={handleCreateTask}
                compact={false}
              />
            </div>
          </div>

          {/* Section C: Completed Tasks Archive (Full Width, generous spacing above) */}
          <div className="mt-16">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Completed Tasks</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tasks you've finished
              </p>
            </div>
            <CompletedArchive tasks={tasks as LifeOSTask[]} />
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <TaskCreateDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        initialData={editingTask}
        mode={editingTask ? "edit" : "create"}
        onSubmit={handleEditSubmit}
        onAdd={handleAddTask}
        trigger={<span style={{ display: 'none' }} />}
      />
    </div>
  );
}

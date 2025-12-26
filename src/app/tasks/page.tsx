"use client";

import { useTasks } from "@/hooks/use-tasks";
import { TaskList } from "@/components/modules/tasks/TaskList";

/**
 * Tasks Page
 *
 * Main page for task management module.
 * Displays a Todoist-style minimalist task list with:
 * - Create new tasks
 * - Toggle task completion
 * - Delete tasks
 * - Priority indicators
 *
 * Uses the useTasks hook for data management and Supabase integration.
 */
export default function TasksPage() {
  const { tasks, isLoading, error, addTask, toggleTask, deleteTask } = useTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-destructive font-medium mb-2">Error loading tasks</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your tasks and to-dos
        </p>
      </div>

      {/* Task List */}
      <div className="h-[calc(100vh-8rem)]">
        <TaskList
          tasks={tasks}
          onAdd={addTask}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </div>
    </div>
  );
}

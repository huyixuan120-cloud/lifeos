"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList } from "@/components/modules/tasks/TaskList";
import { EisenhowerMatrix } from "@/components/modules/tasks/EisenhowerMatrix";
import { TaskCreateDialog } from "@/components/modules/tasks/TaskCreateDialog";
import type { LifeOSTask } from "@/types/tasks";

/**
 * Tasks Page - Mission Control Layout
 *
 * Features a side-by-side layout:
 * - Main Area (Left/2/3): Task List with quick add and advanced creation
 * - Strategy Widget (Right/1/3): Eisenhower Matrix for prioritization
 *
 * Uses the useTasks hook for data management and Supabase integration.
 */
export default function TasksPage() {
  const { tasks, isLoading, error, addTask, updateTask, toggleTask, deleteTask } = useTasks();

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  // Wrapper for updating task (Matrix view needs partial updates)
  const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
    await updateTask({ id: taskId, ...updates });
  };

  // Wrapper for creating task (Matrix view passes different structure)
  const handleCreateTask = async (taskData: any) => {
    await addTask({
      title: taskData.title,
      priority: taskData.priority ?? "medium",
      is_urgent: taskData.is_urgent ?? false,
      is_important: taskData.is_important ?? false,
      is_completed: false,
    });
  };

  // Edit Handler - Opens edit dialog with task data
  const handleEditTask = (task: LifeOSTask) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // Edit Submit Handler - Updates task with new data
  const handleEditSubmit = async (taskData: any) => {
    if (!editingTask) return;

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
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mission Control - Manage and prioritize your tasks
          </p>
        </div>
      </div>

      {/* Mission Control Layout - Responsive Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-start">
          {/* Main Area - Task List (2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <TaskList
              tasks={tasks}
              onAdd={addTask}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onEdit={handleEditTask}
            />
          </div>

          {/* Strategy Widget - Eisenhower Matrix (1/3 width on desktop, sticky) */}
          <div className="lg:col-span-1 sticky top-8">
            <div className="overflow-hidden rounded-lg border bg-card">
              <EisenhowerMatrix
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onCreateTask={handleCreateTask}
                compact={true}
              />
            </div>
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
        onAdd={addTask}
      />
    </div>
  );
}

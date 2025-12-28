"use client";

import { useState } from "react";
import { useLifeOS } from "@/hooks/useLifeOS";
import { TaskList } from "@/components/modules/tasks/TaskList";
import { EisenhowerMatrix } from "@/components/modules/tasks/EisenhowerMatrix";
import { TaskCreateDialog } from "@/components/modules/tasks/TaskCreateDialog";
import { CompletedArchive } from "@/components/modules/tasks/CompletedArchive";
import type { LifeOSTask } from "@/types/tasks";

/**
 * Tasks Page - VERTICAL LAYOUT (Clean & Practical)
 *
 * Features a vertical single-column layout:
 * - Top Section: Unified Task Input + Task List (Full Width)
 * - Bottom Section: Eisenhower Matrix (Full Width, generous spacing above)
 *
 * Benefits:
 * - No more cluttered 2-column split
 * - Better handling of long task text
 * - Clean single input with expandable advanced options
 * - Generous spacing between sections for visual clarity
 */
export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useLifeOS();

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Wrapper for updating task (Matrix view needs partial updates)
  const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
    await updateTask(taskId, updates);
  };

  // Wrapper for creating task (Matrix view passes different structure)
  const handleCreateTask = async (taskData: any) => {
    await addTask({
      title: taskData.title,
      priority: taskData.priority ?? "medium",
      is_urgent: taskData.is_urgent ?? false,
      is_important: taskData.is_important ?? false,
      is_completed: false,
      effort: "medium", // Default effort level for XP calculation
      goalId: taskData.goalId ?? null, // Link to goal if selected
    });
  };

  // Wrapper for adding task (from TaskList)
  const handleAddTask = async (taskData: any) => {
    await addTask({
      title: taskData.title,
      priority: taskData.priority ?? "medium",
      is_urgent: taskData.is_urgent ?? false,
      is_important: taskData.is_important ?? false,
      is_completed: false,
      due_date: taskData.due_date ?? null,
      effort: "medium", // Default effort level
      goalId: taskData.goalId ?? null, // Link to goal if selected
    });
  };

  // Toggle task completion - Uses smart completeTask from context
  // This automatically awards XP and updates linked goals!
  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      completeTask(taskId); // Smart completion with XP rewards
    } else {
      // If uncompleting, just update the task
      updateTask(taskId, { is_completed: false });
    }
  };

  // Edit Handler - Opens edit dialog with task data
  const handleEditTask = (task: LifeOSTask) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // Edit Submit Handler - Updates task with new data
  const handleEditSubmit = async (taskData: any) => {
    if (!editingTask) return;

    await updateTask(editingTask.id, {
      title: taskData.title,
      priority: taskData.priority,
      is_urgent: taskData.is_urgent,
      is_important: taskData.is_important,
      due_date: taskData.due_date,
      goalId: taskData.goalId ?? null, // Update goal link
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
              onDelete={deleteTask}
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
                Archive of tasks you've checked off
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
      />
    </div>
  );
}

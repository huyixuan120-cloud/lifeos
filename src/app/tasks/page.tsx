"use client";

import { useState } from "react";
import { useLifeOS } from "@/hooks/useLifeOS";
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
 * Now integrated with the global LifeOS Smart Integration System!
 * - Task completion awards XP and levels up your profile
 * - Tasks linked to goals automatically update goal progress
 * - Full gamification and cross-module integration
 */
export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useLifeOS();

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Wrapper for updating task (Matrix view needs partial updates)
  const handleUpdateTask = (taskId: string, updates: Partial<any>) => {
    updateTask(taskId, updates);
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
              tasks={tasks as LifeOSTask[]}
              onAdd={handleAddTask}
              onToggle={handleToggleTask}
              onDelete={deleteTask}
              onEdit={handleEditTask}
            />
          </div>

          {/* Strategy Widget - Eisenhower Matrix (1/3 width on desktop, sticky) */}
          <div className="lg:col-span-1 sticky top-8">
            <div className="overflow-hidden rounded-lg border bg-card">
              <EisenhowerMatrix
                tasks={tasks as LifeOSTask[]}
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
        onAdd={handleAddTask}
      />
    </div>
  );
}

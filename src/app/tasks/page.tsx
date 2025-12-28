"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList } from "@/components/modules/tasks/TaskList";
import { EisenhowerMatrix } from "@/components/modules/tasks/EisenhowerMatrix";
import { TaskCreateDialog } from "@/components/modules/tasks/TaskCreateDialog";
import { CompletedArchive } from "@/components/modules/tasks/CompletedArchive";
import type { LifeOSTask } from "@/types/tasks";

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, isLoading, error } = useTasks();

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  /**
   * Add Task Handler
   */
  const handleAddTask = async (taskData: any) => {
    console.log("🚀 handleAddTask called with:", taskData);

    const taskPayload = {
      title: taskData.title,
      priority: taskData.priority ?? "medium",
      is_urgent: taskData.is_urgent ?? false,
      is_important: taskData.is_important ?? false,
      is_completed: false,
      due_date: taskData.due_date ?? null,
      goal_id: taskData.goal_id ?? null, // ✅ FIX: Pass goal_id
    };

    try {
      await addTask(taskPayload);
      console.log("✅ Task added successfully!");
    } catch (error) {
      console.error("❌ Failed to add task:", error);
      if (error instanceof Error) {
        alert(`❌ Failed to add task: ${error.message}`);
      }
    }
  };

  /**
   * Update Task Handler
   */
  const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
    try {
      await updateTask({ id: taskId, ...updates });
      console.log("✅ Task updated successfully");
    } catch (error) {
      console.error("❌ Failed to update task:", error);
      alert("❌ Failed to update task. Check console for details.");
    }
  };

  /**
   * Create Task from Matrix
   */
  const handleCreateTask = async (taskData: any) => {
    try {
      await addTask({
        title: taskData.title,
        priority: taskData.priority ?? "medium",
        is_urgent: taskData.is_urgent ?? false,
        is_important: taskData.is_important ?? false,
        is_completed: false,
        due_date: taskData.due_date ?? null,
        goal_id: taskData.goal_id ?? null, // ✅ FIX: Pass goal_id
      });
      console.log("✅ Task created from matrix");
    } catch (error) {
      console.error("❌ Failed to create task:", error);
      alert("❌ Failed to create task. Check console for details.");
    }
  };

  /**
   * Toggle Task Completion
   */
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await toggleTask(taskId, isCompleted);
      console.log("✅ Task toggled successfully");
    } catch (error) {
      console.error("❌ Failed to toggle task:", error);
    }
  };

  /**
   * Delete Task
   */
  const handleDeleteTask = async (taskId: string) => {
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
   * Edit Submit Handler
   */
  const handleEditSubmit = async (taskData: any) => {
    if (!editingTask) return;

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
      <div className="border-b px-6 py-3">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and prioritize your tasks
          </p>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: Left (Task Input + Completed) | Right (Eisenhower Matrix) */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 h-full">
          {/* LEFT COLUMN: Task Input + Completed Tasks */}
          <div className="flex flex-col gap-4">
            {/* Task Input */}
            <TaskList
              tasks={tasks as LifeOSTask[]}
              onAdd={handleAddTask}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
            />

            {/* Completed Tasks Archive */}
            <div>
              <div className="mb-2">
                <h2 className="text-xl font-semibold">Completed Tasks</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Tasks you've finished
                </p>
              </div>
              <CompletedArchive tasks={tasks as LifeOSTask[]} />
            </div>
          </div>

          {/* RIGHT COLUMN: Eisenhower Matrix (Takes remaining space) */}
          <div className="flex flex-col">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">Eisenhower Matrix</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Prioritize tasks by urgency and importance
              </p>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border bg-card">
              <EisenhowerMatrix
                tasks={tasks as LifeOSTask[]}
                onUpdateTask={handleUpdateTask}
                onCreateTask={handleCreateTask}
                compact={false}
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
        trigger={<span style={{ display: 'none' }} />}
      />
    </div>
  );
}

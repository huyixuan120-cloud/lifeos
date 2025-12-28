"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { AddTaskButton } from "./AddTaskButton";
import type { LifeOSTask } from "@/types/tasks";

interface TaskSectionProps {
  /**
   * List of tasks to display
   */
  tasks: LifeOSTask[];

  /**
   * ID of the task currently linked to the timer
   */
  activeTaskId?: string | null;

  /**
   * Number of pomodoro sessions completed today
   */
  pomodorosCompleted: number;

  /**
   * Whether tasks are currently loading
   */
  isLoading: boolean;

  /**
   * Error message if task loading failed
   */
  error?: string | null;

  /**
   * Callback to toggle task completion
   */
  onToggleTask: (taskId: string) => void;

  /**
   * Callback to select a task as active
   */
  onSelectTask: (taskId: string) => void;

  /**
   * Callback to add a new task
   */
  onAddTask: (title: string) => Promise<void>;

  /**
   * Current timer mode for contextual messaging
   */
  mode: "pomodoro" | "shortBreak" | "longBreak";
}

/**
 * TaskSection - Complete task list management for focus timer
 *
 * Displays a list of tasks with completion checkboxes, highlighting
 * for the active task, and an inline add button. Handles loading,
 * error, and empty states gracefully.
 *
 * @example
 * ```tsx
 * <TaskSection
 *   tasks={incompleteTasks}
 *   activeTaskId={timerState.taskId}
 *   pomodorosCompleted={3}
 *   isLoading={false}
 *   onToggleTask={(id) => toggleTask(id)}
 *   onSelectTask={(id) => setTimerTaskId(id)}
 *   onAddTask={async (title) => await addTask(title)}
 *   mode="pomodoro"
 * />
 * ```
 */
export function TaskSection({
  tasks,
  activeTaskId,
  pomodorosCompleted,
  isLoading,
  error,
  onToggleTask,
  onSelectTask,
  onAddTask,
  mode,
}: TaskSectionProps) {
  // Filter out completed tasks
  const incompleteTasks = tasks.filter((task) => !task.is_completed);

  // Contextual message based on mode
  const getMessage = () => {
    if (mode === "pomodoro") {
      return "Time to focus!";
    } else if (mode === "shortBreak") {
      return "Take a short break";
    } else {
      return "Enjoy your long break";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {getMessage()}
        </h3>
        <div className="text-sm text-muted-foreground">
          {pomodorosCompleted}/∞ sessions
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
          <h4 className="font-semibold mb-1">Failed to load tasks</h4>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && incompleteTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
          <h4 className="font-semibold mb-1">All caught up!</h4>
          <p className="text-sm text-muted-foreground mb-4">
            No tasks yet. Add one below to get started.
          </p>
        </div>
      )}

      {/* Task List */}
      {!isLoading && !error && incompleteTasks.length > 0 && (
        <div className="space-y-2">
          {incompleteTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              onToggle={onToggleTask}
              onSelect={onSelectTask}
            />
          ))}
        </div>
      )}

      {/* Add Task Button - Always visible when not loading */}
      {!isLoading && (
        <AddTaskButton onAddTask={onAddTask} disabled={isLoading} />
      )}
    </div>
  );
}

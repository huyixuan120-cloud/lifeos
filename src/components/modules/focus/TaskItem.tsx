"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Zap } from "lucide-react";
import type { LifeOSTask } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  /**
   * The task to display
   */
  task: LifeOSTask;

  /**
   * Whether this task is currently linked to the active timer
   */
  isActive?: boolean;

  /**
   * Callback when task completion status is toggled
   */
  onToggle: (taskId: string) => void;

  /**
   * Callback when task is clicked (to select as active)
   */
  onSelect?: (taskId: string) => void;
}

/**
 * TaskItem - Single task display with checkbox and highlighting
 *
 * Displays a task with completion checkbox, priority badge, and
 * special highlighting when the task is linked to an active timer.
 *
 * @example
 * ```tsx
 * <TaskItem
 *   task={task}
 *   isActive={task.id === activeTaskId}
 *   onToggle={(id) => toggleTask(id)}
 *   onSelect={(id) => setActiveTask(id)}
 * />
 * ```
 */
export function TaskItem({ task, isActive, onToggle, onSelect }: TaskItemProps) {
  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer",
        "border",
        isActive
          ? "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800"
          : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800/50"
      )}
      onClick={() => onSelect?.(task.id)}
    >
      {/* Checkbox */}
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={() => onToggle(task.id)}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5"
      />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "text-sm font-medium flex-1",
              task.is_completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>

          {/* Priority Badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
              priorityColors[task.priority]
            )}
          >
            <Zap className="h-3 w-3" />
            {task.priority}
          </span>
        </div>

        {/* Active Task Indicator */}
        {isActive && !task.is_completed && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            ⏱️ Timer active for this task
          </p>
        )}
      </div>
    </div>
  );
}

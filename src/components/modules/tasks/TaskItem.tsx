"use client";

import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { LifeOSTask, TaskPriority } from "@/types/tasks";
import { PRIORITY_COLORS } from "@/types/tasks";

interface TaskItemProps {
  task: LifeOSTask;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: LifeOSTask) => void;
}

/**
 * TaskItem Component
 *
 * Displays a single task with:
 * - Checkbox for completion toggle
 * - Title with strikethrough when completed
 * - Priority indicator (colored dot)
 * - Delete button
 *
 * @example
 * ```tsx
 * <TaskItem
 *   task={task}
 *   onToggle={(id, completed) => toggleTask(id, completed)}
 *   onDelete={(id) => deleteTask(id)}
 * />
 * ```
 */
export function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const priorityInfo = PRIORITY_COLORS[task.priority as TaskPriority];

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
      {/* Checkbox */}
      <Checkbox
        id={task.id}
        checked={task.is_completed}
        onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
        className="mt-0.5"
      />

      {/* Task Content */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {/* Priority Indicator */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: priorityInfo.bg }}
          title={priorityInfo.label}
        />

        {/* Title - Clickable for editing */}
        <span
          onClick={() => onEdit?.(task)}
          className={`flex-1 text-sm select-none ${
            task.is_completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          } ${onEdit ? "cursor-pointer hover:text-blue-600 hover:underline" : ""}`}
        >
          {task.title}
        </span>
      </div>

      {/* Delete Button (visible on hover) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(task.id)}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}

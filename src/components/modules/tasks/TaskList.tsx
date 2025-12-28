"use client";

import { UnifiedTaskInput } from "./UnifiedTaskInput";
import { TaskItem } from "./TaskItem";
import type { LifeOSTask, CreateTaskInput } from "@/types/tasks";

interface TaskListProps {
  tasks: LifeOSTask[];
  onAdd: (taskData: CreateTaskInput) => Promise<void>;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: LifeOSTask) => void;
}

/**
 * TaskList Component - CLEAN VERSION
 *
 * Displays a list of tasks with:
 * - Unified input at top with expandable advanced options
 * - List of TaskItem components
 * - Empty state message when no tasks exist
 *
 * @example
 * ```tsx
 * <TaskList
 *   tasks={tasks}
 *   onAdd={addTask}
 *   onToggle={toggleTask}
 *   onDelete={deleteTask}
 * />
 * ```
 */
export function TaskList({ tasks, onAdd, onToggle, onDelete, onEdit }: TaskListProps) {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Unified Task Input - Single place to add tasks */}
      <UnifiedTaskInput onAdd={onAdd} />

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-muted-foreground text-sm">
              No tasks yet. Add your first task above.
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, KeyboardEvent } from "react";
import { Plus, ListPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./TaskItem";
import { TaskCreateDialog } from "./TaskCreateDialog";
import type { LifeOSTask, CreateTaskInput } from "@/types/tasks";

interface TaskListProps {
  tasks: LifeOSTask[];
  onAdd: (taskData: CreateTaskInput) => Promise<void>;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: LifeOSTask) => void;
}

/**
 * TaskList Component
 *
 * Displays a list of tasks with:
 * - Input field at top for adding new tasks
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setIsAdding(true);
      await onAdd({
        title: newTaskTitle.trim(),
        priority: "medium",
        is_completed: false,
      });
      setNewTaskTitle("");
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Area */}
      <div className="p-4 border-b space-y-3">
        {/* Quick Add Input */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Quick add task (press Enter)..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="flex-1"
          />
          <Button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || isAdding}
            size="icon"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Create Dialog */}
        <TaskCreateDialog
          onAdd={onAdd}
          trigger={
            <Button variant="outline" className="w-full gap-2" size="sm">
              <ListPlus className="h-4 w-4" />
              Advanced Task (Urgent/Important)
            </Button>
          }
        />
      </div>

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

"use client";

import { useState, useEffect } from "react";
import { Plus, Flame, Star, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateTaskInput, TaskPriority } from "@/types/tasks";
import { cn } from "@/lib/utils";
import { useLifeOS } from "@/hooks/useLifeOS";

interface TaskCreateDialogProps {
  onAdd: (taskData: CreateTaskInput) => Promise<void>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: any;
  mode?: "create" | "edit";
  onSubmit?: (taskData: any) => Promise<void>;
}

/**
 * TaskCreateDialog Component
 *
 * Advanced dialog for creating tasks with:
 * - Title input
 * - Priority selection (Low/Medium/High)
 * - Urgent toggle (Eisenhower Matrix)
 * - Important toggle (Eisenhower Matrix)
 * - Due date picker
 *
 * @example
 * ```tsx
 * <TaskCreateDialog onAdd={addTask} />
 * ```
 */
export function TaskCreateDialog({
  onAdd,
  trigger,
  open: controlledOpen,
  onOpenChange,
  initialData,
  mode = "create",
  onSubmit,
}: TaskCreateDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const [isAdding, setIsAdding] = useState(false);

  // Get goals data from global context
  const { goals } = useLifeOS();

  // Form state
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [goalId, setGoalId] = useState<string>("none");

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (initialData && mode === "edit") {
      setTitle(initialData.title || "");
      setPriority(initialData.priority || "medium");
      setIsUrgent(initialData.is_urgent || false);
      setIsImportant(initialData.is_important || false);
      setDueDate(initialData.due_date || "");
      setGoalId(initialData.goalId || "none");
    }
  }, [initialData, mode]);

  const resetForm = () => {
    setTitle("");
    setPriority("medium");
    setIsUrgent(false);
    setIsImportant(false);
    setDueDate("");
    setGoalId("none");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      setIsAdding(true);

      const taskData = {
        title: title.trim(),
        priority,
        is_urgent: isUrgent,
        is_important: isImportant,
        due_date: dueDate || null,
        is_completed: false,
        goalId: goalId === "none" ? null : goalId, // Link to selected goal
      };

      if (mode === "edit" && onSubmit) {
        // Edit mode: use onSubmit
        await onSubmit(taskData);
      } else {
        // Create mode: use onAdd
        await onAdd(taskData);
      }

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error(`Failed to ${mode} task:`, error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update task details and priority settings."
              : "Add a task with priority, urgency, and importance settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAdding}
              autoFocus
            />
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={priority === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("low")}
                className={cn(
                  "flex-1",
                  priority === "low" && "bg-green-600 hover:bg-green-700"
                )}
              >
                Low
              </Button>
              <Button
                type="button"
                variant={priority === "medium" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("medium")}
                className={cn(
                  "flex-1",
                  priority === "medium" && "bg-orange-500 hover:bg-orange-600"
                )}
              >
                Medium
              </Button>
              <Button
                type="button"
                variant={priority === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("high")}
                className={cn(
                  "flex-1",
                  priority === "high" && "bg-red-600 hover:bg-red-700"
                )}
              >
                High
              </Button>
            </div>
          </div>

          {/* Goal Selection */}
          <div className="space-y-2">
            <Label htmlFor="goal" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Linked Goal (Optional)
            </Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger id="goal" disabled={isAdding}>
                <SelectValue placeholder="Select a goal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">No Goal</span>
                </SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      <span>{goal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({goal.progress}%)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {goalId && goalId !== "none" && (
              <p className="text-xs text-muted-foreground">
                💡 Completing this task will update your goal progress automatically
              </p>
            )}
          </div>

          {/* Eisenhower Matrix Toggles */}
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Eisenhower Matrix
            </div>

            {/* Urgent Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame
                  className={cn(
                    "h-5 w-5",
                    isUrgent ? "text-red-600" : "text-gray-400"
                  )}
                />
                <div>
                  <Label
                    htmlFor="urgent"
                    className={cn(
                      "cursor-pointer font-medium",
                      isUrgent && "text-red-600"
                    )}
                  >
                    Urgente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Requires immediate attention
                  </p>
                </div>
              </div>
              <Switch
                id="urgent"
                checked={isUrgent}
                onCheckedChange={setIsUrgent}
              />
            </div>

            {/* Important Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star
                  className={cn(
                    "h-5 w-5",
                    isImportant ? "text-blue-600" : "text-gray-400"
                  )}
                />
                <div>
                  <Label
                    htmlFor="important"
                    className={cn(
                      "cursor-pointer font-medium",
                      isImportant && "text-blue-600"
                    )}
                  >
                    Importante
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Contributes to long-term goals
                  </p>
                </div>
              </div>
              <Switch
                id="important"
                checked={isImportant}
                onCheckedChange={setIsImportant}
              />
            </div>

            {/* Quadrant Indicator */}
            {(isUrgent || isImportant) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Quadrant: </span>
                  <span
                    className={cn(
                      "font-semibold",
                      isUrgent && isImportant && "text-rose-600",
                      !isUrgent && isImportant && "text-sky-600",
                      isUrgent && !isImportant && "text-emerald-600"
                    )}
                  >
                    {isUrgent && isImportant && "🔥 Do First"}
                    {!isUrgent && isImportant && "📅 Schedule"}
                    {isUrgent && !isImportant && "🤝 Delegate"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Due Date Input */}
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date (Optional)</Label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isAdding}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!title.trim() || isAdding}
          >
            {isAdding
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
              ? "Save Changes"
              : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

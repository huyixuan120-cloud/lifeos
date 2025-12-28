"use client";

import { useState, KeyboardEvent } from "react";
import { Plus, Settings, ChevronDown, ChevronUp, Calendar, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useGoals } from "@/hooks/use-goals";

interface UnifiedTaskInputProps {
  onAdd: (taskData: CreateTaskInput) => Promise<void>;
}

/**
 * UnifiedTaskInput - Single Consolidated Input with Expandable Advanced Options
 *
 * Replaces the cluttered "3 buttons" problem with one clean input:
 * - Main input field for quick task entry
 * - Settings icon that expands/collapses advanced options panel
 * - Advanced panel shows: Priority, Urgent/Important toggles, Due Date
 *
 * @example
 * ```tsx
 * <UnifiedTaskInput onAdd={handleAddTask} />
 * ```
 */
export function UnifiedTaskInput({ onAdd }: UnifiedTaskInputProps) {
  const { goals, isLoading: goalsLoading } = useGoals();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options state
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [goalId, setGoalId] = useState<string>("none");

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setIsAdding(true);

      // DEBUG: Log goal selection
      console.log("🎯 Creating task with goalId:", goalId);
      console.log("🎯 goalId === 'none'?", goalId === "none");
      console.log("🎯 Final goal_id value:", goalId === "none" ? null : goalId);

      await onAdd({
        title: newTaskTitle.trim(),
        priority,
        is_urgent: isUrgent,
        is_important: isImportant,
        is_completed: false,
        due_date: dueDate || null,
        goal_id: goalId === "none" ? null : goalId,
      });

      // Reset form
      setNewTaskTitle("");
      setPriority("medium");
      setIsUrgent(false);
      setIsImportant(false);
      setDueDate("");
      setGoalId("none");
      setShowAdvanced(false);
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
    <div className="border rounded-lg bg-card">
      {/* Main Input Row */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Add a task... (press Enter)"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="flex-1"
          />

          {/* Settings Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors",
              showAdvanced && "bg-accent text-accent-foreground"
            )}
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
          </Button>

          {/* Add Button */}
          <Button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || isAdding}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expandable Advanced Options Panel */}
      {showAdvanced && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Goal Selector */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Goal (Cartella)
              </Label>
              <Select value={goalId} onValueChange={setGoalId} disabled={goalsLoading}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={goalsLoading ? "Caricamento..." : "Nessun Goal"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Nessun Goal</span>
                  </SelectItem>
                  {goalsLoading ? (
                    <SelectItem value="loading" disabled>
                      <span className="text-muted-foreground">Caricamento goals...</span>
                    </SelectItem>
                  ) : goals.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      <span className="text-muted-foreground">Nessun goal disponibile</span>
                    </SelectItem>
                  ) : (
                    goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        <div className="flex items-center gap-2">
                          <span>{goal.title}</span>
                          <span className="text-xs text-muted-foreground">
                            ({goal.progress}%)
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Eisenhower Toggles */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Eisenhower</Label>
              <div className="flex items-center gap-4 h-9">
                <div className="flex items-center gap-2">
                  <Switch
                    id="urgent"
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                  />
                  <Label htmlFor="urgent" className="text-sm cursor-pointer">
                    Urgent
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="important"
                    checked={isImportant}
                    onCheckedChange={setIsImportant}
                  />
                  <Label htmlFor="important" className="text-sm cursor-pointer">
                    Important
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

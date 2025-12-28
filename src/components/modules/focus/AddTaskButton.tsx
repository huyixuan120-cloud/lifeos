"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddTaskButtonProps {
  /**
   * Callback to add a new task
   * Should return a Promise that resolves when the task is created
   */
  onAddTask: (title: string) => Promise<void>;

  /**
   * Optional custom placeholder text
   */
  placeholder?: string;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
}

/**
 * AddTaskButton - Inline task creation with dashed border
 *
 * Expandable button that reveals an input field for quick task creation.
 * Automatically collapses after submission or on blur.
 *
 * @example
 * ```tsx
 * <AddTaskButton
 *   onAddTask={async (title) => await addTask(title)}
 *   placeholder="What do you need to do?"
 * />
 * ```
 */
export function AddTaskButton({
  onAddTask,
  placeholder = "What needs to be done?",
  disabled,
}: AddTaskButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask(inputValue.trim());
      setInputValue("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Failed to add task:", error);
      // Keep input open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setInputValue("");
    setIsExpanded(false);
  };

  if (isExpanded) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting || disabled}
          onBlur={() => {
            // Delay to allow submit button click
            setTimeout(() => {
              if (!isSubmitting) handleCancel();
            }, 150);
          }}
          className="border-gray-300 dark:border-gray-700"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || isSubmitting || disabled}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setIsExpanded(true)}
      disabled={disabled}
      className={cn(
        "w-full border-dashed border-2 border-gray-300 dark:border-gray-700",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        "text-muted-foreground hover:text-foreground"
      )}
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Task
    </Button>
  );
}

"use client";

import { MoreVertical, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskActionsMenuProps {
  onClearFinished: () => void;
  onClearAll: () => void;
  onResetPomodoros: () => void;
}

/**
 * TaskActionsMenu Component - Three Dots Menu
 *
 * Actions:
 * - Clear finished tasks (delete completed)
 * - Clear all tasks (with confirmation)
 * - Clear act pomodoros (reset pomodoro count)
 */
export function TaskActionsMenu({
  onClearFinished,
  onClearAll,
  onResetPomodoros,
}: TaskActionsMenuProps) {
  const handleClearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL tasks? This action cannot be undone."
      )
    ) {
      onClearAll();
    }
  };

  const handleResetPomodoros = () => {
    if (
      window.confirm(
        "Reset today's pomodoro count to 0? This will affect the auto-switch logic."
      )
    ) {
      onResetPomodoros();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onClearFinished} className="cursor-pointer">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear finished tasks
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleClearAll} className="cursor-pointer text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear all tasks
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetPomodoros} className="cursor-pointer">
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear act pomodoros
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

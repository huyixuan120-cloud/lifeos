"use client";

import { LifeOSTask } from "@/types/tasks";
import { CheckCircle2, Calendar, Tag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CompletedArchiveProps {
  tasks: LifeOSTask[];
}

/**
 * Helper function to categorize completed tasks based on urgency/importance
 */
function getTaskQuadrant(task: LifeOSTask): string {
  const isUrgent = task.is_urgent ?? false;
  const isImportant = task.is_important ?? false;

  if (isUrgent && isImportant) return "Do First";
  if (!isUrgent && isImportant) return "Schedule";
  if (isUrgent && !isImportant) return "Delegate";
  return "Eliminate";
}

/**
 * CompletedArchive Component
 *
 * Displays completed tasks in a clean structured table layout with:
 * - Checked checkbox (read-only)
 * - Task title
 * - Completion date
 * - Original quadrant tag
 *
 * Uses muted gray colors to indicate inactive/archived status.
 */
export function CompletedArchive({ tasks }: CompletedArchiveProps) {
  // Filter only completed tasks
  const completedTasks = tasks.filter((task) => task.is_completed);

  if (completedTasks.length === 0) {
    return (
      <div className="border rounded-lg bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No completed tasks yet. Start checking off tasks to build your archive!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* Table Header */}
      <div className="bg-muted/30 border-b px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_150px_120px] gap-4 items-center">
          <div className="w-5"></div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Task
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Completed
          </div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quadrant
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {completedTasks.map((task) => {
          const quadrant = getTaskQuadrant(task);
          const completedDate = task.updated_at
            ? new Date(task.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A";

          return (
            <div
              key={task.id}
              className="px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="grid grid-cols-[auto_1fr_150px_120px] gap-4 items-center">
                {/* Checked Checkbox (Read-only) */}
                <Checkbox
                  checked={true}
                  disabled
                  className="opacity-50"
                />

                {/* Task Title */}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground line-through truncate">
                    {task.title}
                  </p>
                </div>

                {/* Completion Date */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{completedDate}</span>
                </div>

                {/* Quadrant Tag */}
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    "bg-muted text-muted-foreground"
                  )}>
                    {quadrant}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

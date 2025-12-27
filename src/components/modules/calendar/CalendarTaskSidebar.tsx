"use client";

import { GripVertical, Flame, Diamond, Zap, Archive } from "lucide-react";
import type { LifeOSTask } from "@/types/tasks";
import { PRIORITY_COLORS } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface CalendarTaskSidebarProps {
  tasks: LifeOSTask[];
  onEditTask: (task: LifeOSTask) => void;
}

/**
 * Quadrant Section Definition
 */
interface QuadrantSection {
  id: "q1" | "q2" | "q3" | "q4";
  title: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
}

const QUADRANT_SECTIONS: QuadrantSection[] = [
  {
    id: "q1",
    title: "Do Now",
    emoji: "🔥",
    icon: Flame,
    description: "Urgent & Important",
    bgColor: "bg-red-50",
    borderColor: "border-red-500",
    textColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    id: "q2",
    title: "Schedule",
    emoji: "💎",
    icon: Diamond,
    description: "Important, Not Urgent",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-500",
    textColor: "text-blue-700",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "q3",
    title: "Delegate",
    emoji: "⚡",
    icon: Zap,
    description: "Urgent, Not Important",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-500",
    textColor: "text-yellow-700",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "q4",
    title: "Backlog",
    emoji: "📥",
    icon: Archive,
    description: "Neither Urgent nor Important",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-400",
    textColor: "text-gray-700",
    badgeColor: "bg-gray-100 text-gray-700",
  },
];

/**
 * Categorizes a task into one of the four quadrants
 */
function categorizeTask(task: LifeOSTask): "q1" | "q2" | "q3" | "q4" {
  const isUrgent = task.is_urgent ?? false;
  const isImportant = task.is_important ?? false;

  if (isUrgent && isImportant) return "q1";
  if (!isUrgent && isImportant) return "q2";
  if (isUrgent && !isImportant) return "q3";
  return "q4";
}

/**
 * CalendarTaskSidebar Component
 *
 * Displays tasks grouped by Eisenhower Matrix quadrants.
 * Tasks are draggable to the calendar and clickable to edit.
 */
export function CalendarTaskSidebar({ tasks, onEditTask }: CalendarTaskSidebarProps) {
  // Filter out completed tasks
  const incompleteTasks = tasks.filter((task) => !task.is_completed);

  // Categorize tasks into quadrants
  const tasksByQuadrant = {
    q1: incompleteTasks.filter((t) => categorizeTask(t) === "q1"),
    q2: incompleteTasks.filter((t) => categorizeTask(t) === "q2"),
    q3: incompleteTasks.filter((t) => categorizeTask(t) === "q3"),
    q4: incompleteTasks.filter((t) => categorizeTask(t) === "q4"),
  };

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h3 className="font-semibold text-sm">Time-Box Tasks</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Drag tasks onto the calendar or click to edit
        </p>
      </div>

      {/* Scrollable Quadrant Sections */}
      <div className="flex-1 overflow-y-auto">
        {QUADRANT_SECTIONS.map((section) => {
          const sectionTasks = tasksByQuadrant[section.id];
          const Icon = section.icon;

          return (
            <div key={section.id} className="border-b last:border-b-0">
              {/* Section Header */}
              <div className={cn("sticky top-0 z-10 px-4 py-3", section.bgColor, "border-b")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", section.textColor)} />
                    <h4 className={cn("font-semibold text-sm", section.textColor)}>
                      {section.title}
                    </h4>
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", section.badgeColor)}>
                    {sectionTasks.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              </div>

              {/* Task List */}
              <div className="p-2 space-y-2">
                {sectionTasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No tasks in this quadrant
                  </div>
                ) : (
                  sectionTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      section={section}
                      onEdit={() => onEditTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TaskItem Component
 *
 * Individual draggable task card with edit functionality
 */
interface TaskItemProps {
  task: LifeOSTask;
  section: QuadrantSection;
  onEdit: () => void;
}

function TaskItem({ task, section, onEdit }: TaskItemProps) {
  const priorityInfo = PRIORITY_COLORS[task.priority];
  const isUrgent = task.is_urgent ?? false;
  const isImportant = task.is_important ?? false;

  return (
    <div
      className={cn(
        "draggable-task group relative rounded-lg border bg-card transition-all cursor-move",
        "hover:shadow-md hover:scale-[1.02]",
        "border-l-4",
        section.borderColor
      )}
      data-title={task.title}
      data-color={priorityInfo.bg}
      data-urgent={isUrgent.toString()}
      data-important={isImportant.toString()}
      onClick={(e) => {
        // Only trigger edit if not dragging
        if (e.currentTarget.classList.contains("fc-event-dragging")) return;
        onEdit();
      }}
    >
      <div className="p-3 flex items-start gap-2">
        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with Quadrant Icon */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm flex-shrink-0">{section.emoji}</span>
            <p className="text-sm font-medium truncate leading-tight">
              {task.title}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {/* Priority Badge */}
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: priorityInfo.bg + "20",
                color: priorityInfo.bg,
              }}
            >
              <span className="font-medium">{task.priority}</span>
            </div>

            {/* Due Date if exists */}
            {task.due_date && (
              <span className="text-[10px]">
                {new Date(task.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Edit Indicator (shows on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
            Click to edit
          </div>
        </div>
      </div>
    </div>
  );
}

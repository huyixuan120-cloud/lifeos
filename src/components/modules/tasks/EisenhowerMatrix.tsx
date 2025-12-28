"use client";

import { LifeOSTask, PRIORITY_COLORS } from "@/types/tasks";
import { CheckCircle2, Circle, Clock, Flag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * Extended Task type with Eisenhower Matrix properties
 * Note: is_urgent and is_important are now in the database schema
 */
export interface EisenhowerTask extends LifeOSTask {
  is_urgent?: boolean;
  is_important?: boolean;
}

/**
 * Quadrant definition for the Eisenhower Matrix
 */
interface Quadrant {
  id: "q1" | "q2" | "q3" | "q4";
  title: string;
  description: string;
  isUrgent: boolean;
  isImportant: boolean;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
}

/**
 * The Four Quadrants
 */
const QUADRANTS: Quadrant[] = [
  {
    id: "q1",
    title: "Do First",
    description: "Urgent & Important",
    isUrgent: true,
    isImportant: true,
    bgColor: "bg-[#FCE8E6]",
    borderColor: "border-[#C97152]",
    textColor: "text-[#8B4513]",
    iconColor: "text-[#C97152]",
  },
  {
    id: "q2",
    title: "Schedule",
    description: "Important, Not Urgent",
    isUrgent: false,
    isImportant: true,
    bgColor: "bg-[#F9F6F1]",
    borderColor: "border-[#A86F4C]",
    textColor: "text-[#5D4E37]",
    iconColor: "text-[#A86F4C]",
  },
  {
    id: "q3",
    title: "Delegate",
    description: "Urgent, Not Important",
    isUrgent: true,
    isImportant: false,
    bgColor: "bg-[#E8F5E9]",
    borderColor: "border-[#6B8E6F]",
    textColor: "text-[#3E5C3F]",
    iconColor: "text-[#6B8E6F]",
  },
  {
    id: "q4",
    title: "Eliminate",
    description: "Not Urgent, Not Important",
    isUrgent: false,
    isImportant: false,
    bgColor: "bg-slate-50",
    borderColor: "border-slate-400",
    textColor: "text-slate-900",
    iconColor: "text-slate-600",
  },
];

interface EisenhowerMatrixProps {
  tasks: LifeOSTask[];
  onUpdateTask: (taskId: string, updates: Partial<LifeOSTask>) => Promise<void>;
  onCreateTask: (task: { title: string; is_urgent?: boolean; is_important?: boolean; priority?: string }) => Promise<void>;
  compact?: boolean; // NEW: Enables compact widget mode
}

/**
 * Helper function to categorize tasks based on is_urgent/is_important fields
 * Falls back to priority/due_date logic if database fields are not set
 */
function categorizeTask(task: LifeOSTask): { isUrgent: boolean; isImportant: boolean } {
  // Prefer database fields if they exist
  if (task.is_urgent !== undefined && task.is_important !== undefined) {
    return {
      isUrgent: task.is_urgent,
      isImportant: task.is_important,
    };
  }

  // Fallback logic based on existing fields (for tasks created before schema update):
  // Urgent: Has a due date within 3 days OR high priority
  const isUrgent = (() => {
    if (task.priority === "high") return true;
    if (!task.due_date) return false;

    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays <= 3 && diffDays >= 0; // Due within 3 days
  })();

  // Important: Medium or High priority
  const isImportant = task.priority === "high" || task.priority === "medium";

  return { isUrgent, isImportant };
}

/**
 * Filter tasks for a specific quadrant
 */
function getTasksForQuadrant(tasks: LifeOSTask[], quadrant: Quadrant): LifeOSTask[] {
  return tasks.filter((task) => {
    const { isUrgent, isImportant } = categorizeTask(task);
    return isUrgent === quadrant.isUrgent && isImportant === quadrant.isImportant;
  });
}

/**
 * Mini Task Card Component
 */
function TaskCard({
  task,
  onToggleComplete,
  quadrantColor,
  compact = false,
}: {
  task: LifeOSTask;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  quadrantColor: string;
  compact?: boolean;
}) {
  const priorityInfo = PRIORITY_COLORS[task.priority];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.is_completed;

  if (compact) {
    return (
      <div
        className={cn(
          "group flex items-center gap-1.5 p-1.5 rounded border transition-all",
          task.is_completed
            ? "bg-white/50 border-gray-200"
            : "bg-white border-gray-200 hover:border-gray-300"
        )}
      >
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
          className="h-3 w-3"
        />
        <p
          className={cn(
            "text-[10px] font-medium leading-tight flex-1 truncate",
            task.is_completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group p-4 rounded-lg border-2 shadow-sm transition-all", // FIX: Più evidenza
        task.is_completed
          ? "bg-white/50 border-gray-200"
          : "bg-white border-gray-300 hover:border-gray-400 hover:shadow-md" // FIX: Bordo più marcato
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
          className="mt-0.5"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={cn(
              "text-base font-semibold leading-tight", // FIX: Testo più grande e bold
              task.is_completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1.5">
            {/* Priority Badge */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold" // FIX: Badge più grande
              style={{
                backgroundColor: priorityInfo.bg + "20",
                color: priorityInfo.bg,
              }}
            >
              <Flag className="h-3 w-3" />
              <span>{task.priority}</span>
            </div>

            {/* Due Date */}
            {task.due_date && (
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                )}
              >
                <Clock className="h-2.5 w-2.5" />
                <span>
                  {new Date(task.due_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Eisenhower Matrix Component
 */
export function EisenhowerMatrix({ tasks, onUpdateTask, onCreateTask, compact = false }: EisenhowerMatrixProps) {
  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    await onUpdateTask(taskId, { is_completed: completed });
  };

  // Filter incomplete tasks for the matrix
  const incompleteTasks = tasks.filter((task) => !task.is_completed);

  return (
    <div className={cn("h-full flex flex-col", compact ? "p-3" : "")}>
      {/* The 2x2 Grid with Axes */}
      <div className={cn(
        "grid flex-1 min-h-0",
        compact
          ? "grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-2"
          : "grid-cols-[auto_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-4"
      )}>
        {/* Empty Corner Cell */}
        <div className=""></div>

        {/* Column Headers (Urgency Axis) */}
        <div className={cn(
          "flex items-center justify-center font-bold uppercase tracking-wider",
          compact ? "text-[10px] pb-1" : "text-xs pb-2"
        )}>
          <div className="flex items-center gap-1.5 text-[#C97152]">
            <span className={compact ? "text-sm" : "text-base"}>⚡</span>
            <span>Urgent</span>
          </div>
        </div>
        <div className={cn(
          "flex items-center justify-center font-bold uppercase tracking-wider",
          compact ? "text-[10px] pb-1" : "text-xs pb-2"
        )}>
          <div className="flex items-center gap-1.5 text-[#A86F4C]">
            <span className={compact ? "text-sm" : "text-base"}>🐢</span>
            <span>Not Urgent</span>
          </div>
        </div>

        {/* Row 1: Important */}
        <div className={cn(
          "flex items-center justify-center font-bold uppercase tracking-wider",
          compact ? "text-[10px] pr-1" : "text-xs pr-2"
        )}>
          <div className="flex items-center gap-1.5 text-[#A86F4C]" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            <span className={compact ? "text-sm" : "text-base"}>💎</span>
            <span>Important</span>
          </div>
        </div>
        {/* Q1: Urgent & Important */}
        {(() => {
          const quadrant = QUADRANTS[0]; // Q1
          const quadrantTasks = getTasksForQuadrant(incompleteTasks, quadrant);
          return (
            <div
              key={quadrant.id}
              className={cn(
                "flex flex-col border-l-4 rounded-lg transition-all",
                quadrant.bgColor,
                quadrant.borderColor,
                compact ? "p-2 min-h-[250px]" : "p-4 min-h-[500px]" // FIX: Altezza fissa
              )}
            >
              <div className={cn(compact ? "pb-1" : "pb-3")}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn("font-bold", quadrant.textColor, compact ? "text-xs" : "text-lg")}>
                      {quadrant.title}
                    </h3>
                    {!compact && (
                      <p className="text-xs text-muted-foreground font-normal">
                        {quadrant.description}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center justify-center rounded-full",
                    quadrant.bgColor,
                    quadrant.iconColor,
                    "font-bold",
                    compact ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-sm"
                  )}>
                    {quadrantTasks.length}
                  </div>
                </div>
              </div>
              <div className={cn("flex-1 flex flex-col min-h-0", compact ? "pt-0" : "")}>
                <div className={cn("flex-1 overflow-y-auto pr-1", compact ? "space-y-1" : "space-y-2")}>
                  {quadrantTasks.length === 0 ? (
                    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "h-16" : "h-32")}>
                      <CheckCircle2 className={cn("text-muted-foreground/30 mb-1", compact ? "h-5 w-5" : "h-8 w-8")} />
                      <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
                        {compact ? "Empty" : "No tasks in this quadrant"}
                      </p>
                    </div>
                  ) : (
                    quadrantTasks.slice(0, compact ? 3 : undefined).map((task) => (
                      <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} quadrantColor={quadrant.iconColor} compact={compact} />
                    ))
                  )}
                  {compact && quadrantTasks.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                      +{quadrantTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Q2: Important, Not Urgent */}
        {(() => {
          const quadrant = QUADRANTS[1]; // Q2
          const quadrantTasks = getTasksForQuadrant(incompleteTasks, quadrant);
          return (
            <div
              key={quadrant.id}
              className={cn(
                "flex flex-col border-l-4 rounded-lg transition-all",
                quadrant.bgColor,
                quadrant.borderColor,
                compact ? "p-2 min-h-[250px]" : "p-4 min-h-[500px]" // FIX: Altezza fissa
              )}
            >
              <div className={cn(compact ? "pb-1" : "pb-3")}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn("font-bold", quadrant.textColor, compact ? "text-xs" : "text-lg")}>
                      {quadrant.title}
                    </h3>
                    {!compact && (
                      <p className="text-xs text-muted-foreground font-normal">
                        {quadrant.description}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center justify-center rounded-full",
                    quadrant.bgColor,
                    quadrant.iconColor,
                    "font-bold",
                    compact ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-sm"
                  )}>
                    {quadrantTasks.length}
                  </div>
                </div>
              </div>
              <div className={cn("flex-1 flex flex-col min-h-0", compact ? "pt-0" : "")}>
                <div className={cn("flex-1 overflow-y-auto pr-1", compact ? "space-y-1" : "space-y-2")}>
                  {quadrantTasks.length === 0 ? (
                    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "h-16" : "h-32")}>
                      <CheckCircle2 className={cn("text-muted-foreground/30 mb-1", compact ? "h-5 w-5" : "h-8 w-8")} />
                      <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
                        {compact ? "Empty" : "No tasks in this quadrant"}
                      </p>
                    </div>
                  ) : (
                    quadrantTasks.slice(0, compact ? 3 : undefined).map((task) => (
                      <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} quadrantColor={quadrant.iconColor} compact={compact} />
                    ))
                  )}
                  {compact && quadrantTasks.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                      +{quadrantTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Row 2: Not Important */}
        <div className={cn(
          "flex items-center justify-center font-bold uppercase tracking-wider",
          compact ? "text-[10px] pr-1" : "text-xs pr-2"
        )}>
          <div className="flex items-center gap-1.5 text-gray-500" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            <span className={compact ? "text-sm" : "text-base"}>🚮</span>
            <span>Not Important</span>
          </div>
        </div>
        {/* Q3: Urgent, Not Important */}
        {(() => {
          const quadrant = QUADRANTS[2]; // Q3
          const quadrantTasks = getTasksForQuadrant(incompleteTasks, quadrant);
          return (
            <div
              key={quadrant.id}
              className={cn(
                "flex flex-col border-l-4 rounded-lg transition-all",
                quadrant.bgColor,
                quadrant.borderColor,
                compact ? "p-2 min-h-[250px]" : "p-4 min-h-[500px]" // FIX: Altezza fissa
              )}
            >
              <div className={cn(compact ? "pb-1" : "pb-3")}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn("font-bold", quadrant.textColor, compact ? "text-xs" : "text-lg")}>
                      {quadrant.title}
                    </h3>
                    {!compact && (
                      <p className="text-xs text-muted-foreground font-normal">
                        {quadrant.description}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center justify-center rounded-full",
                    quadrant.bgColor,
                    quadrant.iconColor,
                    "font-bold",
                    compact ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-sm"
                  )}>
                    {quadrantTasks.length}
                  </div>
                </div>
              </div>
              <div className={cn("flex-1 flex flex-col min-h-0", compact ? "pt-0" : "")}>
                <div className={cn("flex-1 overflow-y-auto pr-1", compact ? "space-y-1" : "space-y-2")}>
                  {quadrantTasks.length === 0 ? (
                    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "h-16" : "h-32")}>
                      <CheckCircle2 className={cn("text-muted-foreground/30 mb-1", compact ? "h-5 w-5" : "h-8 w-8")} />
                      <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
                        {compact ? "Empty" : "No tasks in this quadrant"}
                      </p>
                    </div>
                  ) : (
                    quadrantTasks.slice(0, compact ? 3 : undefined).map((task) => (
                      <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} quadrantColor={quadrant.iconColor} compact={compact} />
                    ))
                  )}
                  {compact && quadrantTasks.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                      +{quadrantTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Q4: Not Urgent, Not Important */}
        {(() => {
          const quadrant = QUADRANTS[3]; // Q4
          const quadrantTasks = getTasksForQuadrant(incompleteTasks, quadrant);
          return (
            <div
              key={quadrant.id}
              className={cn(
                "flex flex-col border-l-4 rounded-lg transition-all",
                quadrant.bgColor,
                quadrant.borderColor,
                compact ? "p-2 min-h-[250px]" : "p-4 min-h-[500px]" // FIX: Altezza fissa
              )}
            >
              <div className={cn(compact ? "pb-1" : "pb-3")}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn("font-bold", quadrant.textColor, compact ? "text-xs" : "text-lg")}>
                      {quadrant.title}
                    </h3>
                    {!compact && (
                      <p className="text-xs text-muted-foreground font-normal">
                        {quadrant.description}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "flex items-center justify-center rounded-full",
                    quadrant.bgColor,
                    quadrant.iconColor,
                    "font-bold",
                    compact ? "w-5 h-5 text-[10px]" : "w-8 h-8 text-sm"
                  )}>
                    {quadrantTasks.length}
                  </div>
                </div>
              </div>
              <div className={cn("flex-1 flex flex-col min-h-0", compact ? "pt-0" : "")}>
                <div className={cn("flex-1 overflow-y-auto pr-1", compact ? "space-y-1" : "space-y-2")}>
                  {quadrantTasks.length === 0 ? (
                    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "h-16" : "h-32")}>
                      <CheckCircle2 className={cn("text-muted-foreground/30 mb-1", compact ? "h-5 w-5" : "h-8 w-8")} />
                      <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
                        {compact ? "Empty" : "No tasks in this quadrant"}
                      </p>
                    </div>
                  ) : (
                    quadrantTasks.slice(0, compact ? 3 : undefined).map((task) => (
                      <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} quadrantColor={quadrant.iconColor} compact={compact} />
                    ))
                  )}
                  {compact && quadrantTasks.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground pt-1">
                      +{quadrantTasks.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { format } from "date-fns";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LifeOSEvent } from "@/types/calendar";
import type { LifeOSTask } from "@/types/tasks";
import { PRIORITY_COLORS } from "@/types/tasks";

/**
 * Get greeting based on current time
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Format event time for display
 */
function formatEventTime(dateString: string): string {
  return format(new Date(dateString), "h:mm a");
}

/**
 * Event Item Component
 */
function EventItem({ event }: { event: LifeOSEvent }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: event.background_color || "#3b82f6" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {event.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatEventTime(event.start)}
          {event.end && ` - ${formatEventTime(event.end)}`}
        </p>
      </div>
    </div>
  );
}

/**
 * Task Item Component
 */
function TaskItem({ task }: { task: LifeOSTask }) {
  const priorityInfo = PRIORITY_COLORS[task.priority];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: priorityInfo.bg }}
          title={priorityInfo.label}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground">{priorityInfo.label}</p>
      </div>
    </div>
  );
}

/**
 * DashboardView Component
 *
 * Main dashboard that aggregates data from events and tasks:
 * - Greeting and current date
 * - Today's events schedule
 * - Top priority tasks
 * - Completion stats
 *
 * @example
 * ```tsx
 * <DashboardView />
 * ```
 */
export function DashboardView() {
  const {
    todayEvents,
    pendingTasks,
    completedCount,
    isLoading,
    error,
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-destructive font-medium mb-2">
          Error loading dashboard
        </div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  const greeting = getGreeting();
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="border-b px-6 py-6">
        <h1 className="text-3xl font-semibold">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Tasks Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep up the great work!
            </p>
          </CardContent>
        </Card>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Agenda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Agenda
              </CardTitle>
              <CardDescription>
                Your scheduled events for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No events today. Free time!
                </div>
              ) : (
                <div className="space-y-1">
                  {todayEvents.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Priorities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Top Priorities
              </CardTitle>
              <CardDescription>
                Your most important pending tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No pending tasks. You're all caught up!
                </div>
              ) : (
                <div className="space-y-1">
                  {pendingTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

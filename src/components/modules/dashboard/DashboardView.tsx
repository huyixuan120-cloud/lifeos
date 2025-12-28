"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Flame,
  Clock,
  Calendar as CalendarIcon,
  Zap,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifeOSTask } from "@/types/tasks";
import { cn } from "@/lib/utils";
import { HabitTracker } from "@/components/dashboard/HabitTracker";

interface DashboardViewProps {
  tasks?: LifeOSTask[];
  events?: any[];
  onAddTask?: (title: string) => Promise<void>;
}

/**
 * DashboardView - Morning Dashboard / Homepage
 *
 * A "Bento Grid" layout providing a high-level overview of the day:
 * - Greeting header
 * - Focus session stats
 * - Critical tasks (Q1: Urgent & Important)
 * - Upcoming events timeline
 * - Quick inbox for thought capture
 *
 * @example
 * ```tsx
 * <DashboardView tasks={tasks} events={events} onAddTask={addTask} />
 * ```
 */
export function DashboardView({ tasks = [], events = [], onAddTask }: DashboardViewProps) {
  const router = useRouter();
  const [inboxInput, setInboxInput] = useState("");
  const [isAddingInbox, setIsAddingInbox] = useState(false);

  // Get current date and time info
  const now = new Date();
  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = now.getHours();

  // Determine greeting based on time
  const getGreeting = () => {
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Filter critical tasks (Q1: Urgent & Important)
  const criticalTasks = tasks.filter(
    (task) => !task.is_completed && task.is_urgent && task.is_important
  ).slice(0, 3);

  // Mock focus stats (replace with real data later)
  const focusMinutesToday = 0;
  const focusSessionsToday = 0;

  // Mock upcoming events (replace with real data later)
  const upcomingEvents = events.slice(0, 4);

  // Handle quick inbox submission
  const handleInboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxInput.trim() || !onAddTask) return;

    try {
      setIsAddingInbox(true);
      await onAddTask(inboxInput.trim());
      setInboxInput("");
    } catch (error) {
      console.error("Failed to add inbox task:", error);
    } finally {
      setIsAddingInbox(false);
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-[#FAF9F7] via-[#FEFDFB] to-[#F5EFE7] dark:from-[#2A2420] dark:via-[#2A2420] dark:to-[#342E28]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Widget 1: Header - Full Width */}
        <Card className="border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#F5EFE7] to-[#FAF9F7] dark:from-[#3E3530] dark:to-[#342E28] rounded-xl">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{dateString}</p>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C97152] to-[#D4915E] bg-clip-text text-transparent">
                  {getGreeting()} 👋
                </h1>
                <p className="text-lg text-muted-foreground">
                  Ready to conquer the day?
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#C97152] dark:text-[#D4915E]">
                    {criticalTasks.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#A86F4C] dark:text-[#B8886B]">
                    {tasks.filter((t) => !t.is_completed).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {focusSessionsToday}
                  </div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habit Tracker - Horizontal Scrollable */}
        <Card className="border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl">
          <CardContent className="p-6">
            <HabitTracker />
          </CardContent>
        </Card>

        {/* Grid Layout: Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Widget 3: Priority Protocol - Span 2 Columns (Left) */}
          <Card className="md:col-span-2 border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-950 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <Flame className="h-5 w-5" />
                Critical Tasks (Do Now)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Urgent & Important - Focus here first
              </p>
            </CardHeader>
            <CardContent>
              {criticalTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All Clear! 🎉</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No critical tasks right now. Great job!
                  </p>
                  <Button
                    onClick={() => router.push("/tasks")}
                    variant="outline"
                    size="sm"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    View All Tasks
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group p-4 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      onClick={() => router.push("/tasks")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1 line-clamp-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}

                  {/* Quick Add Button */}
                  <Button
                    onClick={() => router.push("/tasks")}
                    variant="outline"
                    className="w-full border-dashed border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Critical Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Stacked Widgets */}
          <div className="space-y-6">
            {/* Widget 2: Deep Work Status */}
            <Card className="border-[#E8E2DA] dark:border-[#4A423A] bg-gradient-to-br from-[#F5EFE7] to-[#F9F6F1] dark:from-[#3E3530] dark:to-[#342E28] rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#C97152] dark:text-[#D4915E] text-base">
                  <Target className="h-5 w-5" />
                  Deep Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-4xl font-bold text-[#C97152] dark:text-[#D4915E] mb-1">
                      {focusMinutesToday}m
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Focused today
                    </p>
                  </div>

                  <Button
                    onClick={() => router.push("/focus")}
                    className="w-full bg-[#C97152] hover:bg-[#B8886B] text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Focus Session
                  </Button>

                  {/* Progress indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Daily Goal</span>
                      <span>0 / 120m</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C97152] dark:bg-[#D4915E] transition-all"
                        style={{ width: `${(focusMinutesToday / 120) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget 4: On The Radar - Upcoming Events */}
            <Card className="border-[#E8E2DA] dark:border-[#4A423A] bg-white dark:bg-gray-950 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#A86F4C] dark:text-[#B8886B] text-base">
                  <CalendarIcon className="h-5 w-5" />
                  Up Next
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Upcoming events
                </p>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming events
                    </p>
                    <Button
                      onClick={() => router.push("/calendar")}
                      variant="link"
                      size="sm"
                      className="mt-2"
                    >
                      Open Calendar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={event.id || index}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F5EFE7] dark:hover:bg-[#3E3530] transition-colors cursor-pointer"
                        onClick={() => router.push("/calendar")}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: event.backgroundColor || "#3b82f6" }}
                          />
                          {index < upcomingEvents.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-800 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {event.start ? new Date(event.start).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "All day"}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {event.title || "Untitled Event"}
                          </p>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={() => router.push("/calendar")}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      View All Events
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Widget 5: The Inbox - Bottom Strip */}
        <Card className="border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/50 dark:to-slate-950/50 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Inbox className="h-5 w-5" />
                <span className="font-medium">Quick Capture</span>
              </div>

              <form onSubmit={handleInboxSubmit} className="flex-1 flex gap-2">
                <Input
                  placeholder="Dump a thought, task, or idea here..."
                  value={inboxInput}
                  onChange={(e) => setInboxInput(e.target.value)}
                  disabled={isAddingInbox || !onAddTask}
                  className="flex-1 border-gray-200 dark:border-gray-800"
                />
                <Button
                  type="submit"
                  disabled={!inboxInput.trim() || isAddingInbox || !onAddTask}
                  size="icon"
                  className="bg-[#C97152] hover:bg-[#B8886B]"
                >
                  {isAddingInbox ? (
                    <TrendingUp className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-7">
              Quickly capture anything on your mind without losing focus
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

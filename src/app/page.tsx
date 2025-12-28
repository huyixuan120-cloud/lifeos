"use client";

import { DashboardView } from "@/components/modules/dashboard/DashboardView";
import { useTasks } from "@/hooks/use-tasks";
import { useCalendar } from "@/hooks/use-calendar";

export default function Home() {
  const { tasks, addTask, isLoading } = useTasks();
  const { events } = useCalendar();

  // Debug: Log tasks to console
  console.log("📊 Dashboard - Total tasks:", tasks.length);
  console.log("📊 Dashboard - Tasks data:", tasks);

  const handleQuickAdd = async (title: string) => {
    await addTask({
      title,
      priority: "medium",
      is_completed: false,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#C97152] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardView
      tasks={tasks}
      events={events}
      onAddTask={handleQuickAdd}
    />
  );
}

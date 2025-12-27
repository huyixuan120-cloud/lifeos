"use client";

import { DashboardView } from "@/components/modules/dashboard/DashboardView";
import { useTasks } from "@/hooks/use-tasks";
import { useCalendar } from "@/hooks/use-calendar";

export default function Home() {
  const { tasks, addTask } = useTasks();
  const { events } = useCalendar();

  const handleQuickAdd = async (title: string) => {
    await addTask({
      title,
      priority: "medium",
      is_completed: false,
    });
  };

  return (
    <DashboardView
      tasks={tasks}
      events={events}
      onAddTask={handleQuickAdd}
    />
  );
}

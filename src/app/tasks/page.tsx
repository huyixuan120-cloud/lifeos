"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList } from "@/components/modules/tasks/TaskList";
import { EisenhowerMatrix } from "@/components/modules/tasks/EisenhowerMatrix";
import { TaskCreateDialog } from "@/components/modules/tasks/TaskCreateDialog";
import { CompletedArchive } from "@/components/modules/tasks/CompletedArchive";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { LifeOSTask } from "@/types/tasks";

/**
 * Tasks Page - UNIFIED WITH TIMER (Single Source of Truth)
 *
 * NOW USES SUPABASE as the single source of truth for tasks.
 * - Same data source as Timer page (/focus)
 * - Real-time sync between Planning (Tasks) and Execution (Timer)
 * - Two-way sync: changes here reflect in Timer and vice versa
 *
 * Features:
 * - Top Section: Unified Task Input + Task List (Full Width)
 * - Middle Section: Eisenhower Matrix (Full Width)
 * - Bottom Section: Completed Tasks Archive
 */
export default function TasksPage() {
  const router = useRouter();
  const supabase = createClient();
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Edit Dialog State
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Wrapper for updating task (Matrix view needs partial updates)
  const handleUpdateTask = async (taskId: string, updates: Partial<any>) => {
    await updateTask({
      id: taskId,
      ...updates,
    });
  };

  // Wrapper for creating task (Matrix view passes different structure)
  const handleCreateTask = async (taskData: any) => {
    await addTask({
      title: taskData.title,
      priority: taskData.priority ?? "medium",
      is_urgent: taskData.is_urgent ?? false,
      is_important: taskData.is_important ?? false,
      is_completed: false,
    });
  };

  // Wrapper for adding task (from TaskList)
  const handleAddTask = async (taskData: any) => {
    try {
      await addTask({
        title: taskData.title,
        priority: taskData.priority ?? "medium",
        is_urgent: taskData.is_urgent ?? false,
        is_important: taskData.is_important ?? false,
        is_completed: false,
        due_date: taskData.due_date ?? null,
      });
    } catch (error) {
      console.error("Failed to add task:", error);
      alert("Failed to add task. Please make sure you are logged in.");
    }
  };

  // Toggle task completion - Direct Supabase sync
  // Changes here are immediately reflected in Timer page!
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    await toggleTask(taskId, isCompleted);
  };

  // Edit Handler - Opens edit dialog with task data
  const handleEditTask = (task: LifeOSTask) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  // Edit Submit Handler - Updates task with new data
  const handleEditSubmit = async (taskData: any) => {
    if (!editingTask) return;

    await updateTask({
      id: editingTask.id,
      title: taskData.title,
      priority: taskData.priority,
      is_urgent: taskData.is_urgent,
      is_important: taskData.is_important,
      due_date: taskData.due_date,
    });

    setIsEditDialogOpen(false);
    setEditingTask(null);
  };

  // Show login prompt if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="h-full bg-gradient-to-br from-[#FAF9F7] via-[#FEFDFB] to-[#F5EFE7] dark:from-[#2A2420] dark:via-[#2A2420] dark:to-[#342E28] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-gray-200 dark:border-gray-800 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#C97152] to-[#D4915E] flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription className="text-base">
              You need to sign in to manage your tasks. All your data is private and secured with Row Level Security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 bg-gradient-to-r from-[#C97152] to-[#D4915E] hover:opacity-90 text-white"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign In to Continue
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Sign in with Google or use a magic link via email
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#C97152] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and prioritize your tasks
          </p>
        </div>
      </div>

      {/* VERTICAL SINGLE-COLUMN LAYOUT */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section A: Task Input + Task List (Full Width) */}
          <div className="flex flex-col gap-6">
            <TaskList
              tasks={tasks as LifeOSTask[]}
              onAdd={handleAddTask}
              onToggle={handleToggleTask}
              onDelete={deleteTask}
              onEdit={handleEditTask}
            />
          </div>

          {/* Section B: Eisenhower Matrix (Full Width, generous spacing above) */}
          <div className="mt-16">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Eisenhower Matrix</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Prioritize tasks by urgency and importance
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card">
              <EisenhowerMatrix
                tasks={tasks as LifeOSTask[]}
                onUpdateTask={handleUpdateTask}
                onCreateTask={handleCreateTask}
                compact={false}
              />
            </div>
          </div>

          {/* Section C: Completed Tasks Archive (Full Width, generous spacing above) */}
          <div className="mt-16">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Completed Tasks</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Archive of tasks you've checked off
              </p>
            </div>
            <CompletedArchive tasks={tasks as LifeOSTask[]} />
          </div>
        </div>
      </div>

      {/* Edit Task Dialog */}
      <TaskCreateDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        initialData={editingTask}
        mode={editingTask ? "edit" : "create"}
        onSubmit={handleEditSubmit}
        onAdd={handleAddTask}
        trigger={<span style={{ display: 'none' }} />}
      />
    </div>
  );
}

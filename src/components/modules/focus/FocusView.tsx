"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useLifeOS } from "@/hooks/useLifeOS";
import { useTasks } from "@/hooks/use-tasks";
import { ModeTabSelector } from "./ModeTabSelector";
import { TimerDisplay } from "./TimerDisplay";
import { TaskSection } from "./TaskSection";
import { SettingsModal } from "./SettingsModal";
import { TaskActionsMenu } from "./TaskActionsMenu";
import { FOCUS_MODE_THEMES, FocusMode } from "./theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FocusView - Pomofocus-Style Timer
 *
 * Minimalist three-mode timer (Pomodoro/Short Break/Long Break) with:
 * - Dynamic autumn color themes per mode
 * - Auto-switch after 4 completed pomodoros
 * - Real task integration from Supabase
 * - Persistent global timer state
 * - Simple completion notifications (no XP gamification)
 *
 * Design inspired by Pomofocus with autumn palette:
 * - Pomodoro: Terracotta tones
 * - Short Break: Sage green
 * - Long Break: Blue-grey
 *
 * @example
 * ```tsx
 * <FocusView />
 * ```
 */
export function FocusView() {
  // Global Timer State (persists across navigation)
  const {
    timerState,
    timerSettings,
    timerSettingsError,
    startTimer,
    pauseTimer,
    setTimerMode,
    setTimerTaskId,
    resetDailyPomodoros,
    updateTimerSettings,
    clearCompletedTasks,
    clearAllTasks,
  } = useLifeOS();

  // Supabase Tasks Integration
  const { tasks, isLoading, error, addTask, toggleTask, deleteTask } = useTasks();

  // Local State for Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Get current theme based on mode
  const currentTheme = FOCUS_MODE_THEMES[timerState.mode];

  // Auto-select first incomplete task if no task is active
  useEffect(() => {
    if (!timerState.taskId && !isLoading) {
      const incompleteTasks = tasks.filter((task) => !task.is_completed);
      if (incompleteTasks.length > 0) {
        setTimerTaskId(incompleteTasks[0].id);
      }
    }
  }, [tasks, isLoading, timerState.taskId, setTimerTaskId]);

  // Handle mode switching
  const handleModeChange = (mode: FocusMode) => {
    setTimerMode(mode);
  };

  // Handle task toggle (mark complete/incomplete)
  const handleToggleTask = async (taskId: string) => {
    // Find the task to get its current completion status
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Toggle the completion status
    await toggleTask(taskId, !task.is_completed);

    // If the completed task was active, auto-select next incomplete task
    if (taskId === timerState.taskId && !task.is_completed) {
      const incompleteTasks = tasks.filter(
        (t) => !t.is_completed && t.id !== taskId
      );
      if (incompleteTasks.length > 0) {
        setTimerTaskId(incompleteTasks[0].id);
      } else {
        setTimerTaskId(null);
      }
    }
  };

  // Handle task selection (link to timer)
  const handleSelectTask = (taskId: string) => {
    setTimerTaskId(taskId);
  };

  // Handle adding new task
  const handleAddTask = async (title: string) => {
    await addTask({
      title,
      is_urgent: false,
      is_important: false,
      priority: "medium",
    });
  };

  // Handle task bulk actions
  const handleClearFinished = async () => {
    const completedTasks = tasks.filter((task) => task.is_completed);
    for (const task of completedTasks) {
      await deleteTask(task.id);
    }
  };

  const handleClearAll = async () => {
    for (const task of tasks) {
      await deleteTask(task.id);
    }
  };

  const handleResetPomodoros = () => {
    resetDailyPomodoros();
  };

  return (
    <div
      className={cn(
        "h-full w-full overflow-auto transition-colors duration-500",
        currentTheme.bg
      )}
    >
      <div className="max-w-2xl mx-auto p-8 space-y-8 min-h-screen">
        {/* Header with Settings Button */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Error Banner - Database Setup Required */}
        {timerSettingsError && (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                ⚠️
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  Database Setup Required
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {timerSettingsError}
                </p>
                <div className="text-xs text-red-600 dark:text-red-500 space-y-1">
                  <p>📋 <strong>To fix this:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Open Supabase Dashboard → SQL Editor</li>
                    <li>Run the migration file: <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">supabase/migrations/20250101000000_create_lifeos_tables.sql</code></li>
                    <li>Reload this page</li>
                  </ol>
                  <p className="mt-2">🔍 <strong>Check console for detailed error logs</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode Tab Selector */}
        <div>
          <ModeTabSelector
            currentMode={timerState.mode}
            isTimerActive={timerState.isActive}
            onModeChange={handleModeChange}
          />
        </div>

        {/* Timer Display */}
        <TimerDisplay
          mode={timerState.mode}
          timeLeft={timerState.timeLeft}
          isActive={timerState.isActive}
          onStart={startTimer}
          onPause={pauseTimer}
        />

        {/* Task Section */}
        <div
          className={cn(
            "p-6 rounded-xl shadow-md transition-colors duration-300",
            currentTheme.container
          )}
        >
          {/* Task Header with Actions Menu */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
            <TaskActionsMenu
              onClearFinished={handleClearFinished}
              onClearAll={handleClearAll}
              onResetPomodoros={handleResetPomodoros}
            />
          </div>

          <TaskSection
            tasks={tasks}
            activeTaskId={timerState.taskId}
            pomodorosCompleted={timerState.pomodorosCompleted}
            isLoading={isLoading}
            error={error || null}
            onToggleTask={handleToggleTask}
            onSelectTask={handleSelectTask}
            onAddTask={handleAddTask}
            mode={timerState.mode}
          />
        </div>

        {/* Pomodoro Counter Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Complete 4 pomodoros to unlock a long break 🌟
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={timerSettings}
        onSave={updateTimerSettings}
      />
    </div>
  );
}

"use client";

import React, { createContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import {
  ExtendedTask,
  Goal,
  UserProfile,
  FocusSession,
  FocusTimerState,
  FocusTimerMode,
  TimerSettings,
  calculateGoalProgress,
  determineGoalStatus,
  TaskEffort,
} from "@/types";
import { useTimerSettings } from "@/hooks/use-timer-settings";
import { useFocusSessions } from "@/hooks/use-focus-sessions";
import { useUserProfile } from "@/hooks/use-user-profile";

// =============================================================================
// CONTEXT TYPE DEFINITION
// =============================================================================

interface LifeOSContextType {
  // State
  tasks: ExtendedTask[];
  goals: Goal[];
  userProfile: UserProfile;
  focusSessions: FocusSession[];
  timerState: FocusTimerState;
  timerSettings: TimerSettings;
  timerSettingsError: string | null;

  // Task Management
  addTask: (task: Omit<ExtendedTask, "id" | "created_at" | "updated_at">) => void;
  updateTask: (taskId: string, updates: Partial<ExtendedTask>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  linkTaskToGoal: (taskId: string, goalId: string) => void;
  unlinkTaskFromGoal: (taskId: string) => void;

  // Goal Management
  addGoal: (goal: Omit<Goal, "id" | "linkedTaskIds" | "progress" | "totalTasks" | "completedTasks" | "createdAt" | "updatedAt">) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;

  // Focus Session Management
  addFocusSession: (minutes: number, taskId?: string) => void;

  // Focus Timer Control (Persistent across pages)
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerDuration: (minutes: number) => void;
  setTimerTaskId: (taskId: string | null) => void;
  setTimerMode: (mode: FocusTimerMode) => void; // NEW: Pomofocus mode switching
  incrementPomodoroCount: () => void; // NEW: For auto-switch logic
  resetDailyPomodoros: () => void; // NEW: Reset count at midnight

  // Timer Settings
  updateTimerSettings: (settings: TimerSettings) => void;

  // Task Bulk Actions
  clearCompletedTasks: () => void;
  clearAllTasks: () => void;

  // User Profile
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

export const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_USER_PROFILE: UserProfile = {
  id: "user-1",
  name: "LifeOS User",
  xp: 0,
  level: 0,
  focusMinutes: 0,
  streak: 0,
  tasksCompleted: 0,
  achievements: [],
  memberSince: new Date().toISOString(),
};

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  volume: 50,
  alarmSound: "bell",
};

const MOCK_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Launch SaaS Product",
    category: "business",
    status: "on-track",
    why: "Financial independence and creating value for others",
    targetDate: "2025-06-30",
    linkedTaskIds: ["task-1", "task-2"],
    progress: 40,
    totalTasks: 5,
    completedTasks: 2,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-15T00:00:00.000Z",
  },
  {
    id: "goal-2",
    title: "Master TypeScript",
    category: "learning",
    status: "on-track",
    why: "Level up my development skills and career prospects",
    targetDate: "2025-04-01",
    linkedTaskIds: [],
    progress: 0,
    totalTasks: 0,
    completedTasks: 0,
    createdAt: "2025-01-10T00:00:00.000Z",
    updatedAt: "2025-01-10T00:00:00.000Z",
  },
];

const MOCK_TASKS: ExtendedTask[] = [
  {
    id: "task-1",
    title: "Design landing page mockup",
    is_completed: true,
    priority: "high",
    is_urgent: true,
    is_important: true,
    effort: "high",
    goalId: "goal-1",
    due_date: "2025-01-20T00:00:00.000Z",
    created_at: "2025-01-05T00:00:00.000Z",
    updated_at: "2025-01-12T00:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Set up payment integration",
    is_completed: true,
    priority: "high",
    is_urgent: false,
    is_important: true,
    effort: "high",
    goalId: "goal-1",
    due_date: null,
    created_at: "2025-01-08T00:00:00.000Z",
    updated_at: "2025-01-14T00:00:00.000Z",
  },
  {
    id: "task-3",
    title: "Write product documentation",
    is_completed: false,
    priority: "medium",
    is_urgent: false,
    is_important: true,
    effort: "medium",
    goalId: "goal-1",
    due_date: "2025-01-25T00:00:00.000Z",
    created_at: "2025-01-10T00:00:00.000Z",
    updated_at: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "task-4",
    title: "Review weekly goals",
    is_completed: false,
    priority: "low",
    is_urgent: true,
    is_important: false,
    effort: "low",
    goalId: null,
    due_date: "2025-01-18T00:00:00.000Z",
    created_at: "2025-01-15T00:00:00.000Z",
    updated_at: "2025-01-15T00:00:00.000Z",
  },
];

const MOCK_FOCUS_SESSIONS: FocusSession[] = [
  {
    id: "session-1",
    minutes: 45,
    taskId: "task-1",
    startedAt: "2025-01-12T09:00:00.000Z",
    completedAt: "2025-01-12T09:45:00.000Z",
  },
  {
    id: "session-2",
    minutes: 60,
    taskId: "task-2",
    startedAt: "2025-01-14T14:00:00.000Z",
    completedAt: "2025-01-14T15:00:00.000Z",
  },
];

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface LifeOSProviderProps {
  children: ReactNode;
}

export function LifeOSProvider({ children }: LifeOSProviderProps) {
  const [tasks, setTasks] = useState<ExtendedTask[]>(MOCK_TASKS);
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(MOCK_FOCUS_SESSIONS);

  // Timer Settings (Now from Supabase with RLS!)
  const {
    settings: timerSettings,
    isLoading: isLoadingSettings,
    error: timerSettingsError,
    updateSettings: updateTimerSettingsDB
  } = useTimerSettings();

  // Focus Sessions (Supabase persistence)
  const { addSession: saveSessionToSupabase } = useFocusSessions();

  // User Profile (Supabase persistence)
  const { profile: supabaseProfile, updateProfile: updateSupabaseProfile } = useUserProfile();

  // Focus Timer State (Persists across page navigations)
  const [timerState, setTimerState] = useState<FocusTimerState>({
    isActive: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    duration: 25 * 60,
    mode: "pomodoro", // Changed from "focus" to "pomodoro"
    taskId: null,
    pomodorosCompleted: 0, // NEW: Track completed pomodoros for auto-switch
    currentSessionDate: new Date().toISOString().split('T')[0], // NEW: YYYY-MM-DD
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef<boolean>(false); // Prevent duplicate completion calls
  const audioRef = useRef<HTMLAudioElement | null>(null); // Audio for alarm

  // ===========================================================================
  // TASK MANAGEMENT
  // ===========================================================================

  const addTask = useCallback((taskData: Omit<ExtendedTask, "id" | "created_at" | "updated_at">) => {
    const newTask: ExtendedTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // If linked to a goal, update goal stats
    if (newTask.goalId) {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === newTask.goalId) {
            const newTotalTasks = goal.totalTasks + 1;
            const newProgress = calculateGoalProgress(goal.completedTasks, newTotalTasks);
            return {
              ...goal,
              linkedTaskIds: [...goal.linkedTaskIds, newTask.id],
              totalTasks: newTotalTasks,
              progress: newProgress,
              status: determineGoalStatus(newProgress, goal.targetDate),
              updatedAt: new Date().toISOString(),
            };
          }
          return goal;
        })
      );
    }
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<ExtendedTask>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Remove from tasks
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // Update goal if task was linked
    if (task.goalId) {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === task.goalId) {
            const newLinkedTaskIds = goal.linkedTaskIds.filter((id) => id !== taskId);
            const newTotalTasks = goal.totalTasks - 1;
            const newCompletedTasks = task.is_completed
              ? goal.completedTasks - 1
              : goal.completedTasks;
            const newProgress = calculateGoalProgress(newCompletedTasks, newTotalTasks);

            return {
              ...goal,
              linkedTaskIds: newLinkedTaskIds,
              totalTasks: newTotalTasks,
              completedTasks: newCompletedTasks,
              progress: newProgress,
              status: determineGoalStatus(newProgress, goal.targetDate),
              updatedAt: new Date().toISOString(),
            };
          }
          return goal;
        })
      );
    }
  }, [tasks]);

  const completeTask = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.is_completed) return;

    // Mark task as completed
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_completed: true, updated_at: new Date().toISOString() }
          : t
      )
    );

    // Update user profile (NO XP - Pure productivity tracking)
    setUserProfile((prev) => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
    }));

    console.log(`✅ Task completed!`);

    // Update goal progress if task was linked to a goal
    if (task.goalId) {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === task.goalId) {
            const newCompletedTasks = goal.completedTasks + 1;
            const newProgress = calculateGoalProgress(newCompletedTasks, goal.totalTasks);

            return {
              ...goal,
              completedTasks: newCompletedTasks,
              progress: newProgress,
              status: determineGoalStatus(newProgress, goal.targetDate),
              updatedAt: new Date().toISOString(),
            };
          }
          return goal;
        })
      );
    }
  }, [tasks, userProfile]);

  const linkTaskToGoal = useCallback((taskId: string, goalId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const goal = goals.find((g) => g.id === goalId);

    if (!task || !goal) return;

    // Remove from old goal if already linked
    if (task.goalId) {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id === task.goalId) {
            const newLinkedTaskIds = g.linkedTaskIds.filter((id) => id !== taskId);
            const newTotalTasks = g.totalTasks - 1;
            const newCompletedTasks = task.is_completed
              ? g.completedTasks - 1
              : g.completedTasks;
            const newProgress = calculateGoalProgress(newCompletedTasks, newTotalTasks);

            return {
              ...g,
              linkedTaskIds: newLinkedTaskIds,
              totalTasks: newTotalTasks,
              completedTasks: newCompletedTasks,
              progress: newProgress,
              status: determineGoalStatus(newProgress, g.targetDate),
              updatedAt: new Date().toISOString(),
            };
          }
          return g;
        })
      );
    }

    // Update task with new goal link
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, goalId, updated_at: new Date().toISOString() } : t
      )
    );

    // Add to new goal
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newLinkedTaskIds = [...g.linkedTaskIds, taskId];
          const newTotalTasks = g.totalTasks + 1;
          const newCompletedTasks = task.is_completed
            ? g.completedTasks + 1
            : g.completedTasks;
          const newProgress = calculateGoalProgress(newCompletedTasks, newTotalTasks);

          return {
            ...g,
            linkedTaskIds: newLinkedTaskIds,
            totalTasks: newTotalTasks,
            completedTasks: newCompletedTasks,
            progress: newProgress,
            status: determineGoalStatus(newProgress, g.targetDate),
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      })
    );
  }, [tasks, goals]);

  const unlinkTaskFromGoal = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.goalId) return;

    const goalId = task.goalId;

    // Remove goal link from task
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, goalId: null, updated_at: new Date().toISOString() } : t
      )
    );

    // Update goal
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newLinkedTaskIds = g.linkedTaskIds.filter((id) => id !== taskId);
          const newTotalTasks = g.totalTasks - 1;
          const newCompletedTasks = task.is_completed
            ? g.completedTasks - 1
            : g.completedTasks;
          const newProgress = calculateGoalProgress(newCompletedTasks, newTotalTasks);

          return {
            ...g,
            linkedTaskIds: newLinkedTaskIds,
            totalTasks: newTotalTasks,
            completedTasks: newCompletedTasks,
            progress: newProgress,
            status: determineGoalStatus(newProgress, g.targetDate),
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      })
    );
  }, [tasks]);

  // ===========================================================================
  // GOAL MANAGEMENT
  // ===========================================================================

  const addGoal = useCallback((goalData: Omit<Goal, "id" | "linkedTaskIds" | "progress" | "totalTasks" | "completedTasks" | "createdAt" | "updatedAt">) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      linkedTaskIds: [],
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setGoals((prev) => [newGoal, ...prev]);
  }, []);

  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
          : goal
      )
    );
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    // Unlink all tasks from this goal
    setTasks((prev) =>
      prev.map((task) =>
        task.goalId === goalId
          ? { ...task, goalId: null, updated_at: new Date().toISOString() }
          : task
      )
    );

    // Remove goal
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  }, []);

  // ===========================================================================
  // FOCUS SESSION MANAGEMENT
  // ===========================================================================

  const addFocusSession = useCallback(async (minutes: number, taskId?: string) => {
    const newSession: FocusSession = {
      id: `session-${Date.now()}`,
      minutes,
      taskId: taskId || null,
      startedAt: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
      completedAt: new Date().toISOString(),
    };

    setFocusSessions((prev) => [newSession, ...prev]);

    // Update user profile (NO XP - Pure productivity tracking)
    setUserProfile((prev) => ({
      ...prev,
      focusMinutes: prev.focusMinutes + minutes,
    }));

    // Save to Supabase
    try {
      await saveSessionToSupabase({
        task_id: taskId || null,
        minutes,
        mode: timerState.mode,
        completed: true,
      });

      // Update user profile in Supabase with new focus minutes
      const newTotalMinutes = (supabaseProfile?.focus_minutes || 0) + minutes;
      await updateSupabaseProfile({ focus_minutes: newTotalMinutes });

      console.log(`🎯 Focus session saved to Supabase! (${minutes} minutes)`);
    } catch (error) {
      console.error("Failed to save focus session to Supabase:", error);
      // Don't block the UI - session is saved locally
    }
  }, [saveSessionToSupabase, updateSupabaseProfile, supabaseProfile, timerState.mode]);

  // ===========================================================================
  // FOCUS TIMER CONTROL (Persistent Timer)
  // ===========================================================================

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  /**
   * Show browser notification
   */
  const showNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "focus-timer",
        requireInteraction: true,
      });
    }
  }, []);

  /**
   * Play alarm sound based on settings
   */
  const playAlarm = useCallback(() => {
    if (typeof window === "undefined" || timerSettings.volume === 0) return;

    // Create simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Adjust frequency based on alarm sound selection
    const frequencies: Record<TimerSettings["alarmSound"], number> = {
      bell: 800,
      digital: 1000,
      wood: 600,
      bird: 1200,
    };

    oscillator.frequency.value = frequencies[timerSettings.alarmSound];
    oscillator.type = "sine";

    // Set volume (0-1 range)
    gainNode.gain.value = timerSettings.volume / 100;

    // Play for 200ms
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    console.log(`🔔 Alarm played: ${timerSettings.alarmSound} at ${timerSettings.volume}% volume`);
  }, [timerSettings]);

  /**
   * Handle timer completion
   */
  const handleTimerCompletion = useCallback(() => {
    // Prevent duplicate completion
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    const currentMode = timerState.mode;
    const durationInMinutes = Math.floor(timerState.duration / 60);

    // Play alarm sound
    playAlarm();

    // Save focus session (without XP gamification)
    addFocusSession(durationInMinutes, timerState.taskId || undefined);

    // AUTO-SWITCH LOGIC (Pomofocus-style)
    if (currentMode === "pomodoro") {
      // Pomodoro completed - increment count
      const newPomodorosCompleted = timerState.pomodorosCompleted + 1;

      // Every 4th pomodoro → Long Break, else → Short Break
      const nextMode = (newPomodorosCompleted % 4 === 0) ? "longBreak" : "shortBreak";
      const nextDuration = nextMode === "longBreak"
        ? timerSettings.longBreakDuration * 60
        : timerSettings.shortBreakDuration * 60;

      // Show notification
      showNotification(
        "🎉 Pomodoro Complete!",
        nextMode === "longBreak"
          ? "Great work! Time for a long break."
          : "Well done! Take a short break."
      );

      console.log(`🎉 Pomodoro #${newPomodorosCompleted} complete! Switching to ${nextMode}`);

      // Update state with new mode and count
      setTimerState((prev) => ({
        ...prev,
        mode: nextMode,
        duration: nextDuration,
        timeLeft: nextDuration,
        isActive: timerSettings.autoStartBreaks, // Auto-start if enabled
        pomodorosCompleted: newPomodorosCompleted,
      }));
    } else {
      // Break completed - switch back to pomodoro
      const pomodoroDuration = timerSettings.pomodoroDuration * 60;

      showNotification(
        "☕ Break Over!",
        "Ready to focus? Let's get back to work!"
      );

      console.log(`☕ ${currentMode} complete! Switching to pomodoro`);

      setTimerState((prev) => ({
        ...prev,
        mode: "pomodoro",
        duration: pomodoroDuration,
        timeLeft: pomodoroDuration,
        isActive: timerSettings.autoStartPomodoros, // Auto-start if enabled
      }));
    }

    // Reset completion flag after a delay
    setTimeout(() => {
      hasCompletedRef.current = false;
    }, 1000);
  }, [timerState.mode, timerState.duration, timerState.taskId, timerState.pomodorosCompleted, timerSettings, addFocusSession, showNotification, playAlarm]);

  /**
   * The Heartbeat - Timer countdown logic
   * Runs every second when timer is active
   */
  useEffect(() => {
    // Only run interval if timer is active AND there's time left
    if (timerState.isActive && timerState.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;

          // Check for completion
          if (newTimeLeft <= 0) {
            // Trigger completion handler
            handleTimerCompletion();
            // Return with isActive: false to stop the timer
            return {
              ...prev,
              isActive: false,      // CRITICAL: Stop the timer
              timeLeft: 0           // Set to 0 (will be reset to duration in handleTimerCompletion)
            };
          }

          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else {
      // Clear interval when timer is not active or time is up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isActive, timerState.timeLeft, handleTimerCompletion]);

  /**
   * Request notification permission on mount
   */
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  /**
   * Daily Reset - Reset pomodoro count at midnight
   * NEW: For Pomofocus-style daily tracking
   */
  useEffect(() => {
    const checkDailyReset = () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // If date has changed, reset pomodoro count
      if (timerState.currentSessionDate !== today) {
        setTimerState((prev) => ({
          ...prev,
          pomodorosCompleted: 0,
          currentSessionDate: today,
        }));
        console.log("🌅 New day! Pomodoro count reset to 0");
      }
    };

    // Check on mount
    checkDailyReset();

    // Check every minute (lightweight check)
    const interval = setInterval(checkDailyReset, 60000);

    return () => clearInterval(interval);
  }, [timerState.currentSessionDate]);

  /**
   * Start the timer
   */
  const startTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isActive: true }));
    console.log("⏰ Timer started");
  }, []);

  /**
   * Pause the timer
   */
  const pauseTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isActive: false }));
    console.log("⏸️ Timer paused");
  }, []);

  /**
   * Reset the timer to initial duration
   */
  const resetTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      timeLeft: prev.duration,
    }));
    hasCompletedRef.current = false;
    console.log("🔄 Timer reset");
  }, []);

  /**
   * Set timer duration (in minutes)
   */
  const setTimerDuration = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setTimerState((prev) => ({
      ...prev,
      duration: seconds,
      timeLeft: seconds,
      isActive: false,
    }));
    hasCompletedRef.current = false;
    console.log(`⏱️ Timer duration set to ${minutes} minutes`);
  }, []);

  /**
   * Set task ID for current timer session
   */
  const setTimerTaskId = useCallback((taskId: string | null) => {
    setTimerState((prev) => ({ ...prev, taskId }));
  }, []);

  /**
   * Set timer mode and update duration accordingly
   * NEW: For Pomofocus-style mode switching
   */
  const setTimerMode = useCallback((mode: FocusTimerMode) => {
    // Use durations from settings
    const durations = {
      pomodoro: timerSettings.pomodoroDuration * 60,
      shortBreak: timerSettings.shortBreakDuration * 60,
      longBreak: timerSettings.longBreakDuration * 60,
    };

    const newDuration = durations[mode];

    setTimerState((prev) => ({
      ...prev,
      mode,
      duration: newDuration,
      timeLeft: newDuration,
      isActive: false, // Always pause when switching modes
    }));

    hasCompletedRef.current = false;
    console.log(`🔄 Timer mode set to ${mode} (${newDuration / 60} minutes)`);
  }, [timerSettings]);

  /**
   * Increment pomodoro count (for auto-switch logic)
   * NEW: Called when a pomodoro completes
   */
  const incrementPomodoroCount = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      pomodorosCompleted: prev.pomodorosCompleted + 1,
    }));
  }, []);

  /**
   * Reset daily pomodoro count
   * NEW: Called at midnight or manually
   */
  const resetDailyPomodoros = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      pomodorosCompleted: 0,
      currentSessionDate: new Date().toISOString().split('T')[0],
    }));
    console.log("🌅 Daily pomodoro count reset");
  }, []);

  // ===========================================================================
  // TIMER SETTINGS
  // ===========================================================================

  /**
   * Update timer settings and persist to Supabase (with RLS)
   */
  const updateTimerSettings = useCallback(async (settings: TimerSettings) => {
    try {
      await updateTimerSettingsDB(settings);
      console.log("⚙️ Timer settings updated in Supabase");
    } catch (error) {
      console.error("Failed to update timer settings:", error);
    }
  }, [updateTimerSettingsDB]);

  // ===========================================================================
  // TASK BULK ACTIONS
  // ===========================================================================

  /**
   * Clear all completed tasks
   */
  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.is_completed));
    console.log("🗑️ Completed tasks cleared");
  }, []);

  /**
   * Clear all tasks (requires confirmation)
   */
  const clearAllTasks = useCallback(() => {
    setTasks([]);
    console.log("🗑️ All tasks cleared");
  }, []);

  // ===========================================================================
  // USER PROFILE
  // ===========================================================================

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  // ===========================================================================
  // CONTEXT VALUE
  // ===========================================================================

  const value: LifeOSContextType = {
    // State
    tasks,
    goals,
    userProfile,
    focusSessions,
    timerState,
    timerSettings,
    timerSettingsError,

    // Task Management
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    linkTaskToGoal,
    unlinkTaskFromGoal,

    // Goal Management
    addGoal,
    updateGoal,
    deleteGoal,

    // Focus Session Management
    addFocusSession,

    // Focus Timer Control
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerDuration,
    setTimerTaskId,
    setTimerMode, // NEW: Pomofocus mode switching
    incrementPomodoroCount, // NEW: Auto-switch logic
    resetDailyPomodoros, // NEW: Daily reset

    // Timer Settings
    updateTimerSettings,

    // Task Bulk Actions
    clearCompletedTasks,
    clearAllTasks,

    // User Profile
    updateUserProfile,
  };

  return <LifeOSContext.Provider value={value}>{children}</LifeOSContext.Provider>;
}

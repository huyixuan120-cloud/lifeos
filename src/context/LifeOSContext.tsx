"use client";

import React, { createContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import {
  ExtendedTask,
  Goal,
  UserProfile,
  FocusSession,
  FocusTimerState,
  calculateTaskXP,
  calculateFocusXP,
  calculateLevel,
  calculateGoalProgress,
  determineGoalStatus,
  TaskEffort,
} from "@/types";

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
  xp: 2450,
  level: 2,
  focusMinutes: 240,
  streak: 12,
  tasksCompleted: 42,
  achievements: ["early-bird", "deep-worker", "task-master"],
  memberSince: "2025-01-01T00:00:00.000Z",
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

  // Focus Timer State (Persists across page navigations)
  const [timerState, setTimerState] = useState<FocusTimerState>({
    isActive: false,
    timeLeft: 25 * 60, // 25 minutes in seconds
    duration: 25 * 60,
    mode: "focus",
    taskId: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef<boolean>(false); // Prevent duplicate completion calls

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

    // Calculate XP reward
    const xpReward = calculateTaskXP(task);
    const newXP = userProfile.xp + xpReward.totalXP;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > userProfile.level;

    // Update user profile
    setUserProfile((prev) => ({
      ...prev,
      xp: newXP,
      level: newLevel,
      tasksCompleted: prev.tasksCompleted + 1,
    }));

    // Show level up notification (in a real app)
    if (leveledUp) {
      console.log(`🎉 Level Up! You're now Level ${newLevel}!`);
    }

    console.log(`✅ Task completed! +${xpReward.totalXP} XP`);

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

  const addFocusSession = useCallback((minutes: number, taskId?: string) => {
    const newSession: FocusSession = {
      id: `session-${Date.now()}`,
      minutes,
      taskId: taskId || null,
      startedAt: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
      completedAt: new Date().toISOString(),
    };

    setFocusSessions((prev) => [newSession, ...prev]);

    // Calculate XP reward (10 XP per minute)
    const xpReward = calculateFocusXP(minutes);
    const newXP = userProfile.xp + xpReward;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > userProfile.level;

    // Update user profile
    setUserProfile((prev) => ({
      ...prev,
      xp: newXP,
      level: newLevel,
      focusMinutes: prev.focusMinutes + minutes,
    }));

    // Show level up notification
    if (leveledUp) {
      console.log(`🎉 Level Up! You're now Level ${newLevel}!`);
    }

    console.log(`🎯 Focus session completed! +${xpReward} XP (${minutes} minutes)`);
  }, [userProfile]);

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
   * Handle timer completion
   */
  const handleTimerCompletion = useCallback(() => {
    // Prevent duplicate completion
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    // Calculate duration in minutes
    const durationInMinutes = Math.floor(timerState.duration / 60);

    // Award XP and save focus session
    addFocusSession(durationInMinutes, timerState.taskId || undefined);

    // Calculate XP earned
    const xpEarned = calculateFocusXP(durationInMinutes);

    // Show browser notification
    showNotification(
      "🎉 Focus Session Complete!",
      `Well done! You earned +${xpEarned} XP for ${durationInMinutes} minutes of focused work.`
    );

    // Log completion
    console.log(`🎉 Focus Timer Complete! ${durationInMinutes} minutes, +${xpEarned} XP`);

    // TODO: Play completion sound
    // const audio = new Audio('/sounds/complete.mp3');
    // audio.play();

    // CRITICAL: Stop timer and reset to initial state BUT KEEP IT PAUSED
    setTimerState((prev) => ({
      ...prev,
      isActive: false,        // STOP the timer (don't auto-restart)
      timeLeft: prev.duration, // Reset to full duration
    }));

    // Reset completion flag after a delay
    setTimeout(() => {
      hasCompletedRef.current = false;
    }, 1000);
  }, [timerState.duration, timerState.taskId, addFocusSession, showNotification]);

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

    // User Profile
    updateUserProfile,
  };

  return <LifeOSContext.Provider value={value}>{children}</LifeOSContext.Provider>;
}

/**
 * LifeOS Integration Types
 *
 * Central type definitions for the Smart Integration System
 * Connects Tasks, Goals, Focus Sessions, and User Profile (Gamification)
 */

import { LifeOSTask, TaskPriority } from "./tasks";

// =============================================================================
// TASK EXTENSIONS
// =============================================================================

/**
 * Task effort levels for XP calculation
 */
export type TaskEffort = "low" | "medium" | "high";

/**
 * Extended task type with gamification and goal-linking
 */
export interface ExtendedTask extends LifeOSTask {
  /**
   * Linked goal ID (optional)
   * Connects this task to a specific goal for progress tracking
   */
  goalId?: string | null;

  /**
   * Effort required to complete this task
   * Used for XP reward calculations
   * Default: 'medium'
   */
  effort?: TaskEffort;
}

// =============================================================================
// GOAL TYPES
// =============================================================================

/**
 * Goal categories for organization
 */
export type GoalCategory =
  | "health"
  | "business"
  | "learning"
  | "finance"
  | "personal"
  | "social";

/**
 * Goal status indicators
 */
export type GoalStatus = "on-track" | "behind" | "completed";

/**
 * Goal definition with smart task integration
 */
export interface Goal {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Goal title
   */
  title: string;

  /**
   * Goal category
   */
  category: GoalCategory;

  /**
   * Current goal status
   */
  status: GoalStatus;

  /**
   * Motivation/reason for this goal
   */
  why: string;

  /**
   * Target completion date (optional)
   */
  targetDate?: string | null;

  /**
   * IDs of tasks linked to this goal
   * Updated automatically when tasks are linked/unlinked
   */
  linkedTaskIds: string[];

  /**
   * Progress percentage (0-100)
   * Auto-calculated: (completedTasks / totalTasks) * 100
   */
  progress: number;

  /**
   * Total number of tasks linked to this goal
   */
  totalTasks: number;

  /**
   * Number of completed tasks linked to this goal
   */
  completedTasks: number;

  /**
   * Timestamp when goal was created
   */
  createdAt: string;

  /**
   * Timestamp when goal was last updated
   */
  updatedAt: string;
}

// =============================================================================
// USER PROFILE / GAMIFICATION
// =============================================================================

/**
 * User profile with gamification metrics
 */
export interface UserProfile {
  /**
   * User ID
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Total experience points earned
   */
  xp: number;

  /**
   * Current level (calculated from XP)
   * Formula: floor(sqrt(xp / 500))
   */
  level: number;

  /**
   * Total focus minutes logged
   */
  focusMinutes: number;

  /**
   * Current daily streak (days)
   */
  streak: number;

  /**
   * Total tasks completed
   */
  tasksCompleted: number;

  /**
   * Achievement IDs unlocked
   */
  achievements: string[];

  /**
   * Member since date
   */
  memberSince: string;
}

// =============================================================================
// FOCUS SESSION
// =============================================================================

/**
 * Focus session record
 */
export interface FocusSession {
  /**
   * Session ID
   */
  id: string;

  /**
   * Duration in minutes
   */
  minutes: number;

  /**
   * Task ID (if session was linked to a task)
   */
  taskId?: string | null;

  /**
   * Timestamp when session started
   */
  startedAt: string;

  /**
   * Timestamp when session completed
   */
  completedAt: string;
}

/**
 * Focus timer mode
 */
export type FocusTimerMode = "focus" | "break";

/**
 * Focus timer state
 * Persists across page navigations
 */
export interface FocusTimerState {
  /**
   * Whether the timer is currently running
   */
  isActive: boolean;

  /**
   * Time remaining in seconds
   */
  timeLeft: number;

  /**
   * Total duration in seconds (for calculating progress)
   */
  duration: number;

  /**
   * Current timer mode
   */
  mode: FocusTimerMode;

  /**
   * Optional task ID linked to this timer session
   */
  taskId?: string | null;
}

// =============================================================================
// XP REWARD CALCULATIONS
// =============================================================================

/**
 * XP reward tiers based on task characteristics
 */
export interface XPReward {
  baseXP: number;
  effortMultiplier: number;
  urgencyBonus: number;
  importanceBonus: number;
  totalXP: number;
}

/**
 * Calculate XP reward for completing a task
 */
export function calculateTaskXP(task: ExtendedTask): XPReward {
  // Base XP by effort
  const effortXP: Record<TaskEffort, number> = {
    low: 50,
    medium: 100,
    high: 150,
  };

  const baseXP = effortXP[task.effort || "medium"];

  // Multiplier for priority
  const priorityMultipliers: Record<TaskPriority, number> = {
    low: 1.0,
    medium: 1.2,
    high: 1.5,
  };

  const effortMultiplier = priorityMultipliers[task.priority];

  // Bonuses for Eisenhower Matrix
  const urgencyBonus = task.is_urgent ? 25 : 0;
  const importanceBonus = task.is_important ? 25 : 0;

  // Calculate total
  const totalXP = Math.floor(baseXP * effortMultiplier + urgencyBonus + importanceBonus);

  return {
    baseXP,
    effortMultiplier,
    urgencyBonus,
    importanceBonus,
    totalXP,
  };
}

/**
 * Calculate XP reward for focus session
 * Formula: 10 XP per minute
 */
export function calculateFocusXP(minutes: number): number {
  return minutes * 10;
}

/**
 * Calculate user level from total XP
 * Formula: floor(sqrt(xp / 500))
 * Examples:
 *   - 0 XP = Level 0
 *   - 500 XP = Level 1
 *   - 2000 XP = Level 2
 *   - 4500 XP = Level 3
 *   - 8000 XP = Level 4
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 500));
}

/**
 * Calculate XP needed for next level
 */
export function calculateXPForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return (nextLevel * nextLevel) * 500;
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    0: "Beginner",
    1: "Novice",
    2: "Apprentice",
    3: "Practitioner",
    4: "Expert",
    5: "Architect",
    6: "Master",
    7: "Virtuoso",
    8: "Legend",
  };

  if (level >= 9) return "Transcendent";
  return titles[level] || "Unknown";
}

// =============================================================================
// GOAL PROGRESS CALCULATIONS
// =============================================================================

/**
 * Calculate goal progress percentage
 */
export function calculateGoalProgress(completedTasks: number, totalTasks: number): number {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Determine goal status based on progress and deadline
 */
export function determineGoalStatus(
  progress: number,
  targetDate?: string | null
): GoalStatus {
  if (progress === 100) return "completed";

  if (targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const daysUntilDeadline = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If less than 30% progress and less than 7 days remaining, mark as behind
    if (progress < 30 && daysUntilDeadline < 7) {
      return "behind";
    }

    // If past deadline and not complete, mark as behind
    if (daysUntilDeadline < 0) {
      return "behind";
    }
  }

  return "on-track";
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { LifeOSTask, TaskPriority, CreateTaskInput, UpdateTaskInput } from "./tasks";
export type { LifeOSEvent, CreateLifeOSEvent } from "./calendar";

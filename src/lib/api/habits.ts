/**
 * Habit Tracker API Functions
 *
 * CRUD operations for habits and habit logs with localStorage fallback
 */

import { supabase } from '@/lib/supabase';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  created_at: string;
  updated_at: string;
  // Client-side computed fields
  completed_today?: boolean;
  streak?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string; // Date string (YYYY-MM-DD)
  created_at: string;
}

/**
 * Get all habits with today's completion status and streak
 */
export async function getHabits(): Promise<Habit[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated - use localStorage
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem("lifeos_habits");
    if (!stored) return [];

    try {
      const habits: Habit[] = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];

      // Get logs from localStorage
      const logsStored = localStorage.getItem("lifeos_habit_logs");
      const logs: HabitLog[] = logsStored ? JSON.parse(logsStored) : [];

      // Calculate completion status and streaks
      return habits.map(habit => ({
        ...habit,
        completed_today: logs.some(log => log.habit_id === habit.id && log.completed_at === today),
        streak: calculateStreakLocal(habit.id, logs),
      }));
    } catch (e) {
      console.error("Failed to parse localStorage habits:", e);
      return [];
    }
  }

  // Fetch from Supabase
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching habits:", error);
    return [];
  }

  if (!habits) return [];

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's logs
  const { data: todayLogs } = await supabase
    .from('habit_logs')
    .select('habit_id')
    .in('habit_id', habits.map(h => h.id))
    .eq('completed_at', today);

  const completedTodaySet = new Set(todayLogs?.map(log => log.habit_id) || []);

  // Calculate streaks and add completion status
  const habitsWithData = await Promise.all(
    habits.map(async (habit) => {
      const streak = await calculateStreak(habit.id);
      return {
        ...habit,
        completed_today: completedTodaySet.has(habit.id),
        streak,
      };
    })
  );

  return habitsWithData;
}

/**
 * Create a new habit
 */
export async function createHabit(title: string, emoji: string): Promise<Habit | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated - use localStorage
    if (typeof window === "undefined") return null;

    const newHabit: Habit = {
      id: `local_habit_${Date.now()}`,
      user_id: "local",
      title,
      emoji,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_today: false,
      streak: 0,
    };

    const stored = localStorage.getItem("lifeos_habits");
    const habits: Habit[] = stored ? JSON.parse(stored) : [];
    habits.push(newHabit);
    localStorage.setItem("lifeos_habits", JSON.stringify(habits));

    return newHabit;
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from('habits')
    .insert([{ user_id: user.id, title, emoji }])
    .select()
    .single();

  if (error) {
    console.error("Error creating habit:", error);
    return null;
  }

  return { ...data, completed_today: false, streak: 0 };
}

/**
 * Toggle habit completion for a specific date (default: today)
 * If log exists, delete it. If not, create it.
 */
export async function toggleHabit(habitId: string, date?: string): Promise<boolean> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated - use localStorage
    if (typeof window === "undefined") return false;

    const logsStored = localStorage.getItem("lifeos_habit_logs");
    const logs: HabitLog[] = logsStored ? JSON.parse(logsStored) : [];

    // Check if log exists
    const existingIndex = logs.findIndex(
      log => log.habit_id === habitId && log.completed_at === targetDate
    );

    if (existingIndex >= 0) {
      // Delete log
      logs.splice(existingIndex, 1);
    } else {
      // Create log
      logs.push({
        id: `local_log_${Date.now()}`,
        habit_id: habitId,
        completed_at: targetDate,
        created_at: new Date().toISOString(),
      });
    }

    localStorage.setItem("lifeos_habit_logs", JSON.stringify(logs));
    return true;
  }

  // Check if log exists in Supabase
  const { data: existingLog } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_at', targetDate)
    .single();

  if (existingLog) {
    // Delete log
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existingLog.id);

    if (error) {
      console.error("Error deleting habit log:", error);
      return false;
    }
  } else {
    // Create log
    const { error } = await supabase
      .from('habit_logs')
      .insert([{ habit_id: habitId, completed_at: targetDate }]);

    if (error) {
      console.error("Error creating habit log:", error);
      return false;
    }
  }

  return true;
}

/**
 * Delete a habit (and all its logs)
 */
export async function deleteHabit(habitId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated - use localStorage
    if (typeof window === "undefined") return false;

    const stored = localStorage.getItem("lifeos_habits");
    const habits: Habit[] = stored ? JSON.parse(stored) : [];
    const filtered = habits.filter(h => h.id !== habitId);
    localStorage.setItem("lifeos_habits", JSON.stringify(filtered));

    // Also delete logs
    const logsStored = localStorage.getItem("lifeos_habit_logs");
    const logs: HabitLog[] = logsStored ? JSON.parse(logsStored) : [];
    const filteredLogs = logs.filter(log => log.habit_id !== habitId);
    localStorage.setItem("lifeos_habit_logs", JSON.stringify(filteredLogs));

    return true;
  }

  // Delete from Supabase (cascade will delete logs)
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (error) {
    console.error("Error deleting habit:", error);
    return false;
  }

  return true;
}

/**
 * Calculate streak for a habit (Supabase)
 * Returns number of consecutive days ending today or yesterday
 */
async function calculateStreak(habitId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('calculate_habit_streak', { p_habit_id: habitId });

  if (error) {
    console.error("Error calculating streak:", error);
    return 0;
  }

  return data || 0;
}

/**
 * Calculate streak for a habit (localStorage)
 * Returns number of consecutive days ending today or yesterday
 */
function calculateStreakLocal(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter(log => log.habit_id === habitId)
    .map(log => new Date(log.completed_at))
    .sort((a, b) => b.getTime() - a.getTime()); // Sort descending

  if (habitLogs.length === 0) return 0;

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Check if completed today, if not start from yesterday
  const today = checkDate.toISOString().split('T')[0];
  const completedToday = habitLogs.some(
    date => date.toISOString().split('T')[0] === today
  );

  if (!completedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days backwards
  while (streak < 365) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const completed = habitLogs.some(
      date => date.toISOString().split('T')[0] === dateStr
    );

    if (!completed) break;

    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * useLifeOS Hook
 *
 * Custom hook to access the LifeOS Smart Integration System
 * Provides type-safe access to all tasks, goals, focus sessions, and user profile data
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { tasks, goals, userProfile, completeTask, addFocusSession } = useLifeOS();
 *
 *   const handleTaskComplete = (taskId: string) => {
 *     completeTask(taskId); // Automatically awards XP and updates goal progress
 *   };
 *
 *   return (
 *     <div>
 *       <p>Level: {userProfile.level}</p>
 *       <p>XP: {userProfile.xp}</p>
 *       <p>Tasks: {tasks.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useContext } from "react";
import { LifeOSContext } from "@/context/LifeOSContext";

export function useLifeOS() {
  const context = useContext(LifeOSContext);

  if (context === undefined) {
    throw new Error("useLifeOS must be used within a LifeOSProvider");
  }

  return context;
}

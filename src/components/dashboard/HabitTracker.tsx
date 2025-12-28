"use client";

import { useState, useEffect } from "react";
import { Plus, Flame, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getHabits,
  createHabit,
  toggleHabit,
  deleteHabit,
  type Habit,
} from "@/lib/api/habits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Preset emojis for quick selection
const EMOJI_PRESETS = [
  "📚", "💧", "🏃", "🧘", "🥗", "💪", "🎯", "✍️",
  "🌅", "🛏️", "🧠", "❤️", "🎨", "🎵", "🌱", "☕",
];

/**
 * Minimalist Habit Tracker Component
 *
 * Features:
 * - Horizontal scrollable design (mobile-friendly)
 * - Circle UI with emoji
 * - Instant toggle with optimistic UI
 * - Streak counter with fire icon
 * - Simple add dialog
 */
export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("✅");

  // Load habits on mount
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setIsLoading(true);
    const data = await getHabits();
    setHabits(data);
    setIsLoading(false);
  };

  /**
   * Toggle habit completion (optimistic UI)
   */
  const handleToggle = async (habitId: string) => {
    // Optimistic update
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === habitId) {
          const wasCompleted = habit.completed_today;
          return {
            ...habit,
            completed_today: !wasCompleted,
            // Adjust streak optimistically
            streak: !wasCompleted
              ? (habit.streak || 0) + 1
              : Math.max(0, (habit.streak || 0) - 1),
          };
        }
        return habit;
      })
    );

    // Update backend
    const success = await toggleHabit(habitId);
    if (!success) {
      // Revert on failure
      loadHabits();
    }
  };

  /**
   * Add new habit
   */
  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) return;

    const newHabit = await createHabit(newHabitTitle.trim(), newHabitEmoji);
    if (newHabit) {
      setHabits((prev) => [...prev, newHabit]);
      setNewHabitTitle("");
      setNewHabitEmoji("✅");
      setIsAddDialogOpen(false);
    }
  };

  /**
   * Delete habit
   */
  const handleDeleteHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this habit? This will also delete all logs.")) return;

    // Optimistic delete
    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    const success = await deleteHabit(habitId);
    if (!success) {
      loadHabits();
    }
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Daily Habits</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Habit
        </Button>
      </div>

      {/* Horizontal Scrollable Row */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-4 min-w-min">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex flex-col items-center gap-1.5 group relative"
            >
              {/* Delete Button (appears on hover) */}
              <button
                onClick={(e) => handleDeleteHabit(habit.id, e)}
                className="absolute -top-1 -right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-0.5 shadow-md"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              {/* Habit Circle */}
              <button
                onClick={() => handleToggle(habit.id)}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 shadow-md hover:scale-105 active:scale-95",
                  habit.completed_today
                    ? "bg-gradient-to-br from-[#C97152] to-[#D4915E] text-white"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                )}
                title={habit.title}
              >
                {habit.emoji}
              </button>

              {/* Habit Title (truncated) */}
              <span className="text-xs font-medium text-center max-w-[80px] truncate">
                {habit.title}
              </span>

              {/* Streak Counter */}
              {habit.streak && habit.streak > 0 ? (
                <div className="flex items-center gap-0.5 text-orange-500">
                  <Flame className="h-3 w-3" />
                  <span className="text-xs font-bold">{habit.streak}</span>
                </div>
              ) : (
                <div className="h-4" /> // Spacer for alignment
              )}
            </div>
          ))}

          {/* Add New Button (always at the end) */}
          {habits.length === 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-[#C97152] hover:text-[#C97152] transition-colors"
              >
                <Plus className="h-6 w-6" />
              </button>
              <span className="text-xs text-muted-foreground">Add Habit</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Habit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
            <DialogDescription>
              Create a daily habit to track. Pick an emoji and give it a name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Emoji Picker */}
            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewHabitEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors",
                      newHabitEmoji === emoji
                        ? "bg-[#C97152] text-white"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* Custom emoji input */}
              <Input
                value={newHabitEmoji}
                onChange={(e) => setNewHabitEmoji(e.target.value.slice(0, 2))}
                placeholder="Or type your own..."
                className="text-center text-2xl h-12"
                maxLength={2}
              />
            </div>

            {/* Habit Name */}
            <div className="space-y-2">
              <Label htmlFor="habit-name">Habit Name</Label>
              <Input
                id="habit-name"
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="e.g., Read for 30 min"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddHabit();
                }}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddHabit}
              disabled={!newHabitTitle.trim()}
              className="bg-[#C97152] hover:bg-[#B8886B]"
            >
              Create Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

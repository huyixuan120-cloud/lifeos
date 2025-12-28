"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { FOCUS_MODE_THEMES, FocusMode } from "./theme";
import { cn } from "@/lib/utils";

interface ModeTabSelectorProps {
  /**
   * Current active mode
   */
  currentMode: FocusMode;

  /**
   * Whether the timer is currently running
   * When true, tabs are disabled to prevent mode switching
   */
  isTimerActive: boolean;

  /**
   * Callback when mode is changed
   */
  onModeChange: (mode: FocusMode) => void;
}

/**
 * ModeTabSelector - Pomofocus-style mode tabs
 *
 * Three-tab selector for Pomodoro/Short Break/Long Break modes.
 * Tabs are disabled during active timer to prevent accidental switching.
 *
 * @example
 * ```tsx
 * <ModeTabSelector
 *   currentMode="pomodoro"
 *   isTimerActive={false}
 *   onModeChange={(mode) => setTimerMode(mode)}
 * />
 * ```
 */
export function ModeTabSelector({
  currentMode,
  isTimerActive,
  onModeChange,
}: ModeTabSelectorProps) {
  const modes: FocusMode[] = ["pomodoro", "shortBreak", "longBreak"];

  return (
    <Tabs.Root
      value={currentMode}
      onValueChange={(value) => !isTimerActive && onModeChange(value as FocusMode)}
    >
      <Tabs.List className="flex gap-2 p-1 bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm">
        {modes.map((mode) => {
          const theme = FOCUS_MODE_THEMES[mode];
          const isActive = mode === currentMode;

          return (
            <Tabs.Trigger
              key={mode}
              value={mode}
              disabled={isTimerActive}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isActive
                  ? theme.tabActive
                  : cn(
                      theme.tabInactive,
                      isTimerActive && "opacity-50 cursor-not-allowed"
                    )
              )}
            >
              {theme.label}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}

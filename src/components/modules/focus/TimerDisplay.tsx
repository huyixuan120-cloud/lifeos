"use client";

import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOCUS_MODE_THEMES, FocusMode, formatTime } from "./theme";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  /**
   * Current timer mode
   */
  mode: FocusMode;

  /**
   * Time remaining in seconds
   */
  timeLeft: number;

  /**
   * Whether the timer is currently active
   */
  isActive: boolean;

  /**
   * Callback to start the timer
   */
  onStart: () => void;

  /**
   * Callback to pause the timer
   */
  onPause: () => void;
}

/**
 * TimerDisplay - Large central timer with start/pause control
 *
 * Displays the countdown timer in MM:SS format with dynamic styling
 * based on the current mode (Pomodoro/Short Break/Long Break).
 *
 * @example
 * ```tsx
 * <TimerDisplay
 *   mode="pomodoro"
 *   timeLeft={1500}
 *   isActive={false}
 *   onStart={() => startTimer()}
 *   onPause={() => pauseTimer()}
 * />
 * ```
 */
export function TimerDisplay({
  mode,
  timeLeft,
  isActive,
  onStart,
  onPause,
}: TimerDisplayProps) {
  const theme = FOCUS_MODE_THEMES[mode];

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Timer Display */}
      <div
        className={cn(
          "px-12 py-8 rounded-2xl shadow-lg transition-all duration-300",
          theme.container
        )}
      >
        <div
          className={cn(
            "font-mono text-8xl font-bold tracking-tight transition-colors",
            theme.text
          )}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Control Button */}
      <Button
        onClick={isActive ? onPause : onStart}
        size="lg"
        className={cn(
          "px-12 py-6 text-lg font-semibold rounded-xl transition-all shadow-md hover:shadow-lg",
          theme.button
        )}
      >
        {isActive ? (
          <>
            <Pause className="h-5 w-5 mr-2" />
            PAUSE
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            START
          </>
        )}
      </Button>
    </div>
  );
}

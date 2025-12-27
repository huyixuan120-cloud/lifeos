"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Trophy, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * FocusView - Pomodoro Timer with "Zen Growth" Theme
 *
 * Inspired by the Forest App - grow a plant as you focus.
 * As time progresses, the plant evolves from seed to tree.
 *
 * @example
 * ```tsx
 * <FocusView />
 * ```
 */
export function FocusView() {
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [customTask, setCustomTask] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate progress percentage (0 to 100)
  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get plant icon based on progress
  const getPlantIcon = (): { emoji: string; label: string } => {
    if (progress >= 100) return { emoji: "🍎", label: "Fruitful Success!" };
    if (progress >= 80) return { emoji: "🌳", label: "Mighty Tree" };
    if (progress >= 40) return { emoji: "🌿", label: "Growing Sapling" };
    if (progress >= 10) return { emoji: "🌱", label: "Tender Sprout" };
    return { emoji: "🌰", label: "Tiny Seed" };
  };

  const plant = getPlantIcon();

  // Timer countdown logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed!
            handleCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  // Handle timer completion
  const handleCompletion = () => {
    setIsActive(false);
    setSessionCount((prev) => prev + 1);
    setShowCelebration(true);

    // TODO: Play notification sound
    // const audio = new Audio('/sounds/complete.mp3');
    // audio.play();

    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  // Control handlers
  const handlePlayPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
  };

  const handleDurationChange = (minutes: number) => {
    const seconds = minutes * 60;
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setIsActive(false);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
            <div className="text-9xl animate-bounce">🎉</div>
            <div className="text-4xl font-bold text-green-700 dark:text-green-300">
              Task Completed!
            </div>
            <div className="text-xl text-green-600 dark:text-green-400">
              Your tree has bloomed! 🌳✨
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Top Bar - Session Counter */}
        <div className="p-6 flex items-center justify-between border-b border-green-200/50 dark:border-green-800/50 bg-white/30 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm text-muted-foreground">Today's Harvest</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {sessionCount} Tree{sessionCount !== 1 ? "s" : ""} 🌲
              </p>
            </div>
          </div>

          {/* Quick Duration Selector */}
          <div className="flex gap-2">
            <Button
              variant={initialTime === 15 * 60 ? "default" : "outline"}
              size="sm"
              onClick={() => handleDurationChange(15)}
              disabled={isActive}
              className={cn(
                initialTime === 15 * 60 && "bg-green-600 hover:bg-green-700"
              )}
            >
              15m
            </Button>
            <Button
              variant={initialTime === 25 * 60 ? "default" : "outline"}
              size="sm"
              onClick={() => handleDurationChange(25)}
              disabled={isActive}
              className={cn(
                initialTime === 25 * 60 && "bg-green-600 hover:bg-green-700"
              )}
            >
              25m
            </Button>
            <Button
              variant={initialTime === 45 * 60 ? "default" : "outline"}
              size="sm"
              onClick={() => handleDurationChange(45)}
              disabled={isActive}
              className={cn(
                initialTime === 45 * 60 && "bg-green-600 hover:bg-green-700"
              )}
            >
              45m
            </Button>
          </div>
        </div>

        {/* Center Area - The Growing Plant */}
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8">
          {/* Progress Ring Background */}
          <div className="relative">
            {/* Circular Progress Indicator */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-green-200 dark:text-green-900"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                className="text-green-600 dark:text-green-400 transition-all duration-1000 ease-out"
              />
            </svg>

            {/* The Growing Plant Icon */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div
                className={cn(
                  "text-9xl transition-all duration-500",
                  isActive && "animate-breathing"
                )}
              >
                {plant.emoji}
              </div>
            </div>
          </div>

          {/* Plant Status Label */}
          <div className="text-center space-y-2">
            <p className="text-xl font-medium text-green-700 dark:text-green-300">
              {plant.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {progress.toFixed(0)}% grown
            </p>
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="font-mono text-7xl font-bold text-green-800 dark:text-green-200 tabular-nums">
              {formatTime(timeLeft)}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {/* Reset Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleReset}
                className="h-14 px-6 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              {/* Play/Pause Button */}
              <Button
                size="lg"
                onClick={handlePlayPause}
                className="h-16 px-10 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isActive ? (
                  <>
                    <Pause className="h-6 w-6 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 mr-2" />
                    {timeLeft === initialTime ? "Start" : "Resume"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Area - Task Selector */}
        <div className="p-6 border-t border-green-200/50 dark:border-green-800/50 bg-white/30 dark:bg-black/20">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Sprout className="h-5 w-5" />
              <Label className="text-lg font-medium">What are you growing for?</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Selector */}
              <Select value={selectedTask || ""} onValueChange={setSelectedTask}>
                <SelectTrigger className="h-12 border-green-300 dark:border-green-700 bg-white dark:bg-green-950">
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">📚 Study Session</SelectItem>
                  <SelectItem value="work">💼 Deep Work</SelectItem>
                  <SelectItem value="creative">🎨 Creative Project</SelectItem>
                  <SelectItem value="reading">📖 Reading</SelectItem>
                  <SelectItem value="meditation">🧘 Meditation</SelectItem>
                  <SelectItem value="custom">✏️ Custom Task</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Task Input (shown when "custom" is selected) */}
              {selectedTask === "custom" && (
                <Input
                  placeholder="Enter your custom task..."
                  value={customTask}
                  onChange={(e) => setCustomTask(e.target.value)}
                  className="h-12 border-green-300 dark:border-green-700 bg-white dark:bg-green-950"
                />
              )}
            </div>

            {/* Task Display */}
            {selectedTask && selectedTask !== "custom" && (
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Growing focus for:{" "}
                  <span className="font-semibold">
                    {selectedTask === "study" && "📚 Study Session"}
                    {selectedTask === "work" && "💼 Deep Work"}
                    {selectedTask === "creative" && "🎨 Creative Project"}
                    {selectedTask === "reading" && "📖 Reading"}
                    {selectedTask === "meditation" && "🧘 Meditation"}
                  </span>
                </p>
              </div>
            )}

            {selectedTask === "custom" && customTask && (
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Growing focus for:{" "}
                  <span className="font-semibold">✏️ {customTask}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animation for breathing effect */}
      <style jsx>{`
        @keyframes breathing {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-breathing {
          animation: breathing 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

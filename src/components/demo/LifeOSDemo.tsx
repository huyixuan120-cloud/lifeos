"use client";

import { useLifeOS } from "@/hooks/useLifeOS";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  CheckCircle,
  Target,
  Zap,
  Clock,
  TrendingUp,
} from "lucide-react";

/**
 * LifeOS Demo Component
 *
 * Demonstrates the Smart Integration System in action
 * Shows how completing tasks awards XP, levels up the user, and updates goal progress
 */
export function LifeOSDemo() {
  const {
    tasks,
    goals,
    userProfile,
    completeTask,
    addFocusSession,
    linkTaskToGoal,
  } = useLifeOS();

  // Get incomplete tasks
  const incompleteTasks = tasks.filter((t) => !t.is_completed);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🧠 Smart Integration System Demo</h1>
        <p className="text-muted-foreground">
          Complete tasks to earn XP, level up, and watch your goals progress automatically!
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Player Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{userProfile.name}</p>
              <Badge className="bg-purple-600 text-white mt-1">
                Level {userProfile.level}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">
                {userProfile.xp.toLocaleString("en-US")} XP
              </p>
              <p className="text-sm text-muted-foreground">
                {userProfile.tasksCompleted} tasks completed
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Focus Minutes</span>
              <span className="font-semibold">{userProfile.focusMinutes}m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Streak</span>
              <span className="font-semibold">{userProfile.streak} days 🔥</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Goals ({goals.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.completedTasks} / {goal.totalTasks} tasks completed
                    </p>
                  </div>
                  <Badge
                    variant={goal.status === "completed" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {goal.progress}%
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Active Tasks ({incompleteTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incompleteTasks.slice(0, 5).map((task) => {
              const linkedGoal = goals.find((g) => g.id === task.goalId);

              return (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {task.effort || "medium"} effort
                      </Badge>
                      {linkedGoal && (
                        <Badge variant="secondary" className="text-xs">
                          🎯 {linkedGoal.title}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => completeTask(task.id)}
                    className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            {incompleteTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>All tasks completed! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => addFocusSession(25)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Clock className="h-4 w-4 mr-2" />
              +25min Focus Session (+250 XP)
            </Button>
            <Button
              onClick={() => addFocusSession(45)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Clock className="h-4 w-4 mr-2" />
              +45min Deep Work (+450 XP)
            </Button>
            <Button
              onClick={() => {
                const task = incompleteTasks[0];
                if (task) completeTask(task.id);
              }}
              disabled={incompleteTasks.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Complete Next Task
            </Button>
          </div>

          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <p className="text-sm font-semibold mb-1">💡 How It Works:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Complete tasks to earn XP (50-200+ XP based on effort/priority)</li>
              <li>• Focus sessions award 10 XP per minute</li>
              <li>• Level up automatically as you earn XP</li>
              <li>• Tasks linked to goals update goal progress automatically</li>
              <li>• Check the console for XP rewards and level-up notifications!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{userProfile.level}</p>
            <p className="text-xs text-muted-foreground">Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {userProfile.tasksCompleted}
            </p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {userProfile.focusMinutes}m
            </p>
            <p className="text-xs text-muted-foreground">Focus Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {userProfile.streak}
            </p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

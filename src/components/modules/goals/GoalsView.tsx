"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  AlertCircle,
  Trophy,
  Calendar,
  Zap,
  Heart,
  Briefcase,
  BookOpen,
  Dumbbell,
  DollarSign,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLifeOS } from "@/hooks/useLifeOS";
import type { GoalCategory, GoalStatus, Goal } from "@/types";

const categoryConfig: Record<GoalCategory, { icon: React.ElementType; label: string; color: string }> = {
  health: { icon: Heart, label: "Health", color: "text-red-600 bg-red-100 dark:bg-red-950/30" },
  business: { icon: Briefcase, label: "Business", color: "text-blue-600 bg-blue-100 dark:bg-blue-950/30" },
  learning: { icon: BookOpen, label: "Learning", color: "text-purple-600 bg-purple-100 dark:bg-purple-950/30" },
  finance: { icon: DollarSign, label: "Finance", color: "text-green-600 bg-green-100 dark:bg-green-950/30" },
  personal: { icon: Zap, label: "Personal", color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30" },
  social: { icon: Users, label: "Social", color: "text-pink-600 bg-pink-100 dark:bg-pink-950/30" },
};

const statusConfig: Record<GoalStatus, { label: string; color: string; icon: React.ElementType }> = {
  "on-track": { label: "On Track", color: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400", icon: TrendingUp },
  "behind": { label: "Behind", color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400", icon: AlertCircle },
  "completed": { label: "Completed", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400", icon: Trophy },
};

export function GoalsView() {
  // Get real goals data from global context
  const { goals, addGoal } = useLifeOS();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<GoalCategory>("personal");
  const [formWhy, setFormWhy] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");

  // Year progress state (initialized to avoid hydration mismatch)
  const [yearProgress, setYearProgress] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);

  // Calculate year progress on client side only
  useEffect(() => {
    const calculateYearProgress = () => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      const totalMs = endOfYear.getTime() - startOfYear.getTime();
      const elapsedMs = now.getTime() - startOfYear.getTime();
      const progress = (elapsedMs / totalMs) * 100;
      const daysRemaining = Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setYearProgress(Math.min(100, Math.max(0, progress)));
      setDaysLeft(daysRemaining);
    };

    calculateYearProgress();
  }, []);

  // Handle add goal
  const handleAddGoal = () => {
    if (!formTitle.trim()) return;

    // Use context's addGoal function
    addGoal({
      title: formTitle.trim(),
      category: formCategory,
      status: "on-track",
      why: formWhy.trim(),
      targetDate: formTargetDate || null,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  // Handle edit goal (view details only - progress is auto-calculated)
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormTitle("");
    setFormCategory("personal");
    setFormWhy("");
    setFormTargetDate("");
  };

  // Get progress color
  const getProgressColor = (progress: number, status: GoalStatus) => {
    if (status === "completed") return "bg-yellow-600 dark:bg-yellow-500";
    if (status === "behind") return "bg-red-600 dark:bg-red-500";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-8 w-8 text-purple-600" />
              Strategic Vision
            </h1>
            <p className="text-muted-foreground mt-1">
              Long-term goals that guide your daily tasks
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>
                  Define a strategic goal that aligns with your vision
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Launch my startup"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formCategory}
                    onValueChange={(value) => setFormCategory(value as GoalCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="why">Why? (Your Motivation)</Label>
                  <Textarea
                    id="why"
                    placeholder="What drives you to achieve this goal?"
                    value={formWhy}
                    onChange={(e) => setFormWhy(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="target-date">Target Date (Optional)</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGoal} disabled={!formTitle.trim()}>
                  Create Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Countdown Widget */}
        <Card className="border-purple-200 dark:border-purple-900/30 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Time Remaining in 2025
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {daysLeft} days left
                  </span>{" "}
                  to make it count
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(yearProgress)}%
                </div>
                <div className="text-xs text-muted-foreground">Year Progress</div>
              </div>
            </div>

            {/* Year Progress Bar */}
            <div className="space-y-2">
              <Progress value={yearProgress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Jan 1, 2025</span>
                <span>Dec 31, 2025</span>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="mt-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-purple-100 dark:border-purple-900/30">
              <p className="text-sm italic text-center text-muted-foreground">
                "The future belongs to those who believe in the beauty of their dreams."
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const CategoryIcon = categoryConfig[goal.category].icon;
            const StatusIcon = statusConfig[goal.status].icon;

            return (
              <Card
                key={goal.id}
                className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow cursor-pointer rounded-xl"
                onClick={() => handleEditGoal(goal)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5" />
                        {goal.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cn("text-xs", categoryConfig[goal.category].color)}>
                          {categoryConfig[goal.category].label}
                        </Badge>
                        <Badge className={cn("text-xs flex items-center gap-1", statusConfig[goal.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[goal.status].label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {goal.progress}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {goal.completedTasks} / {goal.totalTasks} tasks
                      </span>
                      <span>{goal.progress}% complete</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          getProgressColor(goal.progress, goal.status)
                        )}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Why */}
                  {goal.why && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Why I'm doing this:
                      </p>
                      <p className="text-sm italic">{goal.why}</p>
                    </div>
                  )}

                  {/* Target Date */}
                  {goal.targetDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Target: {new Date(goal.targetDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View Goal Details Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Goal Details</DialogTitle>
              <DialogDescription>
                Progress for "{editingGoal?.title}" is automatically calculated from linked tasks
              </DialogDescription>
            </DialogHeader>
            {editingGoal && (
              <div className="space-y-6">
                {/* Progress Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900/30 text-center">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {editingGoal.progress}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Progress</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/30 text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {editingGoal.completedTasks}/{editingGoal.totalTasks}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Tasks Done</p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        getProgressColor(editingGoal.progress, editingGoal.status)
                      )}
                      style={{ width: `${editingGoal.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Link tasks to this goal to update progress automatically
                  </p>
                </div>

                {/* Category & Status */}
                <div className="flex gap-2">
                  <Badge className={cn("flex items-center gap-1", categoryConfig[editingGoal.category].color)}>
                    {React.createElement(categoryConfig[editingGoal.category].icon, { className: "h-3 w-3" })}
                    {categoryConfig[editingGoal.category].label}
                  </Badge>
                  <Badge className={cn("flex items-center gap-1", statusConfig[editingGoal.status].color)}>
                    {React.createElement(statusConfig[editingGoal.status].icon, { className: "h-3 w-3" })}
                    {statusConfig[editingGoal.status].label}
                  </Badge>
                </div>

                {/* Motivation Reminder */}
                {editingGoal.why && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900/30">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
                      Remember why:
                    </p>
                    <p className="text-sm italic">{editingGoal.why}</p>
                  </div>
                )}

                {/* Target Date */}
                {editingGoal.targetDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Target: {new Date(editingGoal.targetDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingGoal(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

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
  Pencil,
  Trash2,
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
import { useGoals } from "@/hooks/use-goals";
import type { GoalCategory, GoalStatus, Goal } from "@/types";

const categoryConfig: Record<GoalCategory, { icon: React.ElementType; label: string; color: string }> = {
  health: { icon: Heart, label: "Health", color: "text-[#C97152] bg-[#F5EFE7] dark:bg-[#4A423A]" },
  business: { icon: Briefcase, label: "Business", color: "text-[#A86F4C] bg-[#F9F6F1] dark:bg-[#3E3530]" },
  learning: { icon: BookOpen, label: "Learning", color: "text-[#B8886B] bg-[#F5EFE7] dark:bg-[#4A423A]" },
  finance: { icon: DollarSign, label: "Finance", color: "text-[#8B7355] bg-[#F9F6F1] dark:bg-[#3E3530]" },
  personal: { icon: Zap, label: "Personal", color: "text-[#D4915E] bg-[#F5EFE7] dark:bg-[#4A423A]" },
  social: { icon: Users, label: "Social", color: "text-[#C97152] bg-[#F9F6F1] dark:bg-[#3E3530]" },
};

const statusConfig: Record<GoalStatus, { label: string; color: string; icon: React.ElementType }> = {
  "on-track": { label: "On Track", color: "bg-[#E8F5E9] text-[#6B8E6F] dark:bg-[#3E4A3F] dark:text-[#A5C9A8]", icon: TrendingUp },
  "behind": { label: "Behind", color: "bg-[#FCE8E6] text-[#C97152] dark:bg-[#4A3530] dark:text-[#E5B299]", icon: AlertCircle },
  "completed": { label: "Completed", color: "bg-[#F9F6F1] text-[#8B7E74] dark:bg-[#3E3530] dark:text-[#B8AFA6]", icon: Trophy },
};

export function GoalsView() {
  // Get real goals data from Supabase (with RLS)
  const { goals, isLoading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<GoalCategory>("personal");
  const [formWhy, setFormWhy] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");

  // Handle add/update goal
  const handleSaveGoal = async () => {
    if (!formTitle.trim()) return;

    try {
      if (dialogMode === "edit" && editingGoal) {
        // Update existing goal
        await updateGoal({
          id: editingGoal.id,
          title: formTitle.trim(),
          category: formCategory,
          why: formWhy.trim(),
          targetDate: formTargetDate || null,
        });
      } else {
        // Create new goal
        await addGoal({
          title: formTitle.trim(),
          category: formCategory,
          why: formWhy.trim(),
          targetDate: formTargetDate || null,
        });
      }

      resetForm();
      setIsAddDialogOpen(false);
      setEditingGoal(null);
    } catch (error) {
      console.error("Failed to save goal:", error);
    }
  };

  // Open dialog in edit mode
  const handleOpenEditDialog = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setEditingGoal(goal);
    setDialogMode("edit");
    setFormTitle(goal.title);
    setFormCategory(goal.category);
    setFormWhy(goal.why);
    setFormTargetDate(goal.targetDate || "");
    setIsAddDialogOpen(true);
  };

  // Open dialog in create mode
  const handleOpenCreateDialog = () => {
    setDialogMode("create");
    resetForm();
    setEditingGoal(null);
    setIsAddDialogOpen(true);
  };

  // Handle delete goal
  const handleDeleteGoal = async (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm("Are you sure you want to delete this goal? This action cannot be undone.")) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error("Failed to delete goal:", error);
      }
    }
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
    if (status === "completed") return "bg-[#8B7E74] dark:bg-[#B8AFA6]";
    if (status === "behind") return "bg-[#C97152] dark:bg-[#E5B299]";
    return "bg-[#6B8E6F] dark:bg-[#A5C9A8]";
  };

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-[#FAF9F7] via-[#FEFDFB] to-[#F5EFE7] dark:from-[#2A2420] dark:via-[#2A2420] dark:to-[#342E28]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#C97152] to-[#D4915E] bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-8 w-8 text-[#C97152]" />
              Strategic Vision
            </h1>
            <p className="text-muted-foreground mt-1">
              Long-term goals that guide your daily tasks
            </p>
          </div>

          <Button
            onClick={handleOpenCreateDialog}
            className="bg-[#C97152] hover:bg-[#B8886B] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Add/Edit Goal Dialog - UNIFIED for Create & Edit */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "edit" ? "Edit Goal" : "Create New Goal"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "edit"
                  ? "Update your goal details below"
                  : "Define a strategic goal that aligns with your vision"}
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
              <Button onClick={handleSaveGoal} disabled={!formTitle.trim()}>
                {dialogMode === "edit" ? "Update Goal" : "Create Goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const CategoryIcon = categoryConfig[goal.category].icon;
            const StatusIcon = statusConfig[goal.status].icon;

            return (
              <Card
                key={goal.id}
                className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow rounded-xl"
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
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-[#C97152] dark:text-[#D4915E]">
                        {goal.progress}%
                      </div>
                      {/* Edit/Delete Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-[#C97152]"
                          onClick={(e) => handleOpenEditDialog(goal, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={(e) => handleDeleteGoal(goal.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      </div>
    </div>
  );
}

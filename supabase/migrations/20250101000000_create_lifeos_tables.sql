-- =====================================================
-- LIFEOS DATABASE SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- =====================================================
-- This migration creates all necessary tables for LifeOS
-- with proper user isolation using RLS policies.
--
-- Tables:
-- 1. tasks - User tasks with Eisenhower Matrix properties
-- 2. goals - User strategic goals
-- 3. pomodoro_settings - User timer preferences
-- 4. focus_sessions - User focus/pomodoro session history
--
-- PRIVACY: All tables enforce RLS so users can ONLY access their own data.
-- =====================================================

-- =====================================================
-- 1. TASKS TABLE (Updated Schema)
-- =====================================================

-- Drop existing table if needed (for clean migration)
DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE public.tasks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association (required for RLS)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core task fields
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Priority and categorization
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Eisenhower Matrix properties
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,

  -- Optional metadata
  due_date TIMESTAMP WITH TIME ZONE,

  -- Timestamps (auto-managed)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_is_completed ON public.tasks(is_completed);

-- =====================================================
-- 2. GOALS TABLE
-- =====================================================

CREATE TABLE public.goals (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association (required for RLS)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal details
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('health', 'business', 'learning', 'finance', 'personal', 'social')),
  why TEXT, -- Motivation/reason for this goal

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'on-track' CHECK (status IN ('on-track', 'behind', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Task association (calculated fields)
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,

  -- Optional deadline
  target_date DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can view their own goals"
  ON public.goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_created_at ON public.goals(created_at DESC);
CREATE INDEX idx_goals_category ON public.goals(category);

-- =====================================================
-- 3. POMODORO SETTINGS TABLE
-- =====================================================

CREATE TABLE public.pomodoro_settings (
  -- Primary key is user_id (one settings record per user)
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timer durations (in minutes)
  pomodoro_duration INTEGER NOT NULL DEFAULT 25 CHECK (pomodoro_duration >= 1 AND pomodoro_duration <= 90),
  short_break_duration INTEGER NOT NULL DEFAULT 5 CHECK (short_break_duration >= 1 AND short_break_duration <= 30),
  long_break_duration INTEGER NOT NULL DEFAULT 15 CHECK (long_break_duration >= 1 AND long_break_duration <= 60),

  -- Auto-start preferences
  auto_start_breaks BOOLEAN NOT NULL DEFAULT FALSE,
  auto_start_pomodoros BOOLEAN NOT NULL DEFAULT FALSE,

  -- Sound settings
  volume INTEGER NOT NULL DEFAULT 50 CHECK (volume >= 0 AND volume <= 100),
  alarm_sound TEXT NOT NULL DEFAULT 'bell' CHECK (alarm_sound IN ('bell', 'digital', 'wood', 'bird')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on pomodoro_settings table
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pomodoro_settings
CREATE POLICY "Users can view their own settings"
  ON public.pomodoro_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.pomodoro_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.pomodoro_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON public.pomodoro_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. FOCUS SESSIONS TABLE (History)
-- =====================================================

CREATE TABLE public.focus_sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association (required for RLS)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session details
  mode TEXT NOT NULL CHECK (mode IN ('pomodoro', 'shortBreak', 'longBreak')),
  duration_minutes INTEGER NOT NULL,

  -- Optional task association
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  -- Session timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on focus_sessions table
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for focus_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.focus_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.focus_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.focus_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.focus_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_started_at ON public.focus_sessions(started_at DESC);
CREATE INDEX idx_focus_sessions_task_id ON public.focus_sessions(task_id);

-- =====================================================
-- 5. AUTOMATIC UPDATED_AT TRIGGER
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tasks table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to goals table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to pomodoro_settings table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.pomodoro_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All tables created with RLS enabled and policies applied.
-- Users can ONLY access their own data.
-- Auto-updated timestamps configured.
-- =====================================================

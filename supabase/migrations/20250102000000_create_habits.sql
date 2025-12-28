-- =============================================
-- LIFEOS HABIT TRACKER
-- =============================================
-- Description: Minimalist daily habit tracking system
-- Features:
--   - Track daily habits with emoji
--   - Calculate streaks
--   - Log completions per day
--   - RLS for user privacy
-- =============================================

-- =============================================================================
-- 1. HABITS TABLE
-- =============================================================================
-- Stores user's habits (e.g., "Read", "Drink Water")

CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '✅',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);

-- =============================================================================
-- 2. HABIT LOGS TABLE
-- =============================================================================
-- Stores daily completions (one row per habit per day)

CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: prevent double logging same habit on same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_logs_unique
ON public.habit_logs(habit_id, completed_at);

-- Index for fast habit lookups
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at ON public.habit_logs(completed_at);

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- ===== HABITS POLICIES =====

-- Policy: Users can view their own habits
CREATE POLICY "Users can view their own habits"
ON public.habits
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own habits
CREATE POLICY "Users can create their own habits"
ON public.habits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own habits
CREATE POLICY "Users can update their own habits"
ON public.habits
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own habits
CREATE POLICY "Users can delete their own habits"
ON public.habits
FOR DELETE
USING (auth.uid() = user_id);

-- ===== HABIT LOGS POLICIES =====

-- Policy: Users can view logs for their habits
CREATE POLICY "Users can view their own habit logs"
ON public.habit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.habits
        WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
);

-- Policy: Users can create logs for their habits
CREATE POLICY "Users can create logs for their own habits"
ON public.habit_logs
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.habits
        WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
);

-- Policy: Users can delete logs for their habits
CREATE POLICY "Users can delete their own habit logs"
ON public.habit_logs
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.habits
        WHERE habits.id = habit_logs.habit_id
        AND habits.user_id = auth.uid()
    )
);

-- =============================================================================
-- 4. HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate streak for a habit
-- Returns number of consecutive days (ending today or yesterday)
CREATE OR REPLACE FUNCTION public.calculate_habit_streak(p_habit_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak INTEGER := 0;
    v_check_date DATE;
    v_exists BOOLEAN;
BEGIN
    -- Start from today
    v_check_date := CURRENT_DATE;

    -- Check if completed today, if not start from yesterday
    SELECT EXISTS(
        SELECT 1 FROM public.habit_logs
        WHERE habit_id = p_habit_id
        AND completed_at = CURRENT_DATE
    ) INTO v_exists;

    IF NOT v_exists THEN
        v_check_date := CURRENT_DATE - INTERVAL '1 day';
    END IF;

    -- Count consecutive days backwards
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM public.habit_logs
            WHERE habit_id = p_habit_id
            AND completed_at = v_check_date::DATE
        ) INTO v_exists;

        IF NOT v_exists THEN
            EXIT;
        END IF;

        v_streak := v_streak + 1;
        v_check_date := v_check_date - INTERVAL '1 day';

        -- Safety limit: max 365 days
        IF v_streak >= 365 THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_streak;
END;
$$;

-- =============================================================================
-- 5. AUTOMATIC UPDATED_AT TRIGGER
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for habits table
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Run this file in Supabase SQL Editor to create the Habit Tracker tables

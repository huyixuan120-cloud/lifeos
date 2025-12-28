-- ============================================================================
-- GOALS SYSTEM MIGRATION
-- ============================================================================
-- This migration adds the Goals system to LifeOS:
-- 1. Creates the 'goals' table
-- 2. Adds 'goal_id' foreign key to 'tasks' table
-- 3. Sets up RLS policies for multi-user support
-- ============================================================================

-- ============================================================================
-- 1. CREATE GOALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goals (
    -- Primary key: UUID v4 automatically generated
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Goal core fields
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('health', 'business', 'learning', 'finance', 'personal', 'social')),
    status TEXT DEFAULT 'on-track' NOT NULL CHECK (status IN ('on-track', 'behind', 'completed', 'archived')),
    why TEXT DEFAULT '' NOT NULL,
    target_date DATE,

    -- Progress tracking
    progress INTEGER DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),
    total_tasks INTEGER DEFAULT 0 NOT NULL,
    completed_tasks INTEGER DEFAULT 0 NOT NULL,

    -- User ownership (for multi-user support)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Timestamps (automatically managed)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CREATE INDEXES FOR GOALS
-- ============================================================================

-- Index on category for filtering
CREATE INDEX IF NOT EXISTS idx_goals_category ON public.goals(category);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- Index on user_id for RLS queries
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- Index on target_date for deadline queries
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);

-- ============================================================================
-- 3. ADD GOAL_ID TO TASKS TABLE
-- ============================================================================

-- Add goal_id column to tasks table (if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tasks'
        AND column_name = 'goal_id'
    ) THEN
        ALTER TABLE public.tasks
        ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

        -- Create index for goal_id lookups
        CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);

        RAISE NOTICE 'Column goal_id added to tasks table';
    ELSE
        RAISE NOTICE 'Column goal_id already exists in tasks table';
    END IF;
END $$;

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS) FOR GOALS
-- ============================================================================

-- Enable RLS on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES FOR GOALS
-- ============================================================================

-- Policy: Users can view their own goals
CREATE POLICY IF NOT EXISTS "Users can view own goals"
    ON public.goals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own goals
CREATE POLICY IF NOT EXISTS "Users can insert own goals"
    ON public.goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own goals
CREATE POLICY IF NOT EXISTS "Users can update own goals"
    ON public.goals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own goals
CREATE POLICY IF NOT EXISTS "Users can delete own goals"
    ON public.goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to goals table
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this script in the Supabase SQL Editor to enable the Goals system.
-- After running, you can create goals and link tasks to them.
-- ============================================================================

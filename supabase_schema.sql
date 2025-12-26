-- ============================================================================
-- LifeOS Calendar Events Table Schema
-- ============================================================================
-- This SQL script creates the events table with Row Level Security (RLS)
--
-- To execute this schema:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
--
-- Alternatively, use the Supabase CLI:
-- supabase db push
-- ============================================================================

-- Drop existing table if you need to recreate (WARNING: This deletes all data!)
-- Uncomment the following line only if you want to start fresh:
-- DROP TABLE IF EXISTS public.events CASCADE;

-- ============================================================================
-- Create Events Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    -- Primary key: UUID v4 automatically generated
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Event core fields
    title VARCHAR(255) NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false NOT NULL,

    -- Optional fields
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'cancelled', 'completed')),

    -- Styling fields (for FullCalendar visualization)
    background_color VARCHAR(7), -- Hex color like #3b82f6
    border_color VARCHAR(7),     -- Hex color like #3b82f6
    text_color VARCHAR(7),       -- Hex color like #ffffff

    -- User ownership (for future multi-user support)
    -- Set to NULL for now, will be populated when authentication is implemented
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Timestamps (automatically managed)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

-- Index on start time for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start);

-- Index on end time for date range queries
CREATE INDEX IF NOT EXISTS idx_events_end ON public.events("end");

-- Index on user_id for multi-user queries (when auth is implemented)
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- Index on status for filtering active/cancelled events
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- Composite index for common query pattern: user + date range
CREATE INDEX IF NOT EXISTS idx_events_user_date ON public.events(user_id, start, "end");

-- ============================================================================
-- Create Updated_at Trigger
-- ============================================================================
-- This trigger automatically updates the updated_at timestamp on any UPDATE

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.events;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy 1: Allow public read access (for MVP/development)
-- In production, you may want to restrict this to authenticated users only
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to events"
    ON public.events
    FOR SELECT
    USING (true);

-- Policy 2: Allow public insert access (for MVP/development)
-- In production, restrict to authenticated users:
-- USING (auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "Allow public insert access to events" ON public.events;
CREATE POLICY "Allow public insert access to events"
    ON public.events
    FOR INSERT
    WITH CHECK (true);

-- Policy 3: Allow public update access (for MVP/development)
-- In production, restrict to event owner:
-- USING (auth.uid() = user_id)
DROP POLICY IF EXISTS "Allow public update access to events" ON public.events;
CREATE POLICY "Allow public update access to events"
    ON public.events
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow public delete access (for MVP/development)
-- In production, restrict to event owner:
-- USING (auth.uid() = user_id)
DROP POLICY IF EXISTS "Allow public delete access to events" ON public.events;
CREATE POLICY "Allow public delete access to events"
    ON public.events
    FOR DELETE
    USING (true);

-- ============================================================================
-- PRODUCTION-READY RLS POLICIES (Commented out for now)
-- ============================================================================
-- Once authentication is implemented, replace the above policies with these:

/*
-- Policy 1: Users can read their own events
DROP POLICY IF EXISTS "Users can read own events" ON public.events;
CREATE POLICY "Users can read own events"
    ON public.events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can create events
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events"
    ON public.events
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Policy 3: Users can update their own events
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
CREATE POLICY "Users can update own events"
    ON public.events
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own events
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
CREATE POLICY "Users can delete own events"
    ON public.events
    FOR DELETE
    USING (auth.uid() = user_id);
*/

-- ============================================================================
-- Insert Sample Data (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample events:

/*
INSERT INTO public.events (title, start, "end", all_day, description, status, background_color, border_color, text_color)
VALUES
    (
        'Deep Work Session',
        NOW() + INTERVAL '1 hour',
        NOW() + INTERVAL '3 hours',
        false,
        'Focus on the LifeOS calendar implementation',
        'active',
        '#3b82f6',
        '#3b82f6',
        '#ffffff'
    ),
    (
        'Team Standup',
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day' + INTERVAL '30 minutes',
        false,
        'Daily team sync',
        'active',
        '#8b5cf6',
        '#8b5cf6',
        '#ffffff'
    ),
    (
        'Project Deadline',
        (CURRENT_DATE + INTERVAL '7 days')::TIMESTAMPTZ,
        (CURRENT_DATE + INTERVAL '7 days' + INTERVAL '1 day')::TIMESTAMPTZ,
        true,
        'Submit final deliverables',
        'active',
        '#f59e0b',
        '#f59e0b',
        '#ffffff'
    );
*/

-- ============================================================================
-- Verification Queries (Optional - run separately to verify setup)
-- ============================================================================

-- Check table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'events' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'events' AND schemaname = 'public';

-- Check policies
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'events' AND schemaname = 'public';

-- ============================================================================
-- Schema Complete!
-- ============================================================================
-- Next steps:
-- 1. Add your Supabase credentials to .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=your_project_url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
-- 2. Test the connection from your Next.js app
-- 3. Implement CRUD operations in your calendar component
-- ============================================================================


-- ============================================================================
-- ============================================================================
-- PHASE 2: TASKS MODULE
-- ============================================================================
-- ============================================================================

-- ============================================================================
-- Create Tasks Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    -- Primary key: UUID v4 automatically generated
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Task core fields
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMPTZ,

    -- User ownership (for future multi-user support)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Timestamps (automatically managed)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Create Indexes for Tasks Performance
-- ============================================================================

-- Index on completion status for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);

-- Index on priority for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Index on due_date for deadline queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Index on user_id for multi-user queries (when auth is implemented)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- Composite index for common query pattern: user + completion status
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON public.tasks(user_id, is_completed);

-- ============================================================================
-- Create Updated_at Trigger for Tasks
-- ============================================================================

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Enable Row Level Security for Tasks
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for Tasks (Public access for MVP)
-- ============================================================================

-- Policy 1: Allow public read access (for MVP/development)
DROP POLICY IF EXISTS "Allow public read access to tasks" ON public.tasks;
CREATE POLICY "Allow public read access to tasks"
    ON public.tasks
    FOR SELECT
    USING (true);

-- Policy 2: Allow public insert access (for MVP/development)
DROP POLICY IF EXISTS "Allow public insert access to tasks" ON public.tasks;
CREATE POLICY "Allow public insert access to tasks"
    ON public.tasks
    FOR INSERT
    WITH CHECK (true);

-- Policy 3: Allow public update access (for MVP/development)
DROP POLICY IF EXISTS "Allow public update access to tasks" ON public.tasks;
CREATE POLICY "Allow public update access to tasks"
    ON public.tasks
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow public delete access (for MVP/development)
DROP POLICY IF EXISTS "Allow public delete access to tasks" ON public.tasks;
CREATE POLICY "Allow public delete access to tasks"
    ON public.tasks
    FOR DELETE
    USING (true);

-- ============================================================================
-- PRODUCTION-READY RLS POLICIES FOR TASKS (Commented out for now)
-- ============================================================================
-- Once authentication is implemented, replace the above policies with these:

/*
-- Policy 1: Users can read their own tasks
DROP POLICY IF EXISTS "Users can read own tasks" ON public.tasks;
CREATE POLICY "Users can read own tasks"
    ON public.tasks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can create tasks
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
CREATE POLICY "Authenticated users can create tasks"
    ON public.tasks
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Policy 3: Users can update their own tasks
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks"
    ON public.tasks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own tasks
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks"
    ON public.tasks
    FOR DELETE
    USING (auth.uid() = user_id);
*/

-- ============================================================================
-- Tasks Schema Complete!
-- ============================================================================

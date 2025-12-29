-- =====================================================
-- ADD RECURRING EVENTS SUPPORT TO EVENTS TABLE
-- =====================================================
-- This migration adds recurrence fields to support
-- recurring events with RRULE (RFC 5545) format.
--
-- Features:
-- - Store RRULE strings for recurrence patterns
-- - Support for event exceptions (modified/cancelled instances)
-- - Indexes for efficient queries
-- =====================================================

-- Add recurrence column to store RRULE string
-- Example: "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS recurrence TEXT;

-- Add recurrence_id for exceptions (future use)
-- This links a modified/cancelled instance to its parent recurring event
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS recurrence_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Add original_start for exceptions (future use)
-- Stores the original start time of the instance before modification
-- Used to identify which occurrence in the series was modified
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS original_start TIMESTAMPTZ;

-- Create index on recurrence for efficient queries on recurring events
CREATE INDEX IF NOT EXISTS idx_events_recurrence
ON public.events(recurrence)
WHERE recurrence IS NOT NULL;

-- Create index on recurrence_id for exception lookups
CREATE INDEX IF NOT EXISTS idx_events_recurrence_id
ON public.events(recurrence_id)
WHERE recurrence_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.events.recurrence IS
'RRULE string (RFC 5545) defining recurrence pattern. Example: "FREQ=WEEKLY;BYDAY=MO". NULL for non-recurring events.';

COMMENT ON COLUMN public.events.recurrence_id IS
'UUID of parent recurring event if this is an exception/modification. NULL for normal events and parent recurring events.';

COMMENT ON COLUMN public.events.original_start IS
'Original start time for exception instances. Used to identify which occurrence in the recurrence series was modified. NULL for normal events and parent recurring events.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Events table now supports recurring events with RRULE format.
--
-- Usage:
-- - Non-recurring event: recurrence = NULL
-- - Recurring event: recurrence = "FREQ=DAILY" (parent event)
-- - Exception event: recurrence_id = parent_id, original_start = original occurrence time
-- =====================================================

-- =====================================================
-- ADD GOOGLE CALENDAR SYNC SUPPORT TO EVENTS TABLE
-- =====================================================
-- This migration adds a google_event_id column to track
-- events that are synced with Google Calendar.
--
-- This enables 2-way sync:
-- 1. Events created in LifeOS can be pushed to Google Calendar
-- 2. Google Calendar event IDs are stored for future updates/deletes
-- =====================================================

-- Add google_event_id column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Create index on google_event_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_events_google_event_id
ON public.events(google_event_id)
WHERE google_event_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.events.google_event_id IS
'Google Calendar event ID for synced events. NULL if event is local-only.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Events table now supports 2-way sync with Google Calendar.
-- =====================================================

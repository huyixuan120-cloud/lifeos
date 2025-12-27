/**
 * Google Calendar Integration Service
 *
 * Fetches calendar events using the Google Calendar API v3.
 * Requires an authenticated Supabase session with Google OAuth provider_token.
 */

import { supabase } from './supabase';

/**
 * Simplified Calendar Event interface
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 datetime
  end: string;   // ISO 8601 datetime
  description?: string;
}

/**
 * Google Calendar API Event Response (partial type)
 */
interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Get Google Calendar Events for the current month
 *
 * This function:
 * 1. Retrieves the current Supabase session
 * 2. Extracts the Google OAuth provider_token
 * 3. Calls the Google Calendar API to fetch events
 * 4. Filters events to the current month
 * 5. Returns a simplified array of calendar events
 *
 * @returns Promise with array of calendar events or error
 *
 * @example
 * ```tsx
 * const { events, error } = await getGoogleCalendarEvents();
 * if (error) {
 *   console.error('Failed to fetch events:', error);
 * } else {
 *   console.log('Events:', events);
 * }
 * ```
 */
export async function getGoogleCalendarEvents(): Promise<{
  events: CalendarEvent[] | null;
  error: string | null;
}> {
  try {
    // Step 1: Get the current Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return {
        events: null,
        error: `Session error: ${sessionError.message}`,
      };
    }

    if (!sessionData.session) {
      return {
        events: null,
        error: 'No active session. Please sign in with Google first.',
      };
    }

    // Step 2: Extract the provider_token (Google OAuth access token)
    const providerToken = sessionData.session.provider_token;

    if (!providerToken) {
      return {
        events: null,
        error: 'No Google access token found. Please reconnect your Google account.',
      };
    }

    // Step 3: Calculate current month's date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const timeMin = firstDayOfMonth.toISOString();
    const timeMax = lastDayOfMonth.toISOString();

    // Step 4: Build Google Calendar API request URL
    const calendarApiUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarApiUrl.searchParams.append('timeMin', timeMin);
    calendarApiUrl.searchParams.append('timeMax', timeMax);
    calendarApiUrl.searchParams.append('singleEvents', 'true'); // Expand recurring events
    calendarApiUrl.searchParams.append('orderBy', 'startTime');  // Sort by start time
    calendarApiUrl.searchParams.append('maxResults', '100');     // Limit to 100 events

    // Step 5: Fetch events from Google Calendar API
    const response = await fetch(calendarApiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        events: null,
        error: `Google Calendar API error: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data: GoogleCalendarResponse = await response.json();

    // Step 6: Transform Google Calendar events to our simplified format
    if (!data.items || data.items.length === 0) {
      return {
        events: [],
        error: null,
      };
    }

    const events: CalendarEvent[] = data.items
      .filter((event) => {
        // Filter out events without start/end times
        return event.start && event.end && (event.start.dateTime || event.start.date);
      })
      .map((event) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || undefined,
      }));

    return {
      events,
      error: null,
    };
  } catch (error) {
    return {
      events: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get Google Calendar Events for a custom date range
 *
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @returns Promise with array of calendar events or error
 */
export async function getGoogleCalendarEventsInRange(
  startDate: Date,
  endDate: Date
): Promise<{
  events: CalendarEvent[] | null;
  error: string | null;
}> {
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return {
        events: null,
        error: sessionError?.message || 'No active session',
      };
    }

    const providerToken = sessionData.session.provider_token;

    if (!providerToken) {
      return {
        events: null,
        error: 'No Google access token found',
      };
    }

    // Build API URL with custom date range
    const calendarApiUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarApiUrl.searchParams.append('timeMin', startDate.toISOString());
    calendarApiUrl.searchParams.append('timeMax', endDate.toISOString());
    calendarApiUrl.searchParams.append('singleEvents', 'true');
    calendarApiUrl.searchParams.append('orderBy', 'startTime');
    calendarApiUrl.searchParams.append('maxResults', '250');

    const response = await fetch(calendarApiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        events: null,
        error: `API error: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data: GoogleCalendarResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return { events: [], error: null };
    }

    const events: CalendarEvent[] = data.items
      .filter((event) => event.start && event.end && (event.start.dateTime || event.start.date))
      .map((event) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        description: event.description || undefined,
      }));

    return { events, error: null };
  } catch (error) {
    return {
      events: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if user has connected their Google Calendar
 *
 * @returns Promise with boolean indicating if Google Calendar is connected
 */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    return !!(sessionData.session?.provider_token);
  } catch {
    return false;
  }
}

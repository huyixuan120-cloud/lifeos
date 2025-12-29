/**
 * Google Calendar Integration Service
 *
 * Fetches calendar events using the Google Calendar API v3.
 * Requires an authenticated Supabase session with Google OAuth provider_token.
 */

import { supabase } from './supabase';

/**
 * Google Calendar Color Palette
 * Google Calendar uses color IDs (1-11) instead of hex codes
 */
const GOOGLE_CALENDAR_COLORS = {
  '1': '#7986cb', // Lavanda
  '2': '#33b679', // Salvia
  '3': '#8e24aa', // Uva
  '4': '#e67c73', // Fiamma
  '5': '#f6c026', // Banana
  '6': '#f5511d', // Mandarino
  '7': '#039be5', // Pavone
  '8': '#616161', // Grafite
  '9': '#3f51b5', // Mirtillo
  '10': '#0b8043', // Basilico
  '11': '#d50000', // Pomodoro
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(
  rgb1: { r: number; g: number; b: number },
  rgb2: { r: number; g: number; b: number }
): number {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * Map hex color to closest Google Calendar color ID
 */
function mapHexToGoogleColorId(hex: string): string {
  const inputRgb = hexToRgb(hex);
  if (!inputRgb) return '7'; // Default to Pavone (blue) if invalid hex

  let closestId = '7';
  let minDistance = Infinity;

  for (const [id, googleHex] of Object.entries(GOOGLE_CALENDAR_COLORS)) {
    const googleRgb = hexToRgb(googleHex);
    if (!googleRgb) continue;

    const distance = colorDistance(inputRgb, googleRgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestId = id;
    }
  }

  return closestId;
}

/**
 * Map Google Calendar color ID to hex color
 * @param colorId - Google Calendar color ID (1-11)
 * @returns Hex color string
 */
export function mapGoogleColorIdToHex(colorId?: string): string {
  if (!colorId || !GOOGLE_CALENDAR_COLORS[colorId as keyof typeof GOOGLE_CALENDAR_COLORS]) {
    return '#4285F4'; // Default to Google Blue
  }
  return GOOGLE_CALENDAR_COLORS[colorId as keyof typeof GOOGLE_CALENDAR_COLORS];
}

/**
 * Simplified Calendar Event interface
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601 datetime
  end: string;   // ISO 8601 datetime
  description?: string;
  colorId?: string; // Google Calendar color ID (1-11)
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
  colorId?: string; // Google Calendar color ID (1-11)
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
        colorId: event.colorId || undefined,
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
        colorId: event.colorId || undefined,
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
 * Create a new Google Calendar event
 *
 * @param eventData - Event data (title, start, end, description)
 * @returns Promise with created event ID or error
 */
export async function createGoogleCalendarEvent(eventData: {
  title: string;
  start: string;
  end: string;
  description?: string;
  allDay?: boolean;
  backgroundColor?: string;
}): Promise<{ eventId: string | null; error: string | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return { eventId: null, error: 'No active session' };
    }

    const providerToken = sessionData.session.provider_token;

    if (!providerToken) {
      return { eventId: null, error: 'No Google access token found' };
    }

    // Build the event payload
    const eventPayload: any = {
      summary: eventData.title,
      description: eventData.description || '',
    };

    if (eventData.allDay) {
      // All-day events use 'date' format (YYYY-MM-DD)
      const startDate = new Date(eventData.start).toISOString().split('T')[0];
      const endDate = new Date(eventData.end).toISOString().split('T')[0];
      eventPayload.start = { date: startDate };
      eventPayload.end = { date: endDate };
    } else {
      // Timed events use 'dateTime' format
      eventPayload.start = {
        dateTime: eventData.start,
        timeZone: 'UTC',
      };
      eventPayload.end = {
        dateTime: eventData.end,
        timeZone: 'UTC',
      };
    }

    // Map hex color to Google Calendar color ID
    if (eventData.backgroundColor) {
      const colorId = mapHexToGoogleColorId(eventData.backgroundColor);
      eventPayload.colorId = colorId;
      console.log(`🎨 Creating event with color ${eventData.backgroundColor} → Google colorId ${colorId}`);
    }

    const apiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        eventId: null,
        error: `Failed to create Google event: ${errorData.error?.message || response.statusText}`,
      };
    }

    const createdEvent = await response.json();
    return { eventId: createdEvent.id, error: null };
  } catch (error) {
    return {
      eventId: null,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update a Google Calendar event
 *
 * @param eventId - The Google Calendar event ID
 * @param updates - Fields to update (title, start, end, description)
 * @returns Promise with success status or error
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  updates: {
    title?: string;
    start?: string;
    end?: string;
    description?: string;
    backgroundColor?: string;
    allDay?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return { success: false, error: 'No active session' };
    }

    const providerToken = sessionData.session.provider_token;

    if (!providerToken) {
      return { success: false, error: 'No Google access token found' };
    }

    // Build the update payload
    const updatePayload: any = {};
    if (updates.title !== undefined) updatePayload.summary = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;

    // Handle start/end times based on whether it's an all-day event
    if (updates.start) {
      if (updates.allDay) {
        // All-day events use 'date' format (YYYY-MM-DD)
        const startDate = new Date(updates.start).toISOString().split('T')[0];
        updatePayload.start = { date: startDate };
      } else {
        // Timed events use 'dateTime' format
        updatePayload.start = {
          dateTime: updates.start,
          timeZone: 'UTC',
        };
      }
    }
    if (updates.end) {
      if (updates.allDay) {
        // All-day events use 'date' format (YYYY-MM-DD)
        const endDate = new Date(updates.end).toISOString().split('T')[0];
        updatePayload.end = { date: endDate };
      } else {
        // Timed events use 'dateTime' format
        updatePayload.end = {
          dateTime: updates.end,
          timeZone: 'UTC',
        };
      }
    }
    if (updates.backgroundColor) {
      // Map hex color to closest Google Calendar color ID (1-11)
      const colorId = mapHexToGoogleColorId(updates.backgroundColor);
      updatePayload.colorId = colorId;
      console.log(`🎨 Mapping color ${updates.backgroundColor} → Google colorId ${colorId}`);
    }

    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Failed to update Google event: ${errorData.error?.message || response.statusText}`,
      };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Delete a Google Calendar event
 *
 * @param eventId - The Google Calendar event ID
 * @returns Promise with success status or error
 */
export async function deleteGoogleCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return { success: false, error: 'No active session' };
    }

    const providerToken = sessionData.session.provider_token;

    if (!providerToken) {
      return { success: false, error: 'No Google access token found' };
    }

    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Failed to delete Google event: ${errorData.error?.message || response.statusText}`,
      };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
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

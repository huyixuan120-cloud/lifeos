"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { EventInput } from "@fullcalendar/core";
import type {
  LifeOSEvent,
  CreateLifeOSEvent,
} from "@/types/calendar";
import { toFullCalendarEvent } from "@/types/calendar";

interface UseCalendarReturn {
  events: EventInput[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  addEvent: (eventData: CreateLifeOSEvent) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<CreateLifeOSEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing calendar events with Supabase
 *
 * Provides CRUD operations for calendar events:
 * - Fetch all events on mount
 * - Create new events
 * - Update existing events
 * - Delete events
 *
 * @returns {UseCalendarReturn} Calendar state and operations
 *
 * @example
 * ```tsx
 * function CalendarView() {
 *   const { events, isLoading, addEvent } = useCalendar();
 *
 *   const handleSelect = async (selectInfo) => {
 *     await addEvent({
 *       title: "New Event",
 *       start: selectInfo.start.toISOString(),
 *       end: selectInfo.end.toISOString(),
 *       all_day: selectInfo.allDay,
 *     });
 *   };
 *
 *   return <FullCalendar events={events} select={handleSelect} />;
 * }
 * ```
 */
export function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  /**
   * Fetches all events from Supabase and converts them to FullCalendar format
   */
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey ||
          supabaseUrl.includes("placeholder") ||
          supabaseKey === "placeholder-key") {
        setError("Supabase not configured. Please set up your credentials in .env.local");
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .order("start", { ascending: true });

      if (fetchError) {
        console.error("Error fetching events:", fetchError);
        console.log("Full error object:", JSON.stringify(fetchError, null, 2));

        // Handle different error scenarios
        const errorMessage = fetchError.message ||
          fetchError.details ||
          (fetchError.code === "PGRST116" ? "Table 'events' does not exist. Please run the SQL schema in Supabase." :
           fetchError.hint ||
           "Failed to fetch events. Check Supabase setup and RLS policies.");

        setError(errorMessage);
        return;
      }

      if (data) {
        // Convert database events to FullCalendar format
        const formattedEvents = data.map((event: LifeOSEvent) =>
          toFullCalendarEvent(event)
        );
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error("Unexpected error fetching events:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to database";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  /**
   * Adds a new event to Supabase
   *
   * @param eventData - The event data to insert
   */
  const addEvent = useCallback(
    async (eventData: CreateLifeOSEvent) => {
      try {
        setError(null);

        if (!user) {
          throw new Error("Not authenticated. Please sign in.");
        }

        // Prepare data for database insertion
        const dbEvent = {
          title: eventData.title,
          start: eventData.start,
          end: eventData.end,
          all_day: eventData.all_day ?? false,
          description: eventData.description ?? null,
          status: eventData.status ?? "active",
          background_color: eventData.background_color ?? "#3b82f6",
          border_color: eventData.border_color ?? "#3b82f6",
          text_color: eventData.text_color ?? "#ffffff",
          user_id: user.id, // Always use authenticated user's ID
        };

        // Step 1: Insert into Supabase first
        const { data, error: insertError } = await supabase
          .from("events")
          .insert([dbEvent])
          .select()
          .single();

        if (insertError) {
          console.error("Error adding event:", insertError);
          setError(insertError.message);
          throw insertError;
        }

        if (!data) {
          throw new Error("Failed to create event - no data returned");
        }

        // Step 2: Try to sync to Google Calendar (if connected)
        try {
          const { isGoogleCalendarConnected, createGoogleCalendarEvent } = await import("@/lib/googleCalendar");
          const isConnected = await isGoogleCalendarConnected();

          if (isConnected) {
            console.log("📤 Syncing event to Google Calendar...");

            const { eventId: googleEventId, error: googleError } = await createGoogleCalendarEvent({
              title: eventData.title,
              start: eventData.start,
              end: eventData.end,
              description: eventData.description,
              allDay: eventData.all_day,
              backgroundColor: eventData.background_color,
            });

            if (googleEventId && !googleError) {
              // Step 3: Update Supabase record with google_event_id
              const { error: updateError } = await supabase
                .from("events")
                .update({ google_event_id: googleEventId })
                .eq("id", data.id);

              if (updateError) {
                console.warn("⚠️ Failed to save google_event_id:", updateError);
              } else {
                console.log("✅ Event synced to Google Calendar:", googleEventId);
                // Update local data with google_event_id
                data.google_event_id = googleEventId;
              }
            } else if (googleError) {
              console.warn("⚠️ Failed to sync to Google Calendar:", googleError);
              // Event still saved locally, just not synced to Google
            }
          }
        } catch (syncError) {
          console.warn("⚠️ Google Calendar sync failed (event saved locally):", syncError);
          // Non-fatal: event is saved in Supabase, just not synced to Google
        }

        // Step 4: Optimistic update - add the new event to the local state
        const newEvent = toFullCalendarEvent(data as LifeOSEvent);
        setEvents((prev) => [...prev, newEvent]);

        console.log("✅ Event created successfully:", data);
      } catch (err) {
        console.error("Unexpected error adding event:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase, user]
  );

  /**
   * Updates an existing event in Supabase
   *
   * @param id - The event ID to update
   * @param eventData - The fields to update
   */
  const updateEvent = useCallback(
    async (id: string, eventData: Partial<CreateLifeOSEvent>) => {
      try {
        setError(null);

        if (!user) {
          throw new Error("Not authenticated. Please sign in.");
        }

        // Step 1: Get the current event to check if it has a google_event_id
        const { data: currentEvent, error: fetchError } = await supabase
          .from("events")
          .select("google_event_id")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching event:", fetchError);
          setError(fetchError.message);
          throw fetchError;
        }

        // Prepare update data (only include provided fields)
        const updateData: any = {};
        if (eventData.title !== undefined) updateData.title = eventData.title;
        if (eventData.start !== undefined) updateData.start = eventData.start;
        if (eventData.end !== undefined) updateData.end = eventData.end;
        if (eventData.all_day !== undefined) updateData.all_day = eventData.all_day;
        if (eventData.description !== undefined) updateData.description = eventData.description;
        if (eventData.status !== undefined) updateData.status = eventData.status;
        if (eventData.background_color !== undefined) updateData.background_color = eventData.background_color;
        if (eventData.border_color !== undefined) updateData.border_color = eventData.border_color;
        if (eventData.text_color !== undefined) updateData.text_color = eventData.text_color;

        // Step 2: Update in Supabase
        const { data, error: updateError } = await supabase
          .from("events")
          .update(updateData)
          .eq("id", id)
          .eq("user_id", user.id) // Ensure user owns the event
          .select()
          .single();

        if (updateError) {
          console.error("Error updating event:", updateError);
          setError(updateError.message);
          throw updateError;
        }

        // Step 3: Sync to Google Calendar if this event is synced
        if (currentEvent?.google_event_id) {
          try {
            const { updateGoogleCalendarEvent } = await import("@/lib/googleCalendar");

            console.log("📤 Syncing update to Google Calendar...");

            const { success, error: googleError } = await updateGoogleCalendarEvent(
              currentEvent.google_event_id,
              {
                title: eventData.title,
                start: eventData.start,
                end: eventData.end,
                description: eventData.description,
                backgroundColor: eventData.background_color,
              }
            );

            if (!success) {
              console.warn("⚠️ Failed to sync update to Google Calendar:", googleError);
              // Event still updated locally, just not synced to Google
            } else {
              console.log("✅ Update synced to Google Calendar");
            }
          } catch (syncError) {
            console.warn("⚠️ Google Calendar sync failed (event updated locally):", syncError);
            // Non-fatal: event is updated in Supabase, just not synced to Google
          }
        }

        // Step 4: Optimistic update - update the event in local state
        if (data) {
          const updatedEvent = toFullCalendarEvent(data as LifeOSEvent);
          setEvents((prev) =>
            prev.map((event) => (event.id === id ? updatedEvent : event))
          );
        }

        console.log("✅ Event updated successfully:", data);
      } catch (err) {
        console.error("Unexpected error updating event:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase, user]
  );

  /**
   * Deletes an event from Supabase
   *
   * @param id - The event ID to delete
   */
  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        setError(null);

        if (!user) {
          throw new Error("Not authenticated. Please sign in.");
        }

        // Step 1: Get the current event to check if it has a google_event_id
        const { data: currentEvent, error: fetchError } = await supabase
          .from("events")
          .select("google_event_id")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching event:", fetchError);
          setError(fetchError.message);
          throw fetchError;
        }

        // Step 2: Delete from Supabase
        const { error: deleteError } = await supabase
          .from("events")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id); // Ensure user owns the event

        if (deleteError) {
          console.error("Error deleting event:", deleteError);
          setError(deleteError.message);
          throw deleteError;
        }

        // Step 3: Delete from Google Calendar if this event is synced
        if (currentEvent?.google_event_id) {
          try {
            const { deleteGoogleCalendarEvent } = await import("@/lib/googleCalendar");

            console.log("📤 Deleting from Google Calendar...");

            const { success, error: googleError } = await deleteGoogleCalendarEvent(
              currentEvent.google_event_id
            );

            if (!success) {
              console.warn("⚠️ Failed to delete from Google Calendar:", googleError);
              // Event already deleted locally, but still exists in Google
            } else {
              console.log("✅ Event deleted from Google Calendar");
            }
          } catch (syncError) {
            console.warn("⚠️ Google Calendar delete failed (event deleted locally):", syncError);
            // Non-fatal: event is deleted from Supabase, just not from Google
          }
        }

        // Step 4: Optimistic update - remove the event from local state
        setEvents((prev) => prev.filter((event) => event.id !== id));

        console.log("✅ Event deleted successfully");
      } catch (err) {
        console.error("Unexpected error deleting event:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    [supabase, user]
  );

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch events when user changes
  useEffect(() => {
    if (user) {
      fetchEvents();
    } else {
      // Clear events if user logs out
      setEvents([]);
      setIsLoading(false);
    }
  }, [user, fetchEvents]);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}

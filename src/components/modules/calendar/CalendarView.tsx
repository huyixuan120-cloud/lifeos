"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, EventChangeArg } from "@fullcalendar/core";
import { useCalendar } from "@/hooks/use-calendar";
import { Loader2 } from "lucide-react";
import {
  EventDialog,
  formatDateForInput,
  parseInputToISO,
  type EventFormValues,
} from "./EventDialog";

interface DialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  eventId?: string;
  initialData?: Partial<EventFormValues>;
}

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { events, isLoading, error, addEvent, updateEvent, deleteEvent } = useCalendar();

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: "create",
  });

  /**
   * Handle date selection - opens dialog for creating a new event
   */
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;

    // Open dialog with selected date range
    setDialogState({
      isOpen: true,
      mode: "create",
      initialData: {
        start: formatDateForInput(selectInfo.start),
        end: formatDateForInput(selectInfo.end),
        all_day: selectInfo.allDay,
      },
    });

    // Clear the selection
    calendarApi.unselect();
  };

  /**
   * Handle event click - opens dialog for editing
   */
  const handleEventClick = (clickInfo: EventClickArg) => {
    const { event } = clickInfo;

    // Open dialog with event data
    setDialogState({
      isOpen: true,
      mode: "edit",
      eventId: event.id,
      initialData: {
        title: event.title,
        description: event.extendedProps?.description || "",
        start: formatDateForInput(event.start || new Date()),
        end: formatDateForInput(event.end || event.start || new Date()),
        all_day: event.allDay,
        background_color: event.backgroundColor || "#64748b",
      },
    });
  };

  /**
   * Handle event drop/resize - updates event times in database
   */
  const handleEventChange = async (changeInfo: EventChangeArg) => {
    const { event } = changeInfo;

    if (!event.id) {
      console.error("Event has no ID, cannot update");
      return;
    }

    try {
      await updateEvent(event.id, {
        start: event.start?.toISOString() || "",
        end: event.end?.toISOString() || event.start?.toISOString() || "",
        all_day: event.allDay,
      });

      console.log("✅ Event updated via drag/drop");
    } catch (error) {
      console.error("Failed to update event:", error);
      // Revert the change in the UI
      changeInfo.revert();
      alert("Failed to update event. Please try again.");
    }
  };

  /**
   * Handle dialog submit - creates or updates event
   */
  const handleDialogSubmit = async (data: EventFormValues) => {
    try {
      if (dialogState.mode === "edit" && dialogState.eventId) {
        // Update existing event
        await updateEvent(dialogState.eventId, {
          title: data.title,
          description: data.description,
          start: parseInputToISO(data.start),
          end: parseInputToISO(data.end),
          all_day: data.all_day,
          background_color: data.background_color,
        });
      } else {
        // Create new event
        await addEvent({
          title: data.title,
          description: data.description,
          start: parseInputToISO(data.start),
          end: parseInputToISO(data.end),
          all_day: data.all_day,
          background_color: data.background_color,
          status: "active",
        });
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      throw error; // Re-throw to keep dialog open
    }
  };

  /**
   * Handle event deletion from dialog
   */
  const handleDialogDelete = async () => {
    if (!dialogState.eventId) return;

    try {
      await deleteEvent(dialogState.eventId);
    } catch (error) {
      console.error("Failed to delete event:", error);
      throw error; // Re-throw to keep dialog open
    }
  };

  /**
   * Close dialog and reset state
   */
  const handleDialogClose = () => {
    setDialogState({
      isOpen: false,
      mode: "create",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full p-6">
        <div className="bg-background rounded-lg border shadow-sm h-full overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full w-full p-6">
        <div className="bg-background rounded-lg border shadow-sm h-full overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
              <p className="text-sm font-medium text-destructive">Error loading calendar</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground">
                Make sure you've set up Supabase credentials in .env.local
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full p-6">
        <div className="bg-background rounded-lg border shadow-sm h-full overflow-hidden">
          <div className="p-6 h-full">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventChange={handleEventChange}
              height="100%"
              // Styling
              dayHeaderClassNames="text-sm font-medium text-muted-foreground uppercase"
              viewClassNames="rounded-md"
              // Time slots
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              scrollTime="08:00:00"
              // Event display
              eventDisplay="block"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                meridiem: false,
                hour12: false,
              }}
              // Business hours (optional visual guide)
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: "09:00",
                endTime: "17:00",
              }}
              nowIndicator={true}
            />
          </div>
        </div>
      </div>

      {/* Event Dialog */}
      <EventDialog
        isOpen={dialogState.isOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        onDelete={dialogState.mode === "edit" ? handleDialogDelete : undefined}
        initialData={dialogState.initialData}
        mode={dialogState.mode}
      />
    </>
  );
}

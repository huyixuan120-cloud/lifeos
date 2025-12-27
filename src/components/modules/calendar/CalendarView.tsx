"use client";

import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, EventChangeArg, EventReceiveArg, DateClickArg } from "@fullcalendar/core";
import { useCalendar } from "@/hooks/use-calendar";
import { useTasks } from "@/hooks/use-tasks";
import { Loader2, GripVertical, Calendar as CalendarIcon, Plus, X, Trash2, Clock } from "lucide-react";
import { PRIORITY_COLORS } from "@/types/tasks";
import type { LifeOSTask } from "@/types/tasks";
import type { LifeOSEvent } from "@/types/calendar";
import { addHours, setHours, setMinutes, setSeconds, setMilliseconds, format as formatDate, isSameDay, getHours, isWithinInterval, startOfHour } from "date-fns";
import {
  EventDialog,
  formatDateForInput,
  parseInputToISO,
  type EventFormValues,
} from "./EventDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface DialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  eventId?: string;
  initialData?: Partial<EventFormValues>;
}

interface DraftEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  viewType: string;
}

interface DayOverview {
  isOpen: boolean;
  date: Date | null;
}

interface SelectedSlot {
  hour: number;
  event?: any;
  mode: "create" | "view";
}

interface PendingTask {
  title: string;
  color: string;
}

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const taskContainerRef = useRef<HTMLDivElement>(null);
  const { events, isLoading, error, addEvent, updateEvent, deleteEvent } = useCalendar();
  const { tasks } = useTasks();

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    mode: "create",
  });

  const [draftEvent, setDraftEvent] = useState<DraftEvent | null>(null);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

  const [dayOverview, setDayOverview] = useState<DayOverview>({
    isOpen: false,
    date: null,
  });

  const [pendingTaskToSchedule, setPendingTaskToSchedule] = useState<PendingTask | null>(null);

  useEffect(() => {
    if (taskContainerRef.current) {
      const draggable = new Draggable(taskContainerRef.current, {
        itemSelector: ".draggable-task",
        eventData: function (eventEl) {
          const title = eventEl.getAttribute("data-title");
          const color = eventEl.getAttribute("data-color");
          return {
            title: title || "Untitled Task",
            backgroundColor: color || "#3b82f6",
            borderColor: color || "#3b82f6",
            textColor: "#ffffff",
            duration: { hours: 1 },
            color: color || "#3b82f6",
          };
        },
      });

      return () => {
        draggable.destroy();
      };
    }
  }, [tasks]);

  const handleEventReceive = async (info: EventReceiveArg) => {
    const { event } = info;

    const calendarApi = calendarRef.current?.getApi();
    const viewType = calendarApi?.view.type || "dayGridMonth";

    const startDate = event.start || new Date();
    let endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const isMonthView = viewType === "dayGridMonth";
    const shouldBeAllDay = isMonthView || event.allDay;

    if (shouldBeAllDay) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    setDraftEvent({
      title: event.title,
      start: startDate,
      end: endDate,
      allDay: shouldBeAllDay,
      color: event.backgroundColor || "#3b82f6",
      viewType: viewType,
    });

    event.remove();
    setIsDropDialogOpen(true);
  };

  const handleDropGatewayConfirm = async (isAllDay: boolean) => {
    if (!draftEvent) return;

    if (isAllDay) {
      // Create all-day event immediately
      try {
        let startDate = new Date(draftEvent.start);
        startDate = setHours(startDate, 0);
        startDate = setMinutes(startDate, 0);
        startDate = setSeconds(startDate, 0);
        startDate = setMilliseconds(startDate, 0);

        let endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        await addEvent({
          title: draftEvent.title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          all_day: true,
          background_color: draftEvent.color,
          border_color: draftEvent.color,
          text_color: "#ffffff",
          status: "active",
          description: `Time-boxed from task: ${draftEvent.title}`,
        });

        console.log("✅ All-day task scheduled");
        setIsDropDialogOpen(false);
        setDraftEvent(null);
      } catch (error) {
        console.error("Failed to create event:", error);
        alert("Failed to create event. Please try again.");
      }
    } else {
      // Open Day Command Station with pending task
      setPendingTaskToSchedule({
        title: draftEvent.title,
        color: draftEvent.color,
      });
      setDayOverview({
        isOpen: true,
        date: draftEvent.start,
      });
      setIsDropDialogOpen(false);
      setDraftEvent(null);
    }
  };

  const handleDropCancel = () => {
    setIsDropDialogOpen(false);
    setDraftEvent(null);
  };

  const handleDateClick = (info: DateClickArg) => {
    const calendarApi = calendarRef.current?.getApi();
    const viewType = calendarApi?.view.type;

    if (viewType === "dayGridMonth") {
      info.jsEvent.preventDefault();

      setDayOverview({
        isOpen: true,
        date: info.date,
      });
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    const viewType = calendarApi.view.type;

    if (viewType === "dayGridMonth") {
      calendarApi.unselect();
      return;
    }

    setDialogState({
      isOpen: true,
      mode: "create",
      initialData: {
        start: formatDateForInput(selectInfo.start),
        end: formatDateForInput(selectInfo.end),
        all_day: selectInfo.allDay,
      },
    });

    calendarApi.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const { event } = clickInfo;

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
      changeInfo.revert();
      alert("Failed to update event. Please try again.");
    }
  };

  const handleDialogSubmit = async (data: EventFormValues) => {
    try {
      if (dialogState.mode === "edit" && dialogState.eventId) {
        await updateEvent(dialogState.eventId, {
          title: data.title,
          description: data.description,
          start: parseInputToISO(data.start),
          end: parseInputToISO(data.end),
          all_day: data.all_day,
          background_color: data.background_color,
        });
      } else {
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
      throw error;
    }
  };

  const handleDialogDelete = async () => {
    if (!dialogState.eventId) return;

    try {
      await deleteEvent(dialogState.eventId);
    } catch (error) {
      console.error("Failed to delete event:", error);
      throw error;
    }
  };

  const handleDialogClose = () => {
    setDialogState({
      isOpen: false,
      mode: "create",
    });
  };

  const incompleteTasks = tasks.filter((task) => !task.is_completed);

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
          <div className="flex h-full">
            <div className="flex-1 p-6 overflow-auto">
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
                droppable={true}
                dateClick={handleDateClick}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventChange={handleEventChange}
                eventReceive={handleEventReceive}
                height="100%"
                dayHeaderClassNames="text-sm font-medium text-muted-foreground uppercase"
                viewClassNames="rounded-md"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                slotDuration="00:30:00"
                scrollTime="08:00:00"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  meridiem: false,
                  hour12: false,
                }}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5],
                  startTime: "09:00",
                  endTime: "17:00",
                }}
                nowIndicator={true}
              />
            </div>

            <div className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="p-4 border-b bg-background">
                <h3 className="font-semibold text-sm">Time-Box Tasks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag tasks onto the calendar
                </p>
              </div>

              <div
                ref={taskContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
              >
                {incompleteTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No tasks to time-box
                    </p>
                  </div>
                ) : (
                  incompleteTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EventDialog
        isOpen={dialogState.isOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        onDelete={dialogState.mode === "edit" ? handleDialogDelete : undefined}
        initialData={dialogState.initialData}
        mode={dialogState.mode}
      />

      <DropGatewayDialog
        isOpen={isDropDialogOpen}
        draftEvent={draftEvent}
        onConfirm={handleDropGatewayConfirm}
        onCancel={handleDropCancel}
      />

      <DayCommandStation
        isOpen={dayOverview.isOpen}
        date={dayOverview.date}
        events={events}
        pendingTask={pendingTaskToSchedule}
        onClose={() => {
          setDayOverview({ isOpen: false, date: null });
          setPendingTaskToSchedule(null);
        }}
        onAddEvent={addEvent}
        onDeleteEvent={deleteEvent}
      />
    </>
  );
}

function TaskCard({ task }: { task: LifeOSTask }) {
  const priorityInfo = PRIORITY_COLORS[task.priority];

  return (
    <div
      className="draggable-task p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-move transition-colors"
      data-title={task.title}
      data-color={priorityInfo.bg}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityInfo.bg }}
              title={priorityInfo.label}
            />
            <p className="text-sm font-medium truncate">{task.title}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {priorityInfo.label}
          </p>
        </div>
      </div>
    </div>
  );
}

interface DropGatewayDialogProps {
  isOpen: boolean;
  draftEvent: DraftEvent | null;
  onConfirm: (isAllDay: boolean) => void;
  onCancel: () => void;
}

function DropGatewayDialog({
  isOpen,
  draftEvent,
  onConfirm,
  onCancel,
}: DropGatewayDialogProps) {
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    if (draftEvent) {
      setAllDay(draftEvent.allDay);
    }
  }, [draftEvent]);

  const handleConfirm = () => {
    onConfirm(allDay);
  };

  if (!draftEvent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Task</DialogTitle>
          <DialogDescription>
            How would you like to schedule this task?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Preview */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: draftEvent.color }}
              />
              <p className="text-sm font-medium">{draftEvent.title}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {draftEvent.start.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="all-day-gateway" className="text-sm font-medium">
                All Day Event
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allDay ? "Event will span the entire day" : "Choose specific time slot"}
              </p>
            </div>
            <Switch
              id="all-day-gateway"
              checked={allDay}
              onCheckedChange={setAllDay}
            />
          </div>

          {/* Helper Text */}
          {!allDay && (
            <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                💡 You'll select the exact time slot in the next step
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {allDay ? "Schedule All Day" : "Choose Time Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DayCommandStationProps {
  isOpen: boolean;
  date: Date | null;
  events: any[];
  pendingTask: PendingTask | null;
  onClose: () => void;
  onAddEvent: (data: any) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

function DayCommandStation({
  isOpen,
  date,
  events,
  pendingTask,
  onClose,
  onAddEvent,
  onDeleteEvent,
}: DayCommandStationProps) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  if (!date) return null;

  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.start);
    return isSameDay(eventStart, date) && !event.allDay;
  });

  const formattedDate = formatDate(date, "EEEE, MMMM d, yyyy");
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventAtHour = (hour: number) => {
    return dayEvents.find((event) => {
      const eventStart = new Date(event.start);
      return getHours(eventStart) === hour;
    });
  };

  const isHourOccupied = (hour: number) => {
    return dayEvents.some((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const hourStart = setHours(new Date(date), hour);
      const hourEnd = addHours(hourStart, 1);

      return (
        isWithinInterval(hourStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(eventStart, { start: hourStart, end: hourEnd })
      );
    });
  };

  const getOccupyingEvent = (hour: number) => {
    return dayEvents.find((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const hourStart = setHours(new Date(date), hour);
      const hourEnd = addHours(hourStart, 1);

      return isWithinInterval(hourStart, { start: eventStart, end: eventEnd });
    });
  };

  const handleSlotClick = async (hour: number) => {
    if (pendingTask) {
      // Immediate placement mode - create event directly
      let startDate = new Date(date);
      startDate = setHours(startDate, hour);
      startDate = setMinutes(startDate, 0);
      startDate = setSeconds(startDate, 0);

      const endDate = addHours(startDate, 1);

      await onAddEvent({
        title: pendingTask.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        all_day: false,
        background_color: pendingTask.color,
        border_color: pendingTask.color,
        text_color: "#ffffff",
        status: "active",
        description: `Time-boxed from task: ${pendingTask.title}`,
      });

      console.log("✅ Task placed at", hour + ":00");
      onClose(); // Close the command station after placement
    } else {
      // Normal create mode - show form
      setSelectedSlot({ hour, mode: "create" });
    }
  };

  const handleEventClick = (event: any) => {
    const eventHour = getHours(new Date(event.start));
    setSelectedSlot({ hour: eventHour, event, mode: "view" });
  };

  const handleCreateEvent = async (title: string, hour: number) => {
    let startDate = new Date(date);
    startDate = setHours(startDate, hour);
    startDate = setMinutes(startDate, 0);
    startDate = setSeconds(startDate, 0);

    const endDate = addHours(startDate, 1);

    await onAddEvent({
      title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      all_day: false,
      background_color: "#3b82f6",
      status: "active",
    });

    setSelectedSlot(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await onDeleteEvent(eventId);
    setSelectedSlot(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] p-0 gap-0">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {formattedDate}
              </DialogTitle>
              {pendingTask ? (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: pendingTask.color }}
                  />
                  <p className="text-xs font-medium text-primary">
                    Click a time slot to schedule: <span className="font-semibold">{pendingTask.title}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""} scheduled
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-3 h-[60vh]">
          {/* Timeline (Left - 2/3) */}
          <div className="col-span-2 overflow-y-auto border-r">
            {hours.map((hour) => {
              const eventAtStart = getEventAtHour(hour);
              const occupyingEvent = getOccupyingEvent(hour);
              const isOccupied = isHourOccupied(hour);

              return (
                <TimelineSlot
                  key={hour}
                  hour={hour}
                  eventAtStart={eventAtStart}
                  occupyingEvent={occupyingEvent}
                  isOccupied={isOccupied}
                  isPendingMode={!!pendingTask}
                  onSlotClick={() => handleSlotClick(hour)}
                  onEventClick={handleEventClick}
                />
              );
            })}
          </div>

          {/* Action Panel (Right - 1/3) */}
          <div className="col-span-1 bg-muted/30 p-4">
            {pendingTask ? (
              <PendingTaskPanel pendingTask={pendingTask} />
            ) : (
              <ActionPanel
                selectedSlot={selectedSlot}
                date={date}
                onCreateEvent={handleCreateEvent}
                onDeleteEvent={handleDeleteEvent}
                onCancel={() => setSelectedSlot(null)}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TimelineSlotProps {
  hour: number;
  eventAtStart: any;
  occupyingEvent: any;
  isOccupied: boolean;
  isPendingMode: boolean;
  onSlotClick: () => void;
  onEventClick: (event: any) => void;
}

function TimelineSlot({
  hour,
  eventAtStart,
  occupyingEvent,
  isOccupied,
  isPendingMode,
  onSlotClick,
  onEventClick,
}: TimelineSlotProps) {
  const timeLabel = `${hour.toString().padStart(2, "0")}:00`;

  return (
    <div className="flex border-b last:border-b-0 h-10">
      {/* Time Label */}
      <div className="w-16 flex-shrink-0 px-2 py-2 border-r bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground">
          {timeLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        {eventAtStart ? (
          // Event starts here
          <button
            onClick={() => onEventClick(eventAtStart)}
            className="w-full h-full px-2 py-1 text-left border-l-4 hover:bg-accent/50 transition-colors"
            style={{ borderLeftColor: eventAtStart.backgroundColor || "#3b82f6" }}
          >
            <p className="text-xs font-medium truncate">{eventAtStart.title}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(new Date(eventAtStart.start), "HH:mm")} -{" "}
              {formatDate(new Date(eventAtStart.end), "HH:mm")}
            </p>
          </button>
        ) : occupyingEvent ? (
          // Middle of multi-hour event (ghost block)
          <div
            className="w-full h-full border-l-4 opacity-30"
            style={{
              borderLeftColor: occupyingEvent.backgroundColor || "#3b82f6",
              backgroundColor: occupyingEvent.backgroundColor || "#3b82f6"
            }}
          />
        ) : (
          // Empty slot
          <button
            onClick={onSlotClick}
            className={`w-full h-full px-2 py-1 text-left group transition-colors ${
              isPendingMode
                ? "hover:bg-primary/10 hover:border-l-2 hover:border-primary"
                : "hover:bg-accent/50"
            }`}
          >
            <div className={`flex items-center gap-1 transition-opacity ${
              isPendingMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              <Plus className={`h-3 w-3 ${isPendingMode ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${isPendingMode ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {isPendingMode ? "Place here" : "Add"}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

interface PendingTaskPanelProps {
  pendingTask: PendingTask;
}

function PendingTaskPanel({ pendingTask }: PendingTaskPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full animate-pulse"
          style={{ backgroundColor: pendingTask.color }}
        />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Placement Mode</h3>
        <p className="text-xs text-muted-foreground px-4">
          Click any available time slot on the left to place:
        </p>
        <div className="px-3 py-2 rounded-lg bg-card border">
          <p className="text-sm font-medium">{pendingTask.title}</p>
        </div>
      </div>
      <div className="pt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          <span>Duration: 1 hour</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Start time: Your choice</span>
        </div>
      </div>
    </div>
  );
}

interface ActionPanelProps {
  selectedSlot: SelectedSlot | null;
  date: Date;
  onCreateEvent: (title: string, hour: number) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onCancel: () => void;
}

function ActionPanel({
  selectedSlot,
  date,
  onCreateEvent,
  onDeleteEvent,
  onCancel,
}: ActionPanelProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedSlot?.mode === "view" && selectedSlot.event) {
      setTitle(selectedSlot.event.title);
    } else {
      setTitle("");
    }
  }, [selectedSlot]);

  if (!selectedSlot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          Select a time slot to schedule
        </p>
      </div>
    );
  }

  const timeLabel = `${selectedSlot.hour.toString().padStart(2, "0")}:00`;

  if (selectedSlot.mode === "view" && selectedSlot.event) {
    // Event details view
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Event Details</h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <p className="text-sm font-medium mt-1">{selectedSlot.event.title}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Time</Label>
            <p className="text-sm mt-1">
              {formatDate(new Date(selectedSlot.event.start), "HH:mm")} -{" "}
              {formatDate(new Date(selectedSlot.event.end), "HH:mm")}
            </p>
          </div>

          {selectedSlot.event.extendedProps?.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1 text-muted-foreground">
                {selectedSlot.event.extendedProps.description}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => handleDeleteEvent(selectedSlot.event.id)}
          disabled={isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Event
        </Button>
      </div>
    );
  }

  // Create event form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateEvent(title.trim(), selectedSlot.hour);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">New Event @ {timeLabel}</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="event-title" className="text-xs text-muted-foreground">
            Event Title
          </Label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Meeting, Task, etc."
            className="mt-1"
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        <div className="rounded-lg bg-muted p-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Time:</span> {timeLabel} -{" "}
            {`${(selectedSlot.hour + 1).toString().padStart(2, "0")}:00`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-medium">Duration:</span> 1 hour
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={!title.trim() || isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </div>
  );

  async function handleDeleteEvent(eventId: string) {
    setIsSubmitting(true);
    try {
      await onDeleteEvent(eventId);
    } finally {
      setIsSubmitting(false);
    }
  }
}

// Helper functions
function parseTime(baseDate: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return formatDate(date, "HH:mm");
}

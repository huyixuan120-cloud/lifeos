"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable, type DateClickArg, type EventReceiveArg } from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, EventChangeArg } from "@fullcalendar/core";
import { useCalendar } from "@/hooks/use-calendar";
import { useTasks } from "@/hooks/use-tasks";
import { getGoogleCalendarEvents, type CalendarEvent } from "@/lib/googleCalendar";
import { Loader2, GripVertical, Calendar as CalendarIcon, Plus, X, Trash2, Clock, AlignLeft, MapPin, CheckSquare } from "lucide-react";
import { PRIORITY_COLORS } from "@/types/tasks";
import type { LifeOSTask } from "@/types/tasks";
import type { LifeOSEvent } from "@/types/calendar";
import { CalendarTaskSidebar } from "./CalendarTaskSidebar";
import { TaskCreateDialog } from "@/components/modules/tasks/TaskCreateDialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

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
  isUrgent?: boolean;
  isImportant?: boolean;
}

interface DayOverview {
  isOpen: boolean;
  date: Date | null;
}

interface SelectedSlot {
  hour: number;
  event?: any;
  mode: "create" | "view";
  startTime?: string; // Optional: For drag-to-create pre-filled times
  endTime?: string;   // Optional: For drag-to-create pre-filled times
}

interface PendingTask {
  title: string;
  color: string;
  isUrgent?: boolean;
  isImportant?: boolean;
}

// Google Calendar-style color palette
const EVENT_COLORS = [
  { name: "Lavanda", value: "#7986cb" },
  { name: "Salvia", value: "#33b679" },
  { name: "Uva", value: "#8e24aa" },
  { name: "Fiamma", value: "#e67c73" },
  { name: "Banana", value: "#f6c026" },
  { name: "Mandarino", value: "#f5511d" },
  { name: "Pavone", value: "#039be5" },
  { name: "Grafite", value: "#616161" },
];

export function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const taskContainerRef = useRef<HTMLDivElement>(null);
  const { events, isLoading, error, addEvent, updateEvent, deleteEvent } = useCalendar();
  const { tasks, addTask: createTask, updateTask: editTask } = useTasks();

  // Google Calendar Integration
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

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

  // Task Edit Dialog State
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LifeOSTask | null>(null);

  useEffect(() => {
    if (taskContainerRef.current) {
      const draggable = new Draggable(taskContainerRef.current, {
        itemSelector: ".draggable-task",
        eventData: function (eventEl) {
          const title = eventEl.getAttribute("data-title");
          const isUrgent = eventEl.getAttribute("data-urgent") === "true";
          const isImportant = eventEl.getAttribute("data-important") === "true";

          // Eisenhower Matrix Color Coding
          let color = "#9ca3af"; // Q4: Not Urgent, Not Important (Gray-400)
          if (isUrgent && isImportant) {
            color = "#ef4444"; // Q1: Urgent & Important (Red-500)
          } else if (!isUrgent && isImportant) {
            color = "#3b82f6"; // Q2: Important, Not Urgent (Blue-500)
          } else if (isUrgent && !isImportant) {
            color = "#eab308"; // Q3: Urgent, Not Important (Yellow-500)
          }

          return {
            title: title || "Untitled Task",
            backgroundColor: color,
            borderColor: color,
            textColor: "#ffffff",
            duration: { hours: 1 },
            color: color,
            extendedProps: {
              isUrgent,
              isImportant,
            },
          };
        },
      });

      return () => {
        draggable.destroy();
      };
    }
  }, [tasks]);

  // Fetch Google Calendar events on mount
  useEffect(() => {
    const fetchGoogleEvents = async () => {
      setIsLoadingGoogle(true);

      // Import isGoogleCalendarConnected to check auth status first
      const { isGoogleCalendarConnected } = await import("@/lib/googleCalendar");
      const isConnected = await isGoogleCalendarConnected();

      if (!isConnected) {
        // User hasn't connected Google Calendar - skip silently
        setIsLoadingGoogle(false);
        return;
      }

      const { events: googleCalendarEvents, error: googleError } = await getGoogleCalendarEvents();

      if (googleError) {
        console.warn("⚠️ Could not fetch Google Calendar events:", googleError);
        // Silently fail - user can still use local calendar
      } else if (googleCalendarEvents) {
        setGoogleEvents(googleCalendarEvents);
        console.log(`✅ Loaded ${googleCalendarEvents.length} Google Calendar events`);
      }

      setIsLoadingGoogle(false);
    };

    fetchGoogleEvents();
  }, []);

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
      isUrgent: event.extendedProps?.isUrgent ?? false,
      isImportant: event.extendedProps?.isImportant ?? false,
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
        isUrgent: draftEvent.isUrgent,
        isImportant: draftEvent.isImportant,
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

  // Task Edit Handler
  const handleEditTask = (task: LifeOSTask) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleTaskUpdate = async (taskData: any) => {
    if (!editingTask) return;

    await editTask({
      id: editingTask.id,
      title: taskData.title,
      priority: taskData.priority,
      due_date: taskData.due_date,
      is_urgent: taskData.is_urgent,
      is_important: taskData.is_important,
    });

    handleTaskDialogClose();
  };

  // Merge Google Calendar events with local events
  const mergedEvents = [
    ...events,
    ...googleEvents.map((gEvent) => ({
      id: `google-${gEvent.id}`,
      title: gEvent.title,
      start: gEvent.start,
      end: gEvent.end,
      backgroundColor: "#4285F4", // Google Blue
      borderColor: "#4285F4",
      textColor: "#ffffff",
      editable: false, // Google events are read-only
      extendedProps: {
        isGoogleEvent: true, // Mark as Google event
        description: gEvent.description || "",
      },
    })),
  ];

  const incompleteTasks = tasks.filter((task) => !task.is_completed);

  if (isLoading || isLoadingGoogle) {
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
                events={mergedEvents}
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
                eventContent={(eventInfo) => {
                  const event = eventInfo.event;
                  const isGoogleEvent = event.extendedProps?.isGoogleEvent ?? false;
                  const isUrgent = event.extendedProps?.isUrgent ?? false;
                  const isImportant = event.extendedProps?.isImportant ?? false;

                  // Determine icon based on event type and quadrant
                  let icon = "";
                  if (isGoogleEvent) {
                    // Google Calendar event - show Google logo
                    icon = "📅"; // Calendar emoji or could use SVG
                  } else if (isUrgent && isImportant) {
                    icon = "🔥"; // Q1
                  } else if (!isUrgent && isImportant) {
                    icon = "💎"; // Q2
                  } else if (isUrgent && !isImportant) {
                    icon = "⚡"; // Q3
                  }

                  return (
                    <div className="flex items-center gap-1 px-2 py-1 overflow-hidden w-full">
                      {icon && <span className="text-xs flex-shrink-0">{icon}</span>}
                      {isGoogleEvent && (
                        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#ffffff"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#ffffff"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#ffffff"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#ffffff"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate text-white">
                          {eventInfo.timeText && (
                            <span className="mr-1">{eventInfo.timeText}</span>
                          )}
                          {event.title}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* Enhanced Task Sidebar with Priority Sections */}
            <div ref={taskContainerRef}>
              <CalendarTaskSidebar
                tasks={incompleteTasks}
                onEditTask={handleEditTask}
              />
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
        events={mergedEvents}
        pendingTask={pendingTaskToSchedule}
        onClose={() => {
          setDayOverview({ isOpen: false, date: null });
          setPendingTaskToSchedule(null);
        }}
        onAddEvent={addEvent}
        onDeleteEvent={deleteEvent}
      />

      {/* Task Edit Dialog */}
      <TaskCreateDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        initialData={editingTask}
        mode={editingTask ? "edit" : "create"}
        onSubmit={handleTaskUpdate}
        onAdd={createTask}
        trigger={<span style={{ display: 'none' }} />}
      />
    </>
  );
}

function TaskCard({ task }: { task: LifeOSTask }) {
  const priorityInfo = PRIORITY_COLORS[task.priority];

  // Determine Eisenhower quadrant color
  const isUrgent = task.is_urgent ?? false;
  const isImportant = task.is_important ?? false;

  let quadrantColor = "#9ca3af"; // Q4: Gray
  let quadrantIcon = "🗑️";
  if (isUrgent && isImportant) {
    quadrantColor = "#ef4444"; // Q1: Red
    quadrantIcon = "🔥";
  } else if (!isUrgent && isImportant) {
    quadrantColor = "#3b82f6"; // Q2: Blue
    quadrantIcon = "💎";
  } else if (isUrgent && !isImportant) {
    quadrantColor = "#eab308"; // Q3: Yellow
    quadrantIcon = "⚡";
  }

  return (
    <div
      className="draggable-task p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-move transition-colors"
      data-title={task.title}
      data-color={priorityInfo.bg}
      data-urgent={isUrgent.toString()}
      data-important={isImportant.toString()}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Eisenhower Quadrant Icon */}
            <span className="text-sm flex-shrink-0" title={`${isUrgent ? 'Urgent' : 'Not Urgent'} & ${isImportant ? 'Important' : 'Not Important'}`}>
              {quadrantIcon}
            </span>
            <p className="text-sm font-medium truncate">{task.title}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: quadrantColor }}
              title={`Quadrant: ${isUrgent && isImportant ? 'Do First' : !isUrgent && isImportant ? 'Schedule' : isUrgent && !isImportant ? 'Delegate' : 'Eliminate'}`}
            />
            <p className="text-xs text-muted-foreground">
              {priorityInfo.label}
            </p>
          </div>
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

  // Drag-to-Create State (with 5-minute precision)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [dragStartMinute, setDragStartMinute] = useState<number>(0);
  const [dragEndHour, setDragEndHour] = useState<number | null>(null);
  const [dragEndMinute, setDragEndMinute] = useState<number>(0);

  // Time Cursor State (floating badge on left axis)
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorTime, setCursorTime] = useState<string>("00:00");
  const [cursorTop, setCursorTop] = useState<number>(0); // Percentage (0-100)
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Drag-to-Create: Mouse Up Handler (wrapped in useCallback to avoid recreating on every render)
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStartHour !== null && dragEndHour !== null) {
      // Calculate final start/end with minute precision (handle upward drag)
      const startTotalMinutes = dragStartHour * 60 + dragStartMinute;
      const endTotalMinutes = dragEndHour * 60 + dragEndMinute;

      const finalStartMinutes = Math.min(startTotalMinutes, endTotalMinutes);
      const finalEndMinutes = Math.max(startTotalMinutes, endTotalMinutes);

      const finalStartHour = Math.floor(finalStartMinutes / 60);
      const finalStartMin = finalStartMinutes % 60;
      const finalEndHour = Math.floor(finalEndMinutes / 60);
      const finalEndMin = finalEndMinutes % 60;

      // Set selectedSlot with precise time range
      setSelectedSlot({
        hour: finalStartHour,
        mode: "create",
        startTime: `${finalStartHour.toString().padStart(2, "0")}:${finalStartMin.toString().padStart(2, "0")}`,
        endTime: `${finalEndHour.toString().padStart(2, "0")}:${finalEndMin.toString().padStart(2, "0")}`,
      });
    }

    // Reset drag state
    setIsDragging(false);
    setDragStartHour(null);
    setDragStartMinute(0);
    setDragEndHour(null);
    setDragEndMinute(0);
  }, [isDragging, dragStartHour, dragStartMinute, dragEndHour, dragEndMinute]);

  // Attach mouseup listener to window (MUST be before early return!)
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

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

  // Global Mouse Move Handler (container-based tracking)
  const handleGlobalMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;

    const container = timelineContainerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const containerHeight = rect.height;

    // Calculate percentage (0-1)
    const pct = Math.max(0, Math.min(1, offsetY / containerHeight));

    // Calculate total minutes in 24 hours
    const rawMinutes = pct * 24 * 60;

    // Snap to 5-minute intervals
    const snappedMinutes = Math.round(rawMinutes / 5) * 5;

    // Convert back to HH:MM
    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // Convert back to percentage for positioning
    const topPercent = (snappedMinutes / (24 * 60)) * 100;

    // Update cursor state
    setCursorVisible(true);
    setCursorTime(timeString);
    setCursorTop(topPercent);

    // If dragging, update drag end state
    if (isDragging) {
      setDragEndHour(hours);
      setDragEndMinute(minutes);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pendingTask || !timelineContainerRef.current) return;

    const container = timelineContainerRef.current;
    const rect = container.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const containerHeight = rect.height;

    const pct = Math.max(0, Math.min(1, offsetY / containerHeight));
    const rawMinutes = pct * 24 * 60;
    const snappedMinutes = Math.round(rawMinutes / 5) * 5;
    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;

    setIsDragging(true);
    setDragStartHour(hours);
    setDragStartMinute(minutes);
    setDragEndHour(hours);
    setDragEndMinute(minutes);
  };

  // Check if hour is in drag selection range
  const isHourInDragRange = (hour: number) => {
    if (!isDragging || dragStartHour === null || dragEndHour === null) {
      return false;
    }
    const min = Math.min(dragStartHour, dragEndHour);
    const max = Math.max(dragStartHour, dragEndHour);
    return hour >= min && hour <= max;
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
    color: string;
  }) => {
    const [startHour, startMinute] = eventData.startTime.split(":").map(Number);
    const [endHour, endMinute] = eventData.endTime.split(":").map(Number);

    let startDate = new Date(date);
    startDate = setHours(startDate, startHour);
    startDate = setMinutes(startDate, startMinute);
    startDate = setSeconds(startDate, 0);

    let endDate = new Date(date);
    endDate = setHours(endDate, endHour);
    endDate = setMinutes(endDate, endMinute);
    endDate = setSeconds(endDate, 0);

    // If end time is before start time, assume it's the next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    await onAddEvent({
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      all_day: eventData.allDay,
      background_color: eventData.color,
      border_color: eventData.color,
      text_color: "#ffffff",
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
      <DialogContent className="sm:max-w-[900px] w-full h-[600px] flex flex-col p-0 overflow-hidden border-2 border-gray-300 shadow-2xl rounded-2xl">
        {/* Hidden Title for Accessibility */}
        <DialogTitle className="sr-only">{formattedDate}</DialogTitle>

        {/* Main Layout - Flexbox 60/40 Split */}
        <div className="flex h-full overflow-hidden">
          {/* Left Panel - Timeline (60%) - FIXED HEIGHT, NO SCROLL */}
          <div className="w-[60%] h-full flex flex-col border-r border-gray-200 overflow-hidden bg-gray-50/30 pl-8 pr-4">
            {/* Timeline Header - Compact */}
            <div className="bg-white border-b border-gray-100 py-3 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-600" />
                {formattedDate}
              </h2>
              {pendingTask && (
                <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: pendingTask.color }}
                  />
                  <p className="text-[10px] font-medium text-blue-700">
                    Click a slot: <span className="font-semibold">{pendingTask.title}</span>
                  </p>
                </div>
              )}
              {!pendingTask && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Timeline Slots - Flex-1 to fill remaining space */}
            <div
              ref={timelineContainerRef}
              className="flex-1 flex flex-col relative"
              onMouseMove={handleGlobalMouseMove}
              onMouseDown={handleMouseDown}
              onMouseLeave={() => setCursorVisible(false)}
            >
              {hours.map((hour) => {
                const eventAtStart = getEventAtHour(hour);
                const occupyingEvent = getOccupyingEvent(hour);
                const isOccupied = isHourOccupied(hour);
                const isInDragRange = isHourInDragRange(hour);

                return (
                  <TimelineSlot
                    key={hour}
                    hour={hour}
                    eventAtStart={eventAtStart}
                    occupyingEvent={occupyingEvent}
                    isOccupied={isOccupied}
                    isPendingMode={!!pendingTask}
                    isInDragRange={isInDragRange}
                    isDragging={isDragging}
                    onSlotClick={() => handleSlotClick(hour)}
                    onEventClick={handleEventClick}
                  />
                );
              })}

              {/* THE MOVING TIME CURSOR - Floating badge + crosshair line */}
              {cursorVisible && !pendingTask && (
                <div
                  className="absolute left-0 w-full flex items-center pointer-events-none z-50"
                  style={{ top: `${cursorTop}%` }}
                >
                  {/* The Moving Number Badge */}
                  <div className="bg-indigo-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-r w-12 text-center shadow-md">
                    {cursorTime}
                  </div>
                  {/* The Crosshair Line */}
                  <div className="h-px bg-indigo-600 w-full opacity-30" />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Form (40%) */}
          <div className="w-[40%] bg-white h-full overflow-y-auto relative">
            {/* Inner Content Wrapper with HEAVY Padding */}
            <div className="p-8 pl-10 h-full flex flex-col">
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
  isInDragRange: boolean;
  isDragging: boolean;
  onSlotClick: () => void;
  onEventClick: (event: any) => void;
}

function TimelineSlot({
  hour,
  eventAtStart,
  occupyingEvent,
  isOccupied,
  isPendingMode,
  isInDragRange,
  isDragging,
  onSlotClick,
  onEventClick,
}: TimelineSlotProps) {
  const timeLabel = `${hour.toString().padStart(2, "0")}:00`;

  return (
    <div className="flex-1 flex border-b last:border-b-0 min-h-0">
      {/* Time Label - Compact */}
      <div className="w-10 flex-shrink-0 flex items-center justify-center border-r bg-white/50">
        <span className="text-[10px] font-medium text-gray-400">
          {timeLabel}
        </span>
      </div>

      {/* Content - Fills remaining space */}
      <div className="flex-1 relative min-h-0">
        {eventAtStart ? (
          // Event starts here - Ultra compact
          <button
            onClick={() => onEventClick(eventAtStart)}
            className="w-full h-full px-1.5 py-0.5 text-left border-l-2 hover:bg-white transition-colors flex flex-col justify-center"
            style={{ borderLeftColor: eventAtStart.backgroundColor || "#3b82f6" }}
          >
            <p className="text-[10px] font-medium truncate leading-tight">{eventAtStart.title}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">
              {formatDate(new Date(eventAtStart.start), "HH:mm")}
            </p>
          </button>
        ) : occupyingEvent ? (
          // Middle of multi-hour event (ghost block)
          <div
            className="w-full h-full border-l-2 opacity-20"
            style={{
              borderLeftColor: occupyingEvent.backgroundColor || "#3b82f6",
              backgroundColor: occupyingEvent.backgroundColor || "#3b82f6"
            }}
          />
        ) : (
          // Empty slot - Compact hover state + Drag-to-Create (5-min precision, global tracking)
          <button
            onClick={onSlotClick}
            className={`w-full h-full px-1.5 text-left group transition-all flex items-center relative ${
              isInDragRange
                ? "bg-blue-100 border-l-4 border-blue-500"
                : isPendingMode
                ? "hover:bg-blue-50 hover:border-l-2 hover:border-primary"
                : "hover:bg-white"
            } ${isDragging ? "cursor-ns-resize select-none" : "cursor-pointer"}`}
          >
            {isInDragRange && (
              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
            )}
            <div className={`flex items-center gap-0.5 transition-opacity ${
              isInDragRange
                ? "opacity-100"
                : isPendingMode
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            }`}>
              <Plus className={`h-2.5 w-2.5 ${
                isInDragRange
                  ? "text-blue-600"
                  : isPendingMode
                  ? "text-primary"
                  : "text-muted-foreground"
              }`} />
              <span className={`text-[9px] ${
                isInDragRange
                  ? "text-blue-600 font-medium"
                  : isPendingMode
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}>
                {isInDragRange ? "Selected" : isPendingMode ? "Place" : "Add"}
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
  onCreateEvent: (eventData: {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
    color: string;
  }) => Promise<void>;
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
  const [tabType, setTabType] = useState<"event" | "task">("event");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedColor, setSelectedColor] = useState(EVENT_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedSlot?.mode === "view" && selectedSlot.event) {
      setTitle(selectedSlot.event.title);
      setDescription(selectedSlot.event.extendedProps?.description || "");
      setLocation(selectedSlot.event.extendedProps?.location || "");
      setSelectedColor(selectedSlot.event.backgroundColor || EVENT_COLORS[0].value);
      const start = new Date(selectedSlot.event.start);
      const end = new Date(selectedSlot.event.end);
      setStartTime(formatDate(start, "HH:mm"));
      setEndTime(formatDate(end, "HH:mm"));
      setAllDay(selectedSlot.event.allDay || false);
    } else if (selectedSlot) {
      setTitle("");
      setDescription("");
      setLocation("");
      setAllDay(false);

      // Use drag-to-create times if available, otherwise default to hour + 1
      if (selectedSlot.startTime && selectedSlot.endTime) {
        setStartTime(selectedSlot.startTime);
        setEndTime(selectedSlot.endTime);
      } else {
        const hour = selectedSlot.hour;
        setStartTime(`${hour.toString().padStart(2, "0")}:00`);
        setEndTime(`${(hour + 1).toString().padStart(2, "0")}:00`);
      }

      setSelectedColor(EVENT_COLORS[0].value);
    }
  }, [selectedSlot]);

  if (!selectedSlot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <CalendarIcon className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-base text-gray-500 font-light">
          Seleziona uno slot per iniziare
        </p>
      </div>
    );
  }

  if (selectedSlot.mode === "view" && selectedSlot.event) {
    // Event details view - Minimalist design
    return (
      <div className="h-full flex flex-col space-y-6">
        <div className="flex-1 space-y-5 overflow-y-auto">
          {/* Title - Large and clean */}
          <div>
            <p className="text-2xl font-medium">{selectedSlot.event.title}</p>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <p className="text-sm">
              {formatDate(new Date(selectedSlot.event.start), "HH:mm")} -{" "}
              {formatDate(new Date(selectedSlot.event.end), "HH:mm")}
            </p>
          </div>

          {/* Description */}
          {selectedSlot.event.extendedProps?.description && (
            <div className="flex items-start gap-3 text-muted-foreground">
              <AlignLeft className="h-5 w-5 mt-0.5" />
              <p className="text-sm">{selectedSlot.event.extendedProps.description}</p>
            </div>
          )}

          {/* Location */}
          {selectedSlot.event.extendedProps?.location && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <p className="text-sm">{selectedSlot.event.extendedProps.location}</p>
            </div>
          )}
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => handleDeleteEvent(selectedSlot.event.id)}
          disabled={isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Elimina evento
        </Button>
      </div>
    );
  }

  // Create form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // For now, create as event regardless of tab
      // TODO: Implement task creation when task hook is available
      await onCreateEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime,
        endTime,
        allDay,
        color: selectedColor,
      });
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleDeleteEvent(eventId: string) {
    setIsSubmitting(true);
    try {
      await onDeleteEvent(eventId);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Tabs Header - Clean & Professional */}
      <Tabs value={tabType} onValueChange={(v) => setTabType(v as "event" | "task")} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-transparent border-b rounded-none h-auto p-0">
          <TabsTrigger
            value="event"
            className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none py-3 font-medium text-sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Eventi
          </TabsTrigger>
          <TabsTrigger
            value="task"
            className="data-[state=active]:bg-transparent data-[state=active]:text-green-600 data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:shadow-none rounded-none py-3 font-medium text-sm"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Attività
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tabType} className="flex-1 overflow-y-auto mt-0 data-[state=active]:flex data-[state=active]:flex-col">
          {/* Title Input - Large & Clean */}
          <div className="pt-6 pb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Aggiungi titolo"
              className="text-2xl font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-gray-300"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Time Section */}
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 flex justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 text-sm border-0 bg-gray-50 hover:bg-gray-100 focus-visible:ring-0 focus-visible:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors font-medium"
                  disabled={allDay || isSubmitting}
                />
                <span className="text-gray-400 font-medium">—</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 text-sm border-0 bg-gray-50 hover:bg-gray-100 focus-visible:ring-0 focus-visible:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors font-medium"
                  disabled={allDay || isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 ml-8">
              <Checkbox
                id="all-day"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(checked as boolean)}
                disabled={isSubmitting}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="all-day" className="text-sm cursor-pointer text-gray-700 font-normal">
                Tutto il giorno
              </Label>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Details Section */}
          <div className="py-4 space-y-4">
            {/* Description */}
            <div className="flex items-start gap-3">
              <div className="w-8 flex justify-center flex-shrink-0 pt-3">
                <AlignLeft className="h-5 w-5 text-gray-500" />
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aggiungi descrizione"
                className="flex-1 min-h-[90px] resize-none border-0 bg-gray-50 hover:bg-gray-100 focus-visible:ring-0 focus-visible:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors placeholder:text-gray-400 text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="w-8 flex justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-gray-500" />
              </div>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Aggiungi luogo"
                className="flex-1 border-0 bg-gray-50 hover:bg-gray-100 focus-visible:ring-0 focus-visible:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors placeholder:text-gray-400 text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Color Picker Section */}
          <div className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 mb-3">Colore</p>
                <div className="flex gap-2.5 flex-wrap">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        selectedColor === color.value
                          ? "ring-2 ring-offset-2 scale-105 shadow-md"
                          : "hover:scale-105 opacity-90 hover:opacity-100 shadow-sm"
                      }`}
                      style={{
                        backgroundColor: color.value,
                      }}
                      title={color.name}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1 min-h-4" />
        </TabsContent>
      </Tabs>

      {/* Action Buttons - Professional */}
      <div className="flex justify-between items-center gap-3 pt-4 pb-2 border-t bg-white/50">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4"
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            "Salva"
          )}
        </Button>
      </div>
    </form>
  );
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

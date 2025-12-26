"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check } from "lucide-react";
import { EVENT_COLORS, DEFAULT_EVENT_COLOR } from "@/constants/colors";
import { cn } from "@/lib/utils";

/**
 * Helper function to format Date to datetime-local input format
 * Format: YYYY-MM-DDThh:mm
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Helper function to parse datetime-local input to ISO string
 */
export function parseInputToISO(dateString: string): string {
  return new Date(dateString).toISOString();
}

// Zod schema for event form validation
const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be less than 255 characters"),
    description: z.string().optional(),
    start: z.string().min(1, "Start date is required"),
    end: z.string().min(1, "End date is required"),
    all_day: z.boolean().optional(),
    background_color: z.string().optional(),
  })
  .refine(
    (data) => {
      // Ensure end is after start
      const startDate = new Date(data.start);
      const endDate = new Date(data.end);
      return endDate >= startDate;
    },
    {
      message: "End date must be after start date",
      path: ["end"],
    }
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

export interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  initialData?: Partial<EventFormValues>;
  mode?: "create" | "edit";
}

/**
 * EventDialog Component
 *
 * A modal dialog for creating and editing calendar events.
 * Uses react-hook-form with zod validation for form handling.
 *
 * @example
 * ```tsx
 * <EventDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={async (data) => {
 *     await addEvent({
 *       title: data.title,
 *       start: parseInputToISO(data.start),
 *       end: parseInputToISO(data.end),
 *       all_day: data.all_day,
 *       description: data.description,
 *     });
 *   }}
 *   initialData={{
 *     start: formatDateForInput(new Date()),
 *     end: formatDateForInput(new Date()),
 *   }}
 *   mode="create"
 * />
 * ```
 */
export function EventDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  mode = "create",
}: EventDialogProps) {
  const isEditMode = mode === "edit" || !!initialData?.title;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      start: initialData?.start || formatDateForInput(new Date()),
      end: initialData?.end || formatDateForInput(new Date(Date.now() + 3600000)), // +1 hour
      all_day: initialData?.all_day || false,
      background_color: initialData?.background_color || DEFAULT_EVENT_COLOR.hex,
    },
  });

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: initialData?.title || "",
        description: initialData?.description || "",
        start: initialData?.start || formatDateForInput(new Date()),
        end: initialData?.end || formatDateForInput(new Date(Date.now() + 3600000)),
        all_day: initialData?.all_day || false,
        background_color: initialData?.background_color || DEFAULT_EVENT_COLOR.hex,
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: EventFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Form will stay open on error
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );

    if (confirmed) {
      try {
        await onDelete();
        onClose();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your event."
              : "Create a new event for your calendar."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Event title"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about this event..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes or details for this event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Picker */}
            <FormField
              control={form.control}
              name="background_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {EVENT_COLORS.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => field.onChange(color.hex)}
                          className={cn(
                            "relative w-8 h-8 rounded-full transition-all",
                            "hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-ring",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
                            field.value === color.hex && "ring-2 ring-offset-2 ring-ring scale-110"
                          )}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                          aria-label={`Select ${color.name} color`}
                        >
                          {field.value === color.hex && (
                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a color to categorize your event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All Day Checkbox */}
            <FormField
              control={form.control}
              name="all_day"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>All-day event</FormLabel>
                    <FormDescription>
                      This event lasts the entire day
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Start Date/Time */}
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date/Time */}
            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {/* Delete Button (only in edit mode) */}
              {isEditMode && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="sm:mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}

              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>

              {/* Save Button */}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

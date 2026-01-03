"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RECURRENCE_PRESETS,
  generateRRule,
  type RecurrencePreset,
  type RecurrenceEndType,
} from "@/lib/recurrence";
import { CustomRecurrenceDialog } from "./CustomRecurrenceDialog";

/**
 * NUOVA STRATEGIA TIMEZONE - APPROCCIO SEMPLICE E ROBUSTO
 *
 * 1. datetime-local input produce: "2025-12-29T14:00" (no timezone)
 * 2. Noi interpretiamo come ora LOCALE Milano
 * 3. Convertiamo esplicitamente a UTC per salvare nel DB
 * 4. DB salva sempre UTC (standard)
 * 5. Quando leggiamo, convertiamo da UTC a locale Milano
 */

/**
 * Converte datetime-local string (locale Milano) → ISO UTC per database
 *
 * @param localDateTimeString - "2025-12-29T14:00" dall'input
 * @returns "2025-12-29T13:00:00.000Z" (UTC per DB)
 */
export function localToUTC(localDateTimeString: string): string {
  // Input: "2025-12-29T14:00" (Milano)
  // Parse come LOCAL time (Milano)
  const [datePart, timePart] = localDateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = (timePart || '00:00').split(':').map(Number);

  // Crea Date specificando esplicitamente i componenti LOCAL
  // Questo interpreta l'ora come LOCAL time del browser (Milano)
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // toISOString() converte automaticamente a UTC
  // Es: 14:00 Milano (UTC+1) → 13:00 UTC
  const utcString = localDate.toISOString();

  console.log("🔍 localToUTC:", {
    input: localDateTimeString,
    localDate: localDate.toString(),
    output: utcString,
  });

  return utcString;
}

/**
 * Converte ISO UTC dal database → datetime-local format (locale)
 *
 * @param utcInput - "2025-12-29T13:00:00+00:00" (string) o Date object dal DB/FullCalendar
 * @returns "2025-12-29T14:00" per input datetime-local
 */
export function utcToLocal(utcInput: string | Date): string {
  // Converte a Date object se è una stringa
  const date = typeof utcInput === 'string' ? new Date(utcInput) : utcInput;

  // Estrai componenti in LOCAL time del browser
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const result = `${year}-${month}-${day}T${hours}:${minutes}`;

  console.log("🔍 utcToLocal:", {
    input: typeof utcInput === 'string' ? utcInput : utcInput.toISOString(),
    inputType: typeof utcInput,
    date: date.toString(),
    output: result,
  });

  return result;
}

// Alias per backward compatibility
export const formatDateForInput = utcToLocal;
export const parseInputToISO = localToUTC;

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
    recurrence_preset: z.string().optional(),
    recurrence_end_type: z.enum(['NEVER', 'ON_DATE', 'AFTER_COUNT']).optional(),
    recurrence_end_date: z.string().optional(),
    recurrence_end_count: z.number().min(1).max(999).optional(),
    recurrence_custom: z.string().optional(),
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

  // State for custom recurrence dialog
  const [customRecurrenceDialogOpen, setCustomRecurrenceDialogOpen] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      start: initialData?.start || formatDateForInput(new Date()),
      end: initialData?.end || formatDateForInput(new Date(Date.now() + 3600000)), // +1 hour
      all_day: initialData?.all_day || false,
      background_color: initialData?.background_color || DEFAULT_EVENT_COLOR.hex,
      recurrence_preset: 'NONE',
      recurrence_end_type: 'NEVER',
      recurrence_end_date: '',
      recurrence_end_count: 1,
      recurrence_custom: '',
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
        recurrence_preset: 'NONE',
        recurrence_end_type: 'NEVER',
        recurrence_end_date: '',
        recurrence_end_count: 1,
        recurrence_custom: '',
      });
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (data: EventFormValues) => {
    try {
      // Generate RRULE string from preset or use custom
      let rruleString: string | null = null;

      if (data.recurrence_preset && data.recurrence_preset !== 'NONE') {
        if (data.recurrence_preset === 'CUSTOM') {
          rruleString = data.recurrence_custom || null;
        } else {
          const startDate = new Date(data.start);
          const endType = data.recurrence_end_type || 'NEVER';
          const endValue = endType === 'ON_DATE'
            ? data.recurrence_end_date
            : endType === 'AFTER_COUNT'
            ? data.recurrence_end_count
            : undefined;

          rruleString = generateRRule(
            data.recurrence_preset as RecurrencePreset,
            startDate,
            endType as RecurrenceEndType,
            endValue
          );
        }
      }

      // Submit with generated RRULE and properly formatted dates
      await onSubmit({
        ...data,
        start: parseInputToISO(data.start),
        end: parseInputToISO(data.end),
        recurrence: rruleString,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      // Form will stay open on error
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
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

            {/* Recurrence Dropdown */}
            <FormField
              control={form.control}
              name="recurrence_preset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ripeti</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Non si ripete" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRENCE_PRESETS.map((preset) => {
                        // Dynamic label generation based on start date
                        let label = preset.label;
                        const startDateValue = form.watch('start');
                        if (startDateValue) {
                          const startDate = new Date(startDateValue);

                          if (preset.value === 'WEEKLY') {
                            const weekdayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
                            label = `Ogni settimana di ${weekdayNames[startDate.getDay()]}`;
                          } else if (preset.value === 'MONTHLY') {
                            const dayOfMonth = startDate.getDate();
                            const ordinal = Math.ceil(dayOfMonth / 7);
                            const ordinalNames = ['primo', 'secondo', 'terzo', 'quarto', 'quinto'];
                            const weekdayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
                            if (ordinal <= 5) {
                              label = `Ogni mese il ${ordinalNames[ordinal - 1]} ${weekdayNames[startDate.getDay()]}`;
                            }
                          } else if (preset.value === 'YEARLY') {
                            const dateStr = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
                            label = `Ogni anno il ${dateStr}`;
                          }
                        }

                        return (
                          <SelectItem key={preset.value} value={preset.value}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Imposta la frequenza di ripetizione dell'evento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence End Type (conditional) */}
            {form.watch('recurrence_preset') && form.watch('recurrence_preset') !== 'NONE' && form.watch('recurrence_preset') !== 'CUSTOM' && (
              <FormField
                control={form.control}
                name="recurrence_end_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termina</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || 'NEVER'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NEVER">Mai</SelectItem>
                        <SelectItem value="ON_DATE">Il...</SelectItem>
                        <SelectItem value="AFTER_COUNT">Dopo...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Quando termina la ricorrenza
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Recurrence End Date (conditional) */}
            {form.watch('recurrence_end_type') === 'ON_DATE' && (
              <FormField
                control={form.control}
                name="recurrence_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data fine ricorrenza</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      L'evento terminerà dopo questa data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Recurrence End Count (conditional) */}
            {form.watch('recurrence_end_type') === 'AFTER_COUNT' && (
              <FormField
                control={form.control}
                name="recurrence_end_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di occorrenze</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      L'evento si ripeterà questo numero di volte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Custom Recurrence Builder (conditional) */}
            {form.watch('recurrence_preset') === 'CUSTOM' && (
              <FormField
                control={form.control}
                name="recurrence_custom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ricorrenza personalizzata</FormLabel>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setCustomRecurrenceDialogOpen(true)}
                      >
                        {field.value
                          ? `RRULE configurata: ${field.value.substring(0, 30)}${field.value.length > 30 ? '...' : ''}`
                          : "Configura ricorrenza personalizzata..."}
                      </Button>
                    </FormControl>
                    <FormDescription>
                      Clicca per aprire il builder visuale
                    </FormDescription>
                    <FormMessage />

                    {/* Custom Recurrence Dialog */}
                    <CustomRecurrenceDialog
                      open={customRecurrenceDialogOpen}
                      onOpenChange={setCustomRecurrenceDialogOpen}
                      onSave={(rrule) => {
                        field.onChange(rrule);
                      }}
                      initialRRule={field.value}
                      startDate={new Date(form.watch('start'))}
                    />
                  </FormItem>
                )}
              />
            )}

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
                      value={field.value}
                      onChange={(e) => {
                        console.log("🔍 DEBUG Input onChange:", {
                          rawValue: e.target.value,
                          valueType: typeof e.target.value,
                        });
                        field.onChange(e.target.value);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
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
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
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

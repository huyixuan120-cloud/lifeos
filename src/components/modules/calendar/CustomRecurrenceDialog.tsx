"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/**
 * Custom Recurrence Dialog Component
 *
 * Visual builder for custom recurring event rules (RRULE format)
 * Provides Google Calendar-style interface for defining recurrence patterns
 */

interface CustomRecurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rrule: string) => void;
  initialRRule?: string | null;
  startDate?: Date;
}

interface CustomRecurrenceState {
  interval: number; // 1-99
  frequency: "DAY" | "WEEK" | "MONTH" | "YEAR";
  weekdays: number[]; // [0-6] domenica=0, lunedì=1, ...
  endType: "NEVER" | "ON_DATE" | "AFTER_COUNT";
  endDate: string; // ISO date string (YYYY-MM-DD)
  endCount: number; // 1-999
}

// Mapping from day index to RRULE weekday codes
const WEEKDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Italian weekday labels (short)
const WEEKDAY_LABELS = ["D", "L", "M", "M", "G", "V", "S"];
const WEEKDAY_FULL_LABELS = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

export function CustomRecurrenceDialog({
  open,
  onOpenChange,
  onSave,
  initialRRule,
  startDate = new Date(),
}: CustomRecurrenceDialogProps) {
  // Initialize state
  const [state, setState] = useState<CustomRecurrenceState>(() => {
    // Parse initialRRule if provided, otherwise use defaults
    if (initialRRule) {
      return parseRRuleToState(initialRRule, startDate);
    }
    return {
      interval: 1,
      frequency: "WEEK",
      weekdays: [startDate.getDay()], // Default to start date's weekday
      endType: "NEVER",
      endDate: "",
      endCount: 10,
    };
  });

  // Update state handlers
  const updateInterval = (value: string) => {
    const num = parseInt(value) || 1;
    setState((prev) => ({ ...prev, interval: Math.max(1, Math.min(99, num)) }));
  };

  const updateFrequency = (value: string) => {
    setState((prev) => ({
      ...prev,
      frequency: value as "DAY" | "WEEK" | "MONTH" | "YEAR",
    }));
  };

  const toggleWeekday = (dayIndex: number) => {
    setState((prev) => {
      const weekdays = prev.weekdays.includes(dayIndex)
        ? prev.weekdays.filter((d) => d !== dayIndex)
        : [...prev.weekdays, dayIndex].sort();

      // Ensure at least one day is selected
      if (weekdays.length === 0) {
        return prev;
      }

      return { ...prev, weekdays };
    });
  };

  const updateEndType = (value: string) => {
    setState((prev) => ({
      ...prev,
      endType: value as "NEVER" | "ON_DATE" | "AFTER_COUNT",
    }));
  };

  const updateEndDate = (value: string) => {
    setState((prev) => ({ ...prev, endDate: value }));
  };

  const updateEndCount = (value: string) => {
    const num = parseInt(value) || 1;
    setState((prev) => ({
      ...prev,
      endCount: Math.max(1, Math.min(999, num)),
    }));
  };

  // Convert state to RRULE string
  const handleSave = () => {
    const rrule = customRecurrenceToRRule(state);
    onSave(rrule);
    onOpenChange(false);
  };

  // Get frequency label (singular)
  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "DAY":
        return state.interval === 1 ? "giorno" : "giorni";
      case "WEEK":
        return state.interval === 1 ? "settimana" : "settimane";
      case "MONTH":
        return state.interval === 1 ? "mese" : "mesi";
      case "YEAR":
        return state.interval === 1 ? "anno" : "anni";
      default:
        return "giorno";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ricorrenza personalizzata</DialogTitle>
          <DialogDescription>
            Definisci la regola di ricorrenza per questo evento
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Frequency and Interval */}
          <div className="space-y-2">
            <Label>Ripeti ogni</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="99"
                value={state.interval}
                onChange={(e) => updateInterval(e.target.value)}
                className="w-20"
              />
              <Select
                value={state.frequency}
                onValueChange={updateFrequency}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY">
                    {getFrequencyLabel("DAY")}
                  </SelectItem>
                  <SelectItem value="WEEK">
                    {getFrequencyLabel("WEEK")}
                  </SelectItem>
                  <SelectItem value="MONTH">
                    {getFrequencyLabel("MONTH")}
                  </SelectItem>
                  <SelectItem value="YEAR">
                    {getFrequencyLabel("YEAR")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekday Selector (only for WEEK frequency) */}
          {state.frequency === "WEEK" && (
            <div className="space-y-2">
              <Label>Si ripete il</Label>
              <div className="flex gap-2">
                {WEEKDAY_LABELS.map((label, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleWeekday(index)}
                    className={cn(
                      "h-10 w-10 rounded-full border-2 text-sm font-medium transition-colors",
                      state.weekdays.includes(index)
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    )}
                    title={WEEKDAY_FULL_LABELS[index]}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {state.weekdays.length === 0 && (
                <p className="text-sm text-red-600">
                  Seleziona almeno un giorno
                </p>
              )}
            </div>
          )}

          {/* End Type */}
          <div className="space-y-3">
            <Label>Fine</Label>
            <RadioGroup value={state.endType} onValueChange={updateEndType}>
              {/* Never */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NEVER" id="end-never" />
                <Label htmlFor="end-never" className="font-normal">
                  Mai
                </Label>
              </div>

              {/* On Date */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ON_DATE" id="end-date" />
                <Label htmlFor="end-date" className="font-normal">
                  Data:
                </Label>
                <Input
                  type="date"
                  value={state.endDate}
                  onChange={(e) => updateEndDate(e.target.value)}
                  disabled={state.endType !== "ON_DATE"}
                  className="flex-1"
                  min={
                    new Date().toISOString().split("T")[0]
                  } // Min date = today
                />
              </div>

              {/* After Count */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AFTER_COUNT" id="end-count" />
                <Label htmlFor="end-count" className="font-normal">
                  Dopo:
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={state.endCount}
                  onChange={(e) => updateEndCount(e.target.value)}
                  disabled={state.endType !== "AFTER_COUNT"}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">occorrenze</span>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={state.weekdays.length === 0 && state.frequency === "WEEK"}>
            Fine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Convert CustomRecurrenceState to RRULE string
 *
 * @param state - The custom recurrence state
 * @returns RRULE string (without RRULE: prefix)
 *
 * @example
 * customRecurrenceToRRule({
 *   interval: 2,
 *   frequency: 'WEEK',
 *   weekdays: [1, 3, 5],
 *   endType: 'AFTER_COUNT',
 *   endCount: 10
 * })
 * // Returns: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;COUNT=10"
 */
function customRecurrenceToRRule(state: CustomRecurrenceState): string {
  let rrule = `FREQ=${state.frequency}LY`; // DAILY, WEEKLY, MONTHLY, YEARLY

  // Add interval if > 1
  if (state.interval > 1) {
    rrule += `;INTERVAL=${state.interval}`;
  }

  // Add weekdays for WEEK frequency
  if (state.frequency === "WEEK" && state.weekdays.length > 0) {
    const days = state.weekdays.map((d) => WEEKDAY_MAP[d]).join(",");
    rrule += `;BYDAY=${days}`;
  }

  // Add end condition
  if (state.endType === "ON_DATE" && state.endDate) {
    // Convert YYYY-MM-DD to YYYYMMDD
    const until = state.endDate.replace(/-/g, "");
    rrule += `;UNTIL=${until}`;
  } else if (state.endType === "AFTER_COUNT") {
    rrule += `;COUNT=${state.endCount}`;
  }

  return rrule;
}

/**
 * Parse RRULE string to CustomRecurrenceState
 *
 * @param rrule - RRULE string (with or without RRULE: prefix)
 * @param startDate - Event start date (for default weekday)
 * @returns CustomRecurrenceState
 *
 * @example
 * parseRRuleToState('FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10', new Date())
 * // Returns: { interval: 1, frequency: 'WEEK', weekdays: [1, 3, 5], endType: 'AFTER_COUNT', endCount: 10, ... }
 */
function parseRRuleToState(
  rrule: string,
  startDate: Date
): CustomRecurrenceState {
  // Remove RRULE: prefix if present
  const ruleStr = rrule.replace(/^RRULE:/, "");

  // Parse into key-value pairs
  const parts = ruleStr.split(";").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  // Extract frequency (DAILY → DAY, WEEKLY → WEEK, etc.)
  const freqMap: Record<string, "DAY" | "WEEK" | "MONTH" | "YEAR"> = {
    DAILY: "DAY",
    WEEKLY: "WEEK",
    MONTHLY: "MONTH",
    YEARLY: "YEAR",
  };
  const frequency = freqMap[parts.FREQ] || "WEEK";

  // Extract interval (default: 1)
  const interval = parseInt(parts.INTERVAL) || 1;

  // Extract weekdays (if BYDAY present)
  let weekdays: number[] = [];
  if (parts.BYDAY) {
    weekdays = parts.BYDAY.split(",").map((day) => {
      const index = WEEKDAY_MAP.indexOf(day);
      return index !== -1 ? index : startDate.getDay();
    });
  } else {
    weekdays = [startDate.getDay()];
  }

  // Extract end condition
  let endType: "NEVER" | "ON_DATE" | "AFTER_COUNT" = "NEVER";
  let endDate = "";
  let endCount = 10;

  if (parts.UNTIL) {
    endType = "ON_DATE";
    // Convert YYYYMMDD to YYYY-MM-DD
    const until = parts.UNTIL;
    endDate = `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`;
  } else if (parts.COUNT) {
    endType = "AFTER_COUNT";
    endCount = parseInt(parts.COUNT) || 10;
  }

  return {
    interval,
    frequency,
    weekdays,
    endType,
    endDate,
    endCount,
  };
}

/**
 * Recurrence Utility Module
 *
 * Handles RRULE generation, parsing, and event instance expansion
 * for recurring calendar events using the rrule library (RFC 5545).
 */

import { RRule, rrulestr, Weekday } from 'rrule';

/**
 * Recurrence preset options with Italian labels for UI
 */
export const RECURRENCE_PRESETS = [
  { value: 'NONE', label: 'Non si ripete', rrule: null },
  { value: 'DAILY', label: 'Ogni giorno', rrule: 'FREQ=DAILY' },
  { value: 'WEEKLY', label: 'Ogni settimana', rrule: 'FREQ=WEEKLY' }, // Dynamic: "di [weekday]"
  { value: 'MONTHLY', label: 'Ogni mese', rrule: 'FREQ=MONTHLY' }, // Dynamic: "il [ordinal] [weekday]"
  { value: 'YEARLY', label: 'Ogni anno', rrule: 'FREQ=YEARLY' }, // Dynamic: "il [date]"
  { value: 'WEEKDAY', label: 'Tutti i giorni della settimana (lun-ven)', rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { value: 'CUSTOM', label: 'Personalizza...', rrule: null },
] as const;

export type RecurrencePreset = typeof RECURRENCE_PRESETS[number]['value'];

/**
 * Recurrence end types
 */
export type RecurrenceEndType = 'NEVER' | 'ON_DATE' | 'AFTER_COUNT';

/**
 * Generate RRULE string for a given preset and start date
 *
 * @param preset - The recurrence preset
 * @param startDate - The event start date (used to determine weekday, etc.)
 * @param endType - How the recurrence ends (never, on date, after count)
 * @param endValue - The end date (ISO string) or count number
 * @returns RRULE string (without RRULE: prefix) or null for non-recurring
 *
 * @example
 * generateRRule('WEEKLY', new Date('2025-01-09'), 'NEVER')
 * // Returns: "FREQ=WEEKLY;BYDAY=TH"
 *
 * generateRRule('DAILY', new Date(), 'AFTER_COUNT', 10)
 * // Returns: "FREQ=DAILY;COUNT=10"
 *
 * generateRRule('YEARLY', new Date('2025-12-25'), 'ON_DATE', '2030-12-25')
 * // Returns: "FREQ=YEARLY;UNTIL=20301225"
 */
export function generateRRule(
  preset: RecurrencePreset,
  startDate: Date,
  endType: RecurrenceEndType = 'NEVER',
  endValue?: string | number
): string | null {
  if (preset === 'NONE') return null;

  // Get weekday as RRULE format (MO, TU, WE, TH, FR, SA, SU)
  const weekdayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const weekday = weekdayMap[startDate.getDay()];

  let baseRule = '';

  switch (preset) {
    case 'DAILY':
      baseRule = 'FREQ=DAILY';
      break;

    case 'WEEKLY':
      baseRule = `FREQ=WEEKLY;BYDAY=${weekday}`;
      break;

    case 'MONTHLY':
      // Calculate ordinal (e.g., "second Tuesday")
      const dayOfMonth = startDate.getDate();
      const ordinal = Math.ceil(dayOfMonth / 7);
      baseRule = `FREQ=MONTHLY;BYDAY=${ordinal}${weekday}`;
      break;

    case 'YEARLY':
      baseRule = 'FREQ=YEARLY';
      break;

    case 'WEEKDAY':
      baseRule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
      break;

    case 'CUSTOM':
      return null; // User will provide custom RRULE

    default:
      return null;
  }

  // Add end condition
  if (endType === 'AFTER_COUNT' && typeof endValue === 'number') {
    baseRule += `;COUNT=${endValue}`;
  } else if (endType === 'ON_DATE' && typeof endValue === 'string') {
    // Convert ISO date to YYYYMMDD format for UNTIL
    const untilDate = new Date(endValue);
    const year = untilDate.getFullYear();
    const month = String(untilDate.getMonth() + 1).padStart(2, '0');
    const day = String(untilDate.getDate()).padStart(2, '0');
    baseRule += `;UNTIL=${year}${month}${day}`;
  }
  // endType === 'NEVER' → no COUNT or UNTIL, infinite recurrence

  return baseRule;
}

/**
 * Get human-readable recurrence description in Italian
 *
 * @param rruleString - The RRULE string (without RRULE: prefix)
 * @param startDate - The event start date
 * @returns Human-readable description
 *
 * @example
 * getRecurrenceDescription('FREQ=WEEKLY;BYDAY=TH', new Date('2025-01-09'))
 * // Returns: "Ogni settimana di giovedì"
 */
export function getRecurrenceDescription(rruleString: string | null, startDate: Date): string {
  if (!rruleString) return 'Non si ripete';

  try {
    const rule = rrulestr(`RRULE:${rruleString}`, { dtstart: startDate });

    // Weekday names in Italian
    const weekdayNames = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    const weekdayName = weekdayNames[startDate.getDay()];

    // Check for COUNT or UNTIL
    let endDescription = '';
    if (rruleString.includes('COUNT=')) {
      const count = rruleString.match(/COUNT=(\d+)/)?.[1];
      endDescription = `, ${count} volte`;
    } else if (rruleString.includes('UNTIL=')) {
      const until = rruleString.match(/UNTIL=(\d{8})/)?.[1];
      if (until) {
        const year = until.substring(0, 4);
        const month = until.substring(4, 6);
        const day = until.substring(6, 8);
        endDescription = `, fino al ${day}/${month}/${year}`;
      }
    }

    // Simple heuristic matching
    if (rruleString.includes('FREQ=DAILY')) {
      return `Ogni giorno${endDescription}`;
    } else if (rruleString.includes('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')) {
      return `Tutti i giorni della settimana (lun-ven)${endDescription}`;
    } else if (rruleString.includes('FREQ=WEEKLY')) {
      return `Ogni settimana di ${weekdayName}${endDescription}`;
    } else if (rruleString.includes('FREQ=MONTHLY')) {
      const ordinalMatch = rruleString.match(/BYDAY=(\d)(\w{2})/);
      if (ordinalMatch) {
        const ordinal = parseInt(ordinalMatch[1]);
        const ordinalNames = ['primo', 'secondo', 'terzo', 'quarto', 'quinto'];
        return `Ogni mese il ${ordinalNames[ordinal - 1]} ${weekdayName}${endDescription}`;
      }
      return `Ogni mese${endDescription}`;
    } else if (rruleString.includes('FREQ=YEARLY')) {
      const dateStr = startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
      return `Ogni anno il ${dateStr}${endDescription}`;
    }

    return `Ricorrenza personalizzata${endDescription}`;
  } catch (error) {
    console.error('Failed to parse RRULE:', error);
    return 'Ricorrenza non valida';
  }
}

/**
 * Expand recurring event into instances for a date range
 *
 * @param event - The recurring event (with recurrence field)
 * @param rangeStart - Start of date range
 * @param rangeEnd - End of date range
 * @param exceptions - Array of exception events (modified/cancelled occurrences)
 * @param maxInstances - Maximum number of instances to generate (default: 365)
 * @returns Array of event instances
 *
 * @example
 * const event = {
 *   id: 'abc-123',
 *   title: 'Daily Standup',
 *   start: '2025-01-01T09:00:00',
 *   end: '2025-01-01T09:30:00',
 *   recurrence: 'FREQ=DAILY;COUNT=10',
 *   all_day: false
 * };
 * const instances = expandRecurringEvent(event, new Date('2025-01-01'), new Date('2025-01-31'));
 * // Returns: Array of 10 daily instances
 */
export function expandRecurringEvent(
  event: {
    id: string;
    title: string;
    start: string;
    end: string;
    recurrence: string | null;
    all_day: boolean;
    [key: string]: any;
  },
  rangeStart: Date,
  rangeEnd: Date,
  exceptions: Array<{ recurrence_id?: string; original_start?: string; status?: string }> = [],
  maxInstances: number = 365
): Array<{ id: string; start: Date; end: Date; [key: string]: any }> {
  // Non-recurring event - return as-is
  if (!event.recurrence) {
    return [{
      ...event,
      id: event.id,
      start: new Date(event.start),
      end: new Date(event.end),
    }];
  }

  try {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const duration = eventEnd.getTime() - eventStart.getTime();

    // Parse RRULE with dtstart
    const rule = rrulestr(`RRULE:${event.recurrence}`, { dtstart: eventStart });

    // Determine the end date for occurrence generation
    // If RRULE has UNTIL or COUNT, we need to generate all occurrences up to that limit
    // Otherwise, generate up to 1 year from event start or rangeEnd, whichever is later
    let generationEnd: Date;

    if (event.recurrence.includes('UNTIL=')) {
      // RRULE has explicit end date - use it
      const untilMatch = event.recurrence.match(/UNTIL=(\d{8})/);
      if (untilMatch) {
        const untilStr = untilMatch[1];
        generationEnd = new Date(
          `${untilStr.slice(0, 4)}-${untilStr.slice(4, 6)}-${untilStr.slice(6, 8)}`
        );
      } else {
        // Fallback: 1 year from event start
        generationEnd = new Date(eventStart.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
    } else if (event.recurrence.includes('COUNT=')) {
      // RRULE has COUNT - generate from start to far future, then slice by COUNT
      // The rule.all() will respect COUNT automatically
      generationEnd = new Date(eventStart.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 years
    } else {
      // No end specified - generate up to 1 year from event start or rangeEnd, whichever is later
      const oneYearFromStart = new Date(eventStart.getTime() + 365 * 24 * 60 * 60 * 1000);
      generationEnd = rangeEnd > oneYearFromStart ? rangeEnd : oneYearFromStart;
    }

    // Generate occurrences from event start to generation end
    const occurrences = rule.between(eventStart, generationEnd, true).slice(0, maxInstances);

    // Filter out exceptions (cancelled or modified occurrences)
    const exceptionDates = new Set(
      exceptions
        .filter(ex => ex.recurrence_id === event.id && ex.original_start)
        .map(ex => new Date(ex.original_start!).toISOString())
    );

    // Map occurrences to event instances, excluding exceptions
    return occurrences
      .filter(occurrence => !exceptionDates.has(occurrence.toISOString()))
      .map((occurrence) => {
        const instanceStart = new Date(occurrence);
        const instanceEnd = new Date(instanceStart.getTime() + duration);

        return {
          ...event,
          // Unique ID: parent-id + occurrence date
          id: `${event.id}-${occurrence.toISOString()}`,
          start: instanceStart,
          end: instanceEnd,
          // Mark as recurring instance
          extendedProps: {
            ...event.extendedProps,
            isRecurringInstance: true,
            parentEventId: event.id,
            occurrenceDate: occurrence.toISOString(),
            recurrence: event.recurrence, // Preserve RRULE for reference
          },
        };
      });
  } catch (error) {
    console.error('Failed to expand recurring event:', error);
    // Return original event on error
    return [{
      ...event,
      id: event.id,
      start: new Date(event.start),
      end: new Date(event.end),
    }];
  }
}

/**
 * Validate RRULE string
 *
 * @param rruleString - The RRULE string to validate (with or without RRULE: prefix)
 * @returns True if valid, false otherwise
 *
 * @example
 * validateRRule('FREQ=DAILY;COUNT=10') // true
 * validateRRule('INVALID') // false
 */
export function validateRRule(rruleString: string): boolean {
  if (!rruleString) return false;

  try {
    // Add RRULE: prefix if missing
    const ruleStr = rruleString.startsWith('RRULE:')
      ? rruleString
      : `RRULE:${rruleString}`;
    rrulestr(ruleStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the ordinal suffix for a day (e.g., "1st", "2nd", "3rd")
 * Used for describing monthly recurrence patterns
 *
 * @param day - Day of month (1-31)
 * @returns Ordinal suffix
 */
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

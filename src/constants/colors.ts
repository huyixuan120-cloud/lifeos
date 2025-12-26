/**
 * Event Color Constants for LifeOS Calendar
 *
 * These colors are used for categorizing and color-coding calendar events.
 * Each color represents a common event category.
 */

export interface EventColor {
  /** Display name for the color/category */
  name: string;
  /** Hex color code for the event background */
  hex: string;
  /** Contrasting text color (white or dark) */
  textColor: string;
  /** Optional description of the category */
  description?: string;
}

/**
 * Predefined event colors for the calendar
 * Modern, accessible colors that work in both light and dark modes
 */
export const EVENT_COLORS: EventColor[] = [
  {
    name: "Slate",
    hex: "#64748b",
    textColor: "#ffffff",
    description: "Default/General",
  },
  {
    name: "Blue",
    hex: "#3b82f6",
    textColor: "#ffffff",
    description: "Meetings/Work",
  },
  {
    name: "Violet",
    hex: "#8b5cf6",
    textColor: "#ffffff",
    description: "Learning/Development",
  },
  {
    name: "Green",
    hex: "#10b981",
    textColor: "#ffffff",
    description: "Personal/Health",
  },
  {
    name: "Orange",
    hex: "#f59e0b",
    textColor: "#ffffff",
    description: "Important/Focus",
  },
  {
    name: "Red",
    hex: "#ef4444",
    textColor: "#ffffff",
    description: "Urgent/Critical",
  },
  {
    name: "Pink",
    hex: "#ec4899",
    textColor: "#ffffff",
    description: "Social/Fun",
  },
  {
    name: "Teal",
    hex: "#14b8a6",
    textColor: "#ffffff",
    description: "Projects/Tasks",
  },
];

/**
 * Default event color (Slate)
 */
export const DEFAULT_EVENT_COLOR = EVENT_COLORS[0];

/**
 * Get an event color by hex code
 * Returns the default color if not found
 */
export function getEventColor(hex: string): EventColor {
  return EVENT_COLORS.find((color) => color.hex === hex) || DEFAULT_EVENT_COLOR;
}

/**
 * Get contrasting text color for a given background color
 * Simple version - you can enhance with more sophisticated contrast calculation
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const color = getEventColor(backgroundColor);
  return color.textColor;
}

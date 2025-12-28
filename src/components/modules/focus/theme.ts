/**
 * Focus Timer Theme Configuration
 *
 * Color schemes and durations for Pomodoro timer modes
 * Uses autumn palette: terracotta (Pomodoro), sage green (Short Break), blue-grey (Long Break)
 */

export const FOCUS_MODE_THEMES = {
  pomodoro: {
    // Terracotta/warm tones for focused work
    bg: "bg-[#FCE8E6]",           // Light terracotta background
    container: "bg-[#F5EFE7]",    // Beige container
    text: "text-[#C97152]",       // Terracotta text
    button: "bg-[#C97152] hover:bg-[#B8886B] text-white",
    tabActive: "bg-[#C97152] text-white",
    tabInactive: "bg-transparent text-gray-600 hover:bg-gray-100",
    border: "border-[#C97152]",
    accent: "#C97152",
    duration: 25 * 60, // 25 minutes in seconds
    label: "Pomodoro",
  },
  shortBreak: {
    // Sage green tones for short breaks
    bg: "bg-[#E8F5E9]",           // Light sage green
    container: "bg-[#F0F8F1]",    // Lighter sage
    text: "text-[#6B8E6F]",       // Sage green text
    button: "bg-[#6B8E6F] hover:bg-[#5C7A5F] text-white",
    tabActive: "bg-[#6B8E6F] text-white",
    tabInactive: "bg-transparent text-gray-600 hover:bg-gray-100",
    border: "border-[#6B8E6F]",
    accent: "#6B8E6F",
    duration: 5 * 60, // 5 minutes in seconds
    label: "Short Break",
  },
  longBreak: {
    // Blue-grey tones for long breaks
    bg: "bg-[#E3F2FD]",           // Light blue-grey
    container: "bg-[#F5F9FC]",    // Lighter blue-grey
    text: "text-[#5C7A8F]",       // Blue-grey text
    button: "bg-[#5C7A8F] hover:bg-[#4A6270] text-white",
    tabActive: "bg-[#5C7A8F] text-white",
    tabInactive: "bg-transparent text-gray-600 hover:bg-gray-100",
    border: "border-[#5C7A8F]",
    accent: "#5C7A8F",
    duration: 15 * 60, // 15 minutes in seconds
    label: "Long Break",
  },
} as const;

export type FocusMode = keyof typeof FOCUS_MODE_THEMES;

/**
 * Helper function to get theme for current mode
 */
export function getTheme(mode: FocusMode) {
  return FOCUS_MODE_THEMES[mode];
}

/**
 * Format seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

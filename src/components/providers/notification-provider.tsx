"use client";

import { useCalendarNotifications } from "@/hooks/use-calendar-notifications";

/**
 * Global Notification Provider
 *
 * Mounts the calendar notifications system globally
 * so it runs in the background while the app is open.
 *
 * This provider should be added to the root layout.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Mount calendar notifications globally
  useCalendarNotifications();

  // This provider doesn't render anything, just runs the hook
  return <>{children}</>;
}

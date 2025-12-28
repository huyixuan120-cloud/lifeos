"use client";

import { useEffect, useCallback, useRef } from "react";
import { useCalendar } from "@/hooks/use-calendar";

/**
 * Smart Calendar Notifications Hook
 *
 * Features:
 * - Notifies 5 minutes before standard events
 * - Notifies at 7:30 AM for all-day events
 * - Prevents duplicate notifications using localStorage
 * - Checks every 60 seconds for upcoming events
 * - Automatically requests notification permission
 *
 * @example
 * ```tsx
 * // In root layout or provider
 * function RootProvider() {
 *   useCalendarNotifications();
 *   return <App />;
 * }
 * ```
 */
export function useCalendarNotifications() {
  const { events } = useCalendar();
  const hasRequestedPermission = useRef(false);

  /**
   * Request notification permission on first mount
   */
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("⚠️ Browser notifications not supported");
      return;
    }

    if (Notification.permission === "default" && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      try {
        const permission = await Notification.requestPermission();
        console.log(`🔔 Notification permission: ${permission}`);
      } catch (error) {
        console.error("Failed to request notification permission:", error);
      }
    }
  }, []);

  /**
   * Get notified event IDs from localStorage for today
   */
  const getNotifiedToday = useCallback((): Set<string> => {
    if (typeof window === "undefined") return new Set();

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const stored = localStorage.getItem(`calendar_notified_${today}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  }, []);

  /**
   * Mark an event as notified for today
   */
  const markAsNotified = useCallback((eventId: string) => {
    if (typeof window === "undefined") return;

    const today = new Date().toISOString().split("T")[0];
    const notified = getNotifiedToday();
    notified.add(eventId);
    localStorage.setItem(`calendar_notified_${today}`, JSON.stringify([...notified]));
  }, [getNotifiedToday]);

  /**
   * Send a browser notification
   */
  const sendNotification = useCallback((title: string, body: string, eventId: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: `calendar-event-${eventId}`, // Prevents duplicate notifications
        });
        markAsNotified(eventId);
        console.log(`🔔 Notification sent: ${title}`);
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }
  }, [markAsNotified]);

  /**
   * Check for upcoming events and send notifications
   */
  const checkAndNotify = useCallback(() => {
    if (typeof window === "undefined" || events.length === 0) return;

    const now = new Date();
    const currentTime = now.getTime();
    const today = now.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const notifiedToday = getNotifiedToday();

    events.forEach((event) => {
      // Skip if event has no ID
      if (!event.id) return;

      // Skip if already notified today
      if (notifiedToday.has(event.id)) return;

      // Check if event is today
      const eventDate = event.start_time ? new Date(event.start_time).toISOString().split("T")[0] : null;
      const isToday = eventDate === today;

      if (!isToday) return;

      if (event.all_day) {
        // ALL-DAY EVENT: Notify at 7:30 AM
        if (currentHour === 7 && currentMinute === 30) {
          sendNotification(
            `📅 Today: ${event.title}`,
            "Don't forget about this all-day event!",
            event.id
          );
        }
      } else if (event.start_time) {
        // STANDARD EVENT: Notify 5 minutes before
        const eventStart = new Date(event.start_time).getTime();
        const timeDiff = eventStart - currentTime;
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        const oneMinute = 60 * 1000; // Tolerance: +/- 1 minute

        // Check if we're within the 5-minute window (with 1-minute tolerance)
        if (timeDiff > (fiveMinutes - oneMinute) && timeDiff <= (fiveMinutes + oneMinute)) {
          sendNotification(
            `🔔 ${event.title} starts in 5 minutes!`,
            event.location ? `Location: ${event.location}` : "Get ready for your event",
            event.id
          );
        }
      }
    });
  }, [events, getNotifiedToday, sendNotification]);

  /**
   * Request permission on mount
   */
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  /**
   * Check for notifications every 60 seconds
   */
  useEffect(() => {
    // Check immediately on mount
    checkAndNotify();

    // Then check every 60 seconds
    const interval = setInterval(() => {
      checkAndNotify();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [checkAndNotify]);

  /**
   * Clean up old notification data (older than 7 days)
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cleanupOldData = () => {
      const keys = Object.keys(localStorage);
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      keys.forEach((key) => {
        if (key.startsWith("calendar_notified_")) {
          const dateStr = key.replace("calendar_notified_", "");
          const date = new Date(dateStr);
          if (date < sevenDaysAgo) {
            localStorage.removeItem(key);
            console.log(`🧹 Cleaned up old notification data: ${key}`);
          }
        }
      });
    };

    // Clean up on mount
    cleanupOldData();

    // Clean up daily
    const interval = setInterval(cleanupOldData, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

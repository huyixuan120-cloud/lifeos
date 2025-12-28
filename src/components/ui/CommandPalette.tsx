"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  LayoutGrid,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  User,
  Plus,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  section: "navigation" | "actions";
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define command items
  const commandItems: CommandItem[] = [
    // Navigation Section
    {
      id: "nav-dashboard",
      label: "Dashboard",
      description: "View your overview",
      icon: LayoutGrid,
      section: "navigation",
      action: () => router.push("/"),
      keywords: ["home", "overview", "main"],
    },
    {
      id: "nav-calendar",
      label: "Calendar",
      description: "Manage events and schedule",
      icon: Calendar,
      section: "navigation",
      action: () => router.push("/calendar"),
      keywords: ["events", "schedule", "dates"],
    },
    {
      id: "nav-tasks",
      label: "Tasks",
      description: "Manage your tasks",
      icon: CheckCircle,
      section: "navigation",
      action: () => router.push("/tasks"),
      keywords: ["todo", "eisenhower", "matrix"],
    },
    {
      id: "nav-focus",
      label: "Focus",
      description: "Start a focus session",
      icon: Clock,
      section: "navigation",
      action: () => router.push("/focus"),
      keywords: ["pomodoro", "timer", "deep work"],
    },
    {
      id: "nav-goals",
      label: "Goals",
      description: "View your strategic goals",
      icon: Target,
      section: "navigation",
      action: () => router.push("/goals"),
      keywords: ["objectives", "targets", "vision"],
    },
    {
      id: "nav-profile",
      label: "Profile",
      description: "View your player profile",
      icon: User,
      section: "navigation",
      action: () => router.push("/profile"),
      keywords: ["account", "settings", "stats", "achievements"],
    },
    // Actions Section
    {
      id: "action-new-task",
      label: "Create New Task",
      description: "Quickly add a new task",
      icon: Plus,
      section: "actions",
      action: () => {
        router.push("/tasks");
        // In a real app, this would also trigger the task creation dialog
        setTimeout(() => {
          alert("Task creation dialog would open here!");
        }, 300);
      },
      keywords: ["add", "new", "create"],
    },
    {
      id: "action-toggle-theme",
      label: "Toggle Theme",
      description: "Switch between light and dark mode",
      icon: Moon,
      section: "actions",
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        setIsOpen(false);
      },
      keywords: ["dark", "light", "appearance"],
    },
  ];

  // Filter items based on search query
  const filteredItems = commandItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesLabel = item.label.toLowerCase().includes(query);
    const matchesDescription = item.description?.toLowerCase().includes(query);
    const matchesKeywords = item.keywords?.some((keyword) =>
      keyword.toLowerCase().includes(query)
    );
    return matchesLabel || matchesDescription || matchesKeywords;
  });

  // Group filtered items by section
  const navigationItems = filteredItems.filter((item) => item.section === "navigation");
  const actionItems = filteredItems.filter((item) => item.section === "actions");

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: CommandItem) => {
      item.action();
      setIsOpen(false);
      setSearchQuery("");
      setSelectedIndex(0);
    },
    []
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, handleSelectItem]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearchQuery("");
        setSelectedIndex(0);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
        setSelectedIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Custom event listener (for sidebar trigger)
  useEffect(() => {
    const handleOpenCommandPalette = () => {
      setIsOpen(true);
      setSearchQuery("");
      setSelectedIndex(0);
    };

    window.addEventListener("open-command-palette", handleOpenCommandPalette);
    return () => window.removeEventListener("open-command-palette", handleOpenCommandPalette);
  }, []);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
      setSearchQuery("");
      setSelectedIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="max-w-2xl w-full mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for pages, actions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 px-2 font-mono text-xs text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Navigation Section */}
              {navigationItems.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Navigation
                  </div>
                  {navigationItems.map((item, index) => {
                    const globalIndex = filteredItems.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          selectedIndex === globalIndex
                            ? "bg-gray-100 dark:bg-gray-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            selectedIndex === globalIndex
                              ? "bg-indigo-100 dark:bg-indigo-900/30"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              selectedIndex === globalIndex
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {selectedIndex === globalIndex && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions Section */}
              {actionItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </div>
                  {actionItems.map((item, index) => {
                    const globalIndex = filteredItems.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          selectedIndex === globalIndex
                            ? "bg-gray-100 dark:bg-gray-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            selectedIndex === globalIndex
                              ? "bg-purple-100 dark:bg-purple-900/30"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              selectedIndex === globalIndex
                                ? "text-purple-600 dark:text-purple-400"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {selectedIndex === globalIndex && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  ↓
                </kbd>
                <span className="ml-1">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  ↵
                </kbd>
                <span className="ml-1">Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {typeof window !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                K
              </kbd>
              <span className="ml-1">to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

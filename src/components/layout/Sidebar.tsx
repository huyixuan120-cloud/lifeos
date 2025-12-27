"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  CheckCircle,
  LayoutGrid,
  Calendar,
  Clock,
  Target,
  Search,
  RefreshCcw,
  Bell,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useLifeOS } from "@/hooks/useLifeOS";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}

const navigationItems: NavItem[] = [
  { icon: LayoutGrid, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: CheckCircle, label: "Tasks", href: "/tasks" },
  { icon: Clock, label: "Focus", href: "/focus" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Search, label: "Search", href: "#" },
];

const footerItems: NavItem[] = [
  { icon: RefreshCcw, label: "Sync", href: "#" },
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: CircleHelp, label: "Help", href: "#" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { timerState } = useLifeOS();

  // Format time as MM:SS for mini timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearchClick = () => {
    window.dispatchEvent(new Event("open-command-palette"));
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = item.href && pathname === item.href;
    const isSearch = item.label === "Search";
    const isFocus = item.href === "/focus";
    const showTimer = isFocus && timerState.timeLeft > 0 && timerState.timeLeft < timerState.duration;

    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={`relative w-12 h-12 rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "hover:bg-accent hover:text-accent-foreground"
        }`}
        asChild={!!item.href && item.href !== "#" && !isSearch}
        onClick={isSearch ? handleSearchClick : undefined}
      >
        {item.href && item.href !== "#" && !isSearch ? (
          <Link href={item.href}>
            <Icon className="h-5 w-5" />
            {/* Timer Active Indicator - Pulsing Dot */}
            {showTimer && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </Link>
        ) : (
          <>
            <Icon className="h-5 w-5" />
            {/* Timer Active Indicator - Pulsing Dot */}
            {showTimer && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </>
        )}
      </Button>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <div>
            <p>{item.label}</p>
            {/* Show timer in tooltip when Focus timer is active */}
            {showTimer && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs font-mono text-green-600 dark:text-green-400 font-semibold">
                  {formatTime(timerState.timeLeft)}
                </p>
              </div>
            )}
            {isSearch && (
              <p className="text-xs text-muted-foreground mt-1">
                {typeof window !== "undefined" && navigator.platform.includes("Mac") ? "⌘K" : "Ctrl+K"}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 border-r bg-background">
        <div className="flex h-full flex-col items-center justify-between py-4">
          {/* Top Navigation Icons */}
          <nav className="flex flex-col items-center gap-2">
            {navigationItems.map((item, index) => (
              <NavButton key={index} item={item} />
            ))}
          </nav>

          {/* Bottom Footer Icons */}
          <div className="flex flex-col items-center gap-2">
            <Separator className="w-10 mb-2" />
            {footerItems.map((item, index) => (
              <NavButton key={index} item={item} />
            ))}
          </div>
        </div>
      </aside>

      {/* Command Palette */}
      <CommandPalette />
    </TooltipProvider>
  );
}

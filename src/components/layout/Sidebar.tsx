"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  Dumbbell,
  LogIn,
  LogOut,
  Sparkles,
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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChatInterface } from "@/components/ai/chat-interface";
import { useLifeOS } from "@/hooks/useLifeOS";
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

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
  { icon: Dumbbell, label: "Allenamento", href: "/training" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Search, label: "Search", href: "#" },
];

const footerItems: NavItem[] = [
  { icon: Sparkles, label: "AI Chat", href: "#" },
  { icon: RefreshCcw, label: "Sync", href: "#" },
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: CircleHelp, label: "Help", href: "#" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { timerState } = useLifeOS();
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Format time as MM:SS for mini timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearchClick = () => {
    window.dispatchEvent(new Event("open-command-palette"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const NavButton = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = item.href && pathname === item.href;
    const isSearch = item.label === "Search";
    const isAI = item.label === "AI Chat";
    const isFocus = item.href === "/focus";
    const showTimer = isFocus && timerState.timeLeft > 0 && timerState.timeLeft < timerState.duration;

    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={`relative w-12 h-12 rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : isAI
            ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20"
            : "hover:bg-accent hover:text-accent-foreground"
        }`}
        asChild={!!item.href && item.href !== "#" && !isSearch && !isAI}
        onClick={onClick || (isSearch ? handleSearchClick : undefined)}
      >
        {item.href && item.href !== "#" && !isSearch && !isAI ? (
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
            <Icon className={cn("h-5 w-5", isAI && "text-purple-600 dark:text-purple-400")} />
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
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-16 border-r bg-background">
        <div className="flex h-full flex-col items-center justify-between py-4">
          {/* Top Section: Logo + Navigation */}
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center justify-center w-12 h-12 rounded-lg hover:bg-accent transition-colors">
              <div className="relative w-8 h-8">
                <Image src="/logo.png" alt="LifeOS" fill className="object-contain" />
              </div>
            </Link>

            {/* Navigation Icons */}
            <nav className="flex flex-col items-center gap-2">
            {navigationItems.map((item, index) => (
              <NavButton key={index} item={item} />
            ))}
          </nav>
          </div>

          {/* Bottom Footer Icons */}
          <div className="flex flex-col items-center gap-2">
            <Separator className="w-10 mb-2" />
            {footerItems.map((item, index) => (
              <NavButton
                key={index}
                item={item}
                onClick={item.label === "AI Chat" ? () => setIsChatOpen(true) : undefined}
              />
            ))}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile - Always visible */}
            {!isLoading && (
              <>
                <Separator className="w-10 my-2" />
                {user && (
                  // Logged in - Show logout button
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="w-12 h-12 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Logout</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Command Palette */}
      <CommandPalette />

      {/* AI Chat Interface */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </TooltipProvider>
  );
}

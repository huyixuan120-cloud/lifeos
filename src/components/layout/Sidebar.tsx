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
  Star,
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

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}

const navigationItems: NavItem[] = [
  { icon: User, label: "Profile", href: "#" },
  { icon: CheckCircle, label: "Tasks", href: "/tasks" },
  { icon: LayoutGrid, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Clock, label: "Time Tracker", href: "#" },
  { icon: Target, label: "Goals", href: "#" },
  { icon: Star, label: "Favorites", href: "#" },
  { icon: Search, label: "Search", href: "#" },
];

const footerItems: NavItem[] = [
  { icon: RefreshCcw, label: "Sync", href: "#" },
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: CircleHelp, label: "Help", href: "#" },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = item.href && pathname === item.href;

    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={`w-12 h-12 rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "hover:bg-accent hover:text-accent-foreground"
        }`}
        asChild={!!item.href && item.href !== "#"}
      >
        {item.href && item.href !== "#" ? (
          <Link href={item.href}>
            <Icon className="h-5 w-5" />
          </Link>
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </Button>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
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
    </TooltipProvider>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutGrid,
  CheckCircle,
  Calendar,
  Clock,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    icon: LayoutGrid,
    label: "Dashboard",
  },
  {
    href: "/tasks",
    icon: CheckCircle,
    label: "Tasks",
  },
  {
    href: "/calendar",
    icon: Calendar,
    label: "Calendar",
  },
  {
    href: "/focus",
    icon: Clock,
    label: "Focus",
  },
  {
    href: "/training",
    icon: Dumbbell,
    label: "Training",
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive
                  ? "text-[#C97152]"
                  : "text-gray-600 dark:text-gray-400 hover:text-[#C97152] dark:hover:text-[#C97152]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/hooks/useLifeOS";
import { useSession, signOut as authSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useFocusSessions } from "@/hooks/use-focus-sessions";
import { useTheme } from "next-themes";
import {
  User,
  CheckCircle,
  Clock,
  Flame,
  Moon,
  Sun,
  Download,
  Trash2,
  Edit2,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export function ProfileView() {
  const router = useRouter();

  // Auth.js session
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isCheckingAuth = status === "loading";

  // Get real data from Supabase
  const { profile, isLoading: isLoadingProfile, updateProfile, createProfile } = useUserProfile();
  const { sessions, getTotalMinutes } = useFocusSessions();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Initialize editedName when profile loads
  useEffect(() => {
    if (profile?.name) {
      setEditedName(profile.name);
    }
  }, [profile?.name]);

  // Real stats data from Supabase (NO XP/Levels - Pure productivity tracking)
  const statsData: StatCard[] = [
    {
      label: "Current Streak",
      value: `${profile?.streak || 0} Days`,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950/30",
    },
    {
      label: "Tasks Completed",
      value: (profile?.tasks_completed || 0).toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950/30",
    },
    {
      label: "Focus Hours",
      value: `${Math.floor((profile?.focus_minutes || 0) / 60)}h`,
      icon: Clock,
      color: "text-[#A86F4C]",
      bgColor: "bg-[#F9F6F1] dark:bg-[#342E28]",
    },
  ];


  const handleSaveName = async () => {
    if (!editedName.trim()) return;

    try {
      await updateProfile({ name: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      alert("Failed to update name. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditedName(profile?.name || "");
    setIsEditingName(false);
  };

  const handleExportData = () => {
    // Mock export functionality
    alert("Exporting your data... (Feature coming soon!)");
  };

  const handleClearData = () => {
    setShowClearDialog(true);
  };

  const confirmClearData = () => {
    // Mock clear functionality
    alert("Data cleared! (This is a demo - no data was actually cleared)");
    setShowClearDialog(false);
  };

  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setIsDarkMode(newTheme === "dark");
  };

  const handleLogout = async () => {
    try {
      await authSignOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Logout error:", err);
      alert("An error occurred during logout. Please try again.");
    }
  };

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "LO"; // Default: LifeOS
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = profile?.name || session?.user?.name || "LifeOS User";
  const memberSince = profile?.member_since || new Date().toISOString();

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-[#FAF9F7] via-[#FEFDFB] to-[#F5EFE7] dark:from-[#2A2420] dark:via-[#2A2420] dark:to-[#342E28]">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Login Prompt - Show when not authenticated */}
        {!isCheckingAuth && !isAuthenticated && (
          <Card className="border-2 border-[#C97152] bg-gradient-to-br from-[#F5EFE7] via-[#FAF9F7] to-[#F5EFE7] dark:from-[#3E3530] dark:via-[#342E28] dark:to-[#3E3530] rounded-xl shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#C97152] to-[#D4915E] flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#C97152] to-[#D4915E] bg-clip-text text-transparent">
                  Accedi al Tuo Profilo
                </h2>
                <p className="text-muted-foreground">
                  Effettua il login per accedere alle tue statistiche e sincronizzare i tuoi dati
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-br from-[#C97152] to-[#D4915E] text-white hover:opacity-90"
                size="lg"
              >
                Vai al Login
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Section 1: Identity Card (Hero) - CLEAN VERSION (No XP/Levels) */}
        {isAuthenticated && (
        <>
        <Card className="border-2 border-[#E8E2DA] dark:border-[#4A423A] bg-gradient-to-br from-[#F5EFE7] via-[#FAF9F7] to-[#F5EFE7] dark:from-[#3E3530] dark:via-[#342E28] dark:to-[#3E3530] rounded-xl shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#C97152] to-[#A86F4C] flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-900">
                  {getInitials(userName)}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-2xl font-bold max-w-xs"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveName}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-[#C97152] to-[#D4915E] bg-clip-text text-transparent">
                        {userName}
                      </h1>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsEditingName(true)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Productivity Stats */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <User className="h-6 w-6 text-[#C97152]" />
            Productivity Stats
          </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsData.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow rounded-xl"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                          <Icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
        </div>

        {/* Section 3: System Preferences */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6 text-[#C97152]" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="h-5 w-5 text-[#C97152]" />
                  ) : (
                    <Sun className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      {isDarkMode ? "Dark mode" : "Light mode"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark
                    </>
                  )}
                </Button>
              </div>

              {/* Logout Button */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#C97152]/30 bg-gradient-to-r from-[#F5EFE7] via-[#FAF9F7] to-[#F5EFE7] dark:from-[#3E3530] dark:via-[#342E28] dark:to-[#3E3530]">
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-[#C97152]" />
                  <div>
                    <p className="font-medium">Esci dall'Account</p>
                    <p className="text-sm text-muted-foreground">
                      Disconnetti il tuo account da questo dispositivo
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[#C97152] hover:text-[#B8886B] hover:bg-[#F5EFE7] dark:hover:bg-[#3E3530] border-[#C97152]/30"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>

              {/* Export Data */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-[#A86F4C]" />
                  <div>
                    <p className="font-medium">Export My Data</p>
                    <p className="text-sm text-muted-foreground">
                      Download all your productivity data
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Clear All Data */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Clear All Data</p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearData}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
        </Card>
        </>
        )}
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Clear All Data?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all your tasks, events, goals, and statistics. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClearData}>
              Yes, Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

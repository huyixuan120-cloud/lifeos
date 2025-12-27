"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/hooks/useLifeOS";
import { calculateXPForNextLevel, getLevelTitle } from "@/types";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  User,
  CheckCircle,
  Clock,
  Zap,
  Flame,
  Trophy,
  Award,
  Star,
  Moon,
  Sun,
  Download,
  Trash2,
  Edit2,
  Target,
  Coffee,
  Mountain,
  Sparkles,
  Crown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  color: string;
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

// Mock achievements data
const achievements: Achievement[] = [
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Completed 5 tasks before 9 AM",
    icon: Coffee,
    unlocked: true,
    color: "text-orange-600",
  },
  {
    id: "deep-worker",
    name: "Deep Worker",
    description: "Completed 10 focus sessions",
    icon: Target,
    unlocked: true,
    color: "text-purple-600",
  },
  {
    id: "marathoner",
    name: "Marathoner",
    description: "Maintained a 30-day streak",
    icon: Mountain,
    unlocked: false,
    color: "text-blue-600",
  },
  {
    id: "yearly-legend",
    name: "Yearly Legend",
    description: "Completed 365 consecutive days",
    icon: Crown,
    unlocked: false,
    color: "text-yellow-600",
  },
  {
    id: "task-master",
    name: "Task Master",
    description: "Completed 100 tasks",
    icon: CheckCircle,
    unlocked: true,
    color: "text-green-600",
  },
  {
    id: "focus-guru",
    name: "Focus Guru",
    description: "Logged 50 hours of deep work",
    icon: Sparkles,
    unlocked: false,
    color: "text-pink-600",
  },
];

export function ProfileView() {
  // Get real data from global context
  const { userProfile, updateUserProfile } = useLifeOS();

  const [userName, setUserName] = useState(userProfile.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(userName);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Google Auth State
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Real level data from context
  const currentLevel = userProfile.level;
  const levelTitle = getLevelTitle(currentLevel);
  const currentXP = userProfile.xp;

  // Calculate XP for current and next level
  const xpForCurrentLevel = currentLevel > 0 ? calculateXPForNextLevel(currentLevel - 1) : 0;
  const xpToNextLevel = calculateXPForNextLevel(currentLevel);
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpToNextLevel - xpForCurrentLevel;
  const xpProgress = (xpInCurrentLevel / xpNeededForLevel) * 100;

  // Real stats data from context
  const statsData: StatCard[] = [
    {
      label: "Current Streak",
      value: `${userProfile.streak} Days`,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950/30",
    },
    {
      label: "Tasks Crushed",
      value: userProfile.tasksCompleted.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950/30",
    },
    {
      label: "Focus Hours",
      value: `${Math.floor(userProfile.focusMinutes / 60)}h`,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950/30",
    },
    {
      label: "Total XP",
      value: userProfile.xp.toLocaleString("en-US"),
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950/30",
    },
  ];

  // Achievements from context
  const achievementsWithStatus = achievements.map((achievement) => ({
    ...achievement,
    unlocked: userProfile.achievements.includes(achievement.id),
  }));

  // Check Google Auth Status on mount and auth changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        console.log('🔍 Checking auth status:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          provider: session?.user?.app_metadata?.provider,
          hasProviderToken: !!session?.provider_token,
        });

        if (session?.user) {
          // Check if the user signed in with Google
          // Provider can be in app_metadata or user_metadata
          const provider = session.user.app_metadata?.provider || session.user.user_metadata?.provider;
          const hasProviderToken = !!session.provider_token;

          const isGoogle = provider === 'google' && hasProviderToken;

          setIsGoogleConnected(isGoogle);
          setGoogleUserEmail(session.user.email || null);

          if (isGoogle) {
            console.log('✅ Google Calendar connected:', session.user.email);
          } else {
            console.log('⚠️ Session exists but not Google:', { provider, hasProviderToken });
          }
        } else {
          setIsGoogleConnected(false);
          setGoogleUserEmail(null);
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, {
          hasSession: !!session,
          provider: session?.user?.app_metadata?.provider,
          hasProviderToken: !!session?.provider_token,
        });

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Check provider from both possible locations
          const provider = session.user.app_metadata?.provider || session.user.user_metadata?.provider;
          const hasProviderToken = !!session.provider_token;

          const isGoogle = provider === 'google' && hasProviderToken;

          setIsGoogleConnected(isGoogle);
          setGoogleUserEmail(session.user.email || null);

          if (isGoogle) {
            console.log('✅ Google authenticated:', session.user.email);
          }
        } else if (event === 'SIGNED_OUT') {
          setIsGoogleConnected(false);
          setGoogleUserEmail(null);
          console.log('👋 Signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSaveName = () => {
    setUserName(editedName);
    updateUserProfile({ name: editedName });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(userName);
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, this would toggle the actual theme
    alert("Theme toggle - This would change the app theme in production!");
  };

  const handleConnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      const { error } = await signInWithGoogle();

      if (error) {
        alert(`Failed to connect Google Account: ${error.message}`);
        setIsConnectingGoogle(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch (err) {
      alert("An unexpected error occurred. Please try again.");
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      const { error } = await signOut();

      if (error) {
        alert(`Failed to disconnect: ${error.message}`);
      } else {
        setIsGoogleConnected(false);
        setGoogleUserEmail(null);
        console.log('✅ Disconnected from Google');
      }
    } catch (err) {
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TooltipProvider>
      <div className="h-full w-full overflow-auto bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Section 1: Identity Card (Hero) */}
          <Card className="border-2 border-indigo-200 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/50 dark:via-gray-900 dark:to-purple-950/50 rounded-xl shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-900">
                    {getInitials(userName)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2 shadow-lg">
                    <Trophy className="h-6 w-6 text-white" />
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
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
                  </div>

                  {/* Level Badge */}
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 text-lg">
                      <Star className="h-4 w-4 mr-2" />
                      Level {currentLevel} - {levelTitle}
                    </Badge>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Experience Points</span>
                      <span className="font-semibold">
                        {xpInCurrentLevel.toLocaleString("en-US")} / {xpNeededForLevel.toLocaleString("en-US")} XP
                      </span>
                    </div>
                    <Progress value={xpProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground text-center md:text-left">
                      {(xpNeededForLevel - xpInCurrentLevel).toLocaleString("en-US")} XP to Level {currentLevel + 1}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Command Center (Stats Grid) */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-indigo-600" />
              Command Center
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

          {/* Section 3: Hall of Fame (Achievements) */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-600" />
                Badges Earned
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {achievementsWithStatus.filter((a) => a.unlocked).length} of {achievementsWithStatus.length} unlocked
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {achievementsWithStatus.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <Tooltip key={achievement.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer",
                            achievement.unlocked
                              ? "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg hover:scale-105"
                              : "border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900/50 opacity-50"
                          )}
                        >
                          <div
                            className={cn(
                              "p-3 rounded-full",
                              achievement.unlocked
                                ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                                : "bg-gray-300 dark:bg-gray-700"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-6 w-6",
                                achievement.unlocked ? "text-white" : "text-gray-500"
                              )}
                            />
                          </div>
                          <p className="text-xs font-medium text-center line-clamp-2">
                            {achievement.name}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.unlocked ? (
                            <Badge className="bg-green-600 text-white text-xs">Unlocked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Locked
                            </Badge>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 4: System Preferences */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6 text-indigo-600" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="h-5 w-5 text-indigo-600" />
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

              {/* Connect Google Account */}
              {isCheckingAuth ? (
                // Loading state
                <div className="flex items-center justify-center p-4 rounded-lg border-2 border-gray-200 dark:border-gray-800">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Checking connection...</span>
                </div>
              ) : isGoogleConnected ? (
                // Connected state - Show status + Disconnect button
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-green-200 dark:border-green-900/30 bg-gradient-to-r from-green-50 via-white to-green-50 dark:from-green-950/30 dark:via-gray-900 dark:to-green-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Google Account</p>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-300 dark:border-green-800">
                          Connected
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {googleUserEmail || 'Connected'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectGoogle}
                    disabled={isConnectingGoogle}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 border-red-300 dark:border-red-800"
                  >
                    {isConnectingGoogle ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              ) : (
                // Not connected - Show Connect button
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 dark:border-blue-900/30 bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-blue-950/30 dark:via-gray-900 dark:to-blue-950/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Google Account</p>
                      <p className="text-sm text-muted-foreground">
                        Sync calendar and enable integrations
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 flex items-center gap-2"
                  >
                    {isConnectingGoogle ? (
                      <span>Connecting...</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Connect Google
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Export Data */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-blue-600" />
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

          {/* Footer Stats */}
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>Member since {new Date(userProfile.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })} · {currentXP.toLocaleString("en-US")} Total XP Earned</p>
          </div>
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
    </TooltipProvider>
  );
}

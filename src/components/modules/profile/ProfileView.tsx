"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/hooks/useLifeOS";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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

  // Real stats data from context (NO XP/Levels - Pure productivity tracking)
  const statsData: StatCard[] = [
    {
      label: "Current Streak",
      value: `${userProfile.streak} Days`,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950/30",
    },
    {
      label: "Tasks Completed",
      value: userProfile.tasksCompleted.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950/30",
    },
    {
      label: "Focus Hours",
      value: `${Math.floor(userProfile.focusMinutes / 60)}h`,
      icon: Clock,
      color: "text-[#A86F4C]",
      bgColor: "bg-[#F9F6F1] dark:bg-[#342E28]",
    },
  ];

  // Check Google Auth Status on mount and auth changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if we were redirected from OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');

        if (status === 'connected') {
          console.log('✅ Detected OAuth success from URL parameter');
        }

        const { data: { session } } = await supabase.auth.getSession();

        console.log('🔍 Checking auth status:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          provider: session?.user?.app_metadata?.provider,
          hasProviderToken: !!session?.provider_token,
          urlStatus: status,
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
            console.log('✅ Google Calendar connected:', {
              email: session.user.email,
              hasProviderToken,
              hasRefreshToken: !!session.provider_refresh_token,
            });
          } else if (provider === 'google' && !hasProviderToken) {
            console.error('❌ CRITICAL: Google session exists but NO provider_token!', {
              provider,
              hasProviderToken,
              userId: session.user.id,
              scopes: session.user.app_metadata?.provider_scopes,
            });
            console.error('❌ This means Google Calendar API will NOT work. Session did not persist OAuth tokens.');
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
            console.log('✅ Google authenticated:', {
              event,
              email: session.user.email,
              hasProviderToken,
              hasRefreshToken: !!session.provider_refresh_token,
            });
          } else if (provider === 'google' && !hasProviderToken) {
            console.error('❌ CRITICAL: Google session exists but NO provider_token!', {
              event,
              provider,
              hasProviderToken,
              userId: session.user.id,
              scopes: session.user.app_metadata?.provider_scopes,
            });
            console.error('❌ This means Google Calendar API will NOT work. Session did not persist OAuth tokens.');
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
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-[#FAF9F7] via-[#FEFDFB] to-[#F5EFE7] dark:from-[#2A2420] dark:via-[#2A2420] dark:to-[#342E28]">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Section 1: Identity Card (Hero) - CLEAN VERSION (No XP/Levels) */}
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
                    Member since {new Date(userProfile.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#E8E2DA] dark:border-[#4A423A] bg-gradient-to-r from-[#F5EFE7] via-[#FAF9F7] to-[#F5EFE7] dark:from-[#3E3530] dark:via-[#342E28] dark:to-[#3E3530]">
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

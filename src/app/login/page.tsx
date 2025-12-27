"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Login Page
 *
 * Simple login interface with Google OAuth.
 * Redirects to /auth/callback after successful authentication.
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signInError } = await signInWithGoogle();

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      }
      // If successful, user will be redirected to Google, then back to /auth/callback
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to LifeOS
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Sign in to access your productivity dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
            variant="outline"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                Continue with Google
              </>
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
              By signing in, you agree to sync your Google Calendar and grant access to your productivity data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

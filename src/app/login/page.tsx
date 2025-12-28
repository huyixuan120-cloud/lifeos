"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail } from "lucide-react";

/**
 * Login Page - LifeOS Authentication
 *
 * Clean, centered authentication with:
 * - Google OAuth (single sign-on)
 * - Magic Link (passwordless email login)
 * - LifeOS autumn color palette
 *
 * Security:
 * - All data requires authentication (RLS enabled)
 * - OAuth callback handled at /auth/callback
 */
export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      setSuccess(null);

      const { error: signInError } = await signInWithGoogle();

      if (signInError) {
        setError(signInError.message);
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected to Google, then back to /auth/callback
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsMagicLinkLoading(true);
      setError(null);
      setSuccess(null);

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3000/auth/callback';

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setSuccess("Check your email! We sent you a magic link to sign in.");
        setEmail(""); // Clear email field
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isMagicLinkLoading) {
      handleMagicLinkSignIn();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF9F7] via-[#FEFDFB] to-[#F5EFE7] dark:from-[#2A2420] dark:via-[#2A2420] dark:to-[#342E28]">
      <Card className="w-full max-w-md mx-4 border-gray-200 dark:border-gray-800 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#C97152] to-[#D4915E] bg-clip-text text-transparent">
            Welcome back to LifeOS
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Sign in to access your productivity workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isMagicLinkLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
            variant="outline"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                Sign in with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {/* Magic Link Section */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGoogleLoading || isMagicLinkLoading}
              className="h-11"
            />
            <Button
              onClick={handleMagicLinkSignIn}
              disabled={isGoogleLoading || isMagicLinkLoading}
              className="w-full h-11 bg-[#C97152] hover:bg-[#B8886B] text-white"
            >
              {isMagicLinkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Magic Link
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="p-3 bg-[#F5EFE7] dark:bg-[#3E3530] border border-[#D4915E]/30 dark:border-[#8B7355]/30 rounded-lg">
            <p className="text-xs text-[#8B7355] dark:text-[#B8AFA6] text-center">
              🔒 Your data is private and secured with Row Level Security
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Authentication Functions
 *
 * Handles Google OAuth sign-in with Supabase.
 * Configured to request offline access for Google Calendar API.
 */

import { supabase } from './supabase';

/**
 * Sign in with Google OAuth
 *
 * Features:
 * - Uses Supabase Auth with Google provider
 * - Requests offline access (refresh token) for Google Calendar API
 * - Forces consent screen to ensure all permissions are granted
 * - Automatically redirects to /auth/callback after successful login
 *
 * @returns Promise with auth response or error
 *
 * @example
 * ```tsx
 * const handleGoogleSignIn = async () => {
 *   const { error } = await signInWithGoogle();
 *   if (error) console.error('Login failed:', error);
 * };
 * ```
 */
export async function signInWithGoogle() {
  // Get the current origin (works in both localhost and production)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectUrl = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirect URL after successful authentication
      redirectTo: redirectUrl,

      // Google-specific OAuth parameters
      queryParams: {
        // Request offline access to get a refresh token
        // This is essential for Google Calendar API access
        access_type: 'offline',

        // Force consent screen to ensure user grants all permissions
        // This ensures we get the refresh token on first login
        prompt: 'consent',
      },

      // Request Google Calendar scopes
      scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
    },
  });

  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

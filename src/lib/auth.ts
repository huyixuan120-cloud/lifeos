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
  // Explicitly determine the correct redirect URL
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // Use the current origin to ensure it works on both localhost and Vercel
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:3000/auth/callback';

  console.log('🚀 Starting Google OAuth:', {
    isDevelopment,
    isLocalhost,
    redirectUrl,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
  });

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

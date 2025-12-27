import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser/client components
 *
 * This client automatically handles cookies for authentication state
 * and is optimized for use in Client Components (use client directive)
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon/public key
 *
 * CRITICAL CONFIG:
 * - persistSession: true - Ensures session persists across page reloads
 * - autoRefreshToken: true - Automatically refreshes expired tokens
 * - detectSessionInUrl: true - Detects OAuth callback sessions in URL
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "⚠️  Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
    // Return a client with dummy values to prevent build errors
    // The actual error will be shown in the UI when the user tries to use the calendar
    return createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseKey || "placeholder-key",
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  );
}

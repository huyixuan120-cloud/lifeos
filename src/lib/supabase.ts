/**
 * Supabase Client Configuration
 *
 * Browser-side client for authentication and data operations.
 * Uses @supabase/ssr for Next.js App Router compatibility.
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Create a Supabase client for browser-side operations
 *
 * CRITICAL CONFIG:
 * - persistSession: true - Ensures session persists across page reloads
 * - autoRefreshToken: true - Automatically refreshes expired tokens
 * - detectSessionInUrl: true - Detects OAuth callback sessions in URL
 */
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
);

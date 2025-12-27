/**
 * OAuth Callback Route Handler
 *
 * Handles the redirect from Google OAuth after successful authentication.
 * Exchanges the code for a session and redirects to the app.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile'; // Redirect to profile by default

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      console.log('✅ OAuth session created:', {
        provider: data.session.user.app_metadata?.provider,
        email: data.session.user.email,
        hasProviderToken: !!data.session.provider_token,
      });

      // Successful authentication - redirect to profile page
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error('❌ OAuth session creation failed:', error);
    }
  }

  // Authentication failed - redirect to home with error
  return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
}

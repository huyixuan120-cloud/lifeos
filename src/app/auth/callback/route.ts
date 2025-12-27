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
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('🔄 OAuth Callback Handler:', {
    origin,
    hasCode: !!code,
    error,
    errorDescription,
    fullUrl: requestUrl.toString(),
  });

  // Handle OAuth errors from Google
  if (error) {
    console.error('❌ OAuth error from provider:', { error, errorDescription });
    return NextResponse.redirect(`${origin}/?error=oauth_failed&message=${encodeURIComponent(errorDescription || error)}`);
  }

  // No code = invalid callback
  if (!code) {
    console.error('❌ No code in callback URL');
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  try {
    console.log('🔧 Creating Supabase server client...');
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
            } catch (error) {
              console.error('⚠️ Error setting cookies:', error);
            }
          },
        },
      }
    );

    console.log('🔄 Exchanging code for session...');

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Failed to exchange code for session:', {
        error: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name,
      });
      return NextResponse.redirect(`${origin}/?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`);
    }

    if (!data?.session) {
      console.error('❌ No session returned after exchange');
      return NextResponse.redirect(`${origin}/?error=no_session`);
    }

    // Success! Log the session details
    console.log('✅ OAuth session created successfully:', {
      userId: data.session.user.id,
      email: data.session.user.email,
      provider: data.session.user.app_metadata?.provider,
      hasProviderToken: !!data.session.provider_token,
      hasProviderRefreshToken: !!data.session.provider_refresh_token,
      expiresAt: data.session.expires_at,
    });

    // Redirect to profile with success status
    const redirectUrl = `${origin}/profile?status=connected`;
    console.log('✅ Redirecting to:', redirectUrl);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Unexpected error in callback handler:', error);
    return NextResponse.redirect(`${origin}/?error=unexpected&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
  }
}

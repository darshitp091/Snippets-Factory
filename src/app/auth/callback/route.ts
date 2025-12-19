import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(
        errorDescription || 'Authentication failed'
      )}`
    );
  }

  if (code) {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(
            'Failed to verify email. Please try again.'
          )}`
        );
      }

      if (data.session) {
        // Email verified successfully - redirect to dashboard
        const response = NextResponse.redirect(`${requestUrl.origin}/dashboard`);

        // Set session cookies
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax',
        });

        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax',
        });

        return response;
      }
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(
          'An error occurred during authentication'
        )}`
      );
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
    const supabase = createRouteHandlerClient({ cookies });

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
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
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

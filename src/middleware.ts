import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, skip authentication checks
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url') {
    console.log('⚠️ Supabase not configured - authentication disabled');
    return res;
  }

  // Only enable authentication when Supabase is properly configured
  try {
    // Get session tokens from cookies
    const accessToken = req.cookies.get('sb-access-token')?.value;
    const refreshToken = req.cookies.get('sb-refresh-token')?.value;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let session = null;

    // If we have tokens, verify the session
    if (accessToken && refreshToken) {
      const { data } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      session = data.session;
    }

    // Protect authenticated routes (all routes under (dashboard) route group)
    const protectedPaths = [
      '/dashboard',
      '/communities',
      '/analytics',
      '/settings',
      '/snippets', // Dashboard snippets page (not public snippet view)
      '/discover',
    ];

    const isProtectedRoute = protectedPaths.some(path =>
      req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/')
    );

    if (isProtectedRoute) {
      if (!session) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Redirect authenticated users away from login/signup pages
    if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/communities/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/snippets',
    '/discover',
    '/login',
    '/signup'
  ],
};

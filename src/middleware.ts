import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    const authHelpers = await import('@supabase/auth-helpers-nextjs');
    const supabase = authHelpers.createMiddlewareClient({ req, res });

    // Refresh session if expired
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
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
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};

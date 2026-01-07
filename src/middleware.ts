import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Temporarily disable auth middleware to fix login issues
  // Auth will be handled client-side for now
  return NextResponse.next();
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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for login page and API routes
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('admin-token')?.value || request.headers.get('x-admin-token');

  // In development, allow through without strict auth
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

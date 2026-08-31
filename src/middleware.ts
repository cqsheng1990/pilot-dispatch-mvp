import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('pilot_session')?.value;
  if (!session) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/schedule/:path*', '/plans/:path*', '/imports/:path*', '/people/:path*', '/rules/:path*', '/changes/:path*', '/review/:path*', '/audit/:path*', '/api/:path*'],
};

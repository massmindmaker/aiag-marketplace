import { NextResponse, type NextRequest } from 'next/server';

// Stub middleware (no auth-edge import) to avoid Node 22 + edge-runtime
// `Cannot redefine property: __import_unsupported` regression.
// Auth gating is enforced inside server components / route handlers via getServerSession.
export default function middleware(_req: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)'],
};

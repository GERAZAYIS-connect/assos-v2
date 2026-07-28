import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Skip static files, Next.js internal paths, API routes, and global standalone routes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/invite') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/create-association') ||
    url.pathname.startsWith('/certificates') ||
    url.pathname.startsWith('/verify') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain (support *.lvh.me and *.assos.cm)
  let currentHost = hostname
    .replace(':3000', '')
    .replace('.lvh.me', '')
    .replace('.assos.cm', '')
    .toLowerCase();

  // Authentication check for protected routes
  const hasToken = request.cookies.has('next-auth.session-token') || request.cookies.has('__Secure-next-auth.session-token');
  if (!hasToken) {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const rootDomain = hostname.includes('lvh.me') ? 'lvh.me:3000' : 'assos.cm';
    const loginUrl = new URL('/login', `${protocol}://${rootDomain}`);
    // Optionally append callback URL
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Exclude main domains / localhost
  if (currentHost === 'localhost' || currentHost === 'lvh.me' || currentHost === 'assos' || currentHost === 'www') {
    return NextResponse.next();
  }

  // If visiting a subdomain (e.g. mon-asso.lvh.me:3000)
  // Rewrite root request '/' to '/mon-asso/dashboard'
  if (url.pathname === '/') {
    url.pathname = `/${currentHost}/dashboard`;
    return NextResponse.rewrite(url);
  }

  // Rewrite any subdomain tenant route (e.g. /members -> /[tenant]/members)
  if (!url.pathname.startsWith(`/${currentHost}`)) {
    url.pathname = `/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

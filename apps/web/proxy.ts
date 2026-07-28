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

  // Determine if we are running locally, on Vercel, or on custom domain
  const isLocal = hostname.includes('localhost') || hostname.includes('lvh.me');
  const isVercel = hostname.includes('vercel.app');

  let rootDomain = 'asso-in.online';
  let currentHost = '';

  if (isLocal) {
    rootDomain = hostname.includes('lvh.me') ? 'lvh.me:3000' : 'localhost:3000';
    currentHost = hostname.replace(':3000', '').replace('.lvh.me', '').toLowerCase();
  } else if (isVercel) {
    rootDomain = hostname; // On Vercel, root domain is the deployment hostname itself
    currentHost = 'www'; // Skip subdomain rewrites on raw Vercel domains
  } else {
    // Custom domain production (e.g., asso-in.online)
    rootDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'asso-in.online';
    // Remove the leading dot if configured as .domain.com
    const cleanRoot = rootDomain.startsWith('.') ? rootDomain.substring(1) : rootDomain;
    currentHost = hostname.replace(`.${cleanRoot}`, '').toLowerCase();
  }

  // Exclude main domains / localhost
  const isMainDomain =
    currentHost === 'localhost' ||
    currentHost === 'lvh.me' ||
    currentHost === 'assos' ||
    currentHost === 'www' ||
    currentHost === rootDomain.replace(':3000', '');

  // Allow public access to the landing page on the main domain
  if (url.pathname === '/' && isMainDomain) {
    return NextResponse.next();
  }

  // Authentication check for protected routes
  const hasToken = request.cookies.has('next-auth.session-token') || request.cookies.has('__Secure-next-auth.session-token');
  if (!hasToken) {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const loginUrl = new URL('/login', `${protocol}://${rootDomain}`);
    // Optionally append callback URL
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to other pages on the main domain
  if (isMainDomain) {
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

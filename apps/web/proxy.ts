import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;

  // 1. Définir les routes publiques accessibles sans authentification
  const isPublicRoute =
    url.pathname === '/' ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/invite') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/certificates') ||
    url.pathname.startsWith('/verify') ||
    url.pathname.startsWith('/privacy') ||
    url.pathname.startsWith('/terms') ||
    url.pathname.startsWith('/about') ||
    url.pathname.startsWith('/contact') ||
    url.pathname.includes('.');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Vérification de la session pour les routes protégées
  const hasToken =
    request.cookies.has('next-auth.session-token') ||
    request.cookies.has('__Secure-next-auth.session-token');

  if (!hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

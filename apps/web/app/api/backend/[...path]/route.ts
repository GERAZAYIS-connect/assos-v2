import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
const AUTH_SECRET = process.env.AUTH_SECRET || 'assos_v2_super_secret_key_change_in_prod_123456789';

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${API_BASE_URL}/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  // Inject Bearer token from NextAuth session if Authorization header is absent
  if (!headers.get('authorization')) {
    try {
      // 1. Try NextAuth getToken (auto-detects cookie name)
      const token = await getToken({
        req: request,
        secret: AUTH_SECRET,
      });

      if (token && token.accessToken) {
        headers.set('Authorization', `Bearer ${token.accessToken}`);
      } else {
        // 2. Fallback to auth() helper
        const session = await auth();
        if (session && (session as any).accessToken) {
          headers.set('Authorization', `Bearer ${(session as any).accessToken}`);
        }
      }
    } catch (e) {
      console.warn('[API Proxy] Failed to extract NextAuth session token:', e);
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { message: 'Le serveur Backend NestJS (port 4000) n’est pas démarré ou est inaccessible.' },
      { status: 503 }
    );
  }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE, handleProxy as PATCH };

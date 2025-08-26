import { NextRequest, NextResponse } from 'next/server';
import nextIntlConfig from './next-intl.config';

// Decode JWT payload without verification (for UX redirect only)
function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // atob is available in Edge runtime
    const jsonPayload = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

// Verify HS256 JWT in Edge runtime using Web Crypto
async function verifyJwtHS256<T = any>(token: string, secret: string): Promise<{ valid: boolean; payload?: T }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };
    const [headerB64, payloadB64, signatureB64] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    // base64url -> base64
    const toBase64 = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/');
    const data = `${headerB64}.${payloadB64}`;
    const signature = Uint8Array.from(atob(toBase64(signatureB64)), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, signature, enc.encode(data));
    if (!valid) return { valid: false };
    const payloadStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(toBase64(payloadB64)), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(payloadStr) as T;
    // Optional: check exp if present
    const now = Math.floor(Date.now() / 1000);
    if ((payload as any)?.exp && now >= (payload as any).exp) return { valid: false };
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Redirect root to default locale
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    const token = req.cookies.get('auth_token')?.value;
    if (token) {
      const payload = decodeJwtPayload<{ role?: string }>(token);
      if (payload?.role === 'admin') {
        url.pathname = `/${nextIntlConfig.defaultLocale}/admin`;
        return NextResponse.redirect(url);
      }
    }
    url.pathname = `/${nextIntlConfig.defaultLocale}`;
    return NextResponse.redirect(url);
  }
  // Protect admin area: /(ar|en)/admin/** requires admin role
  const adminMatch = pathname.match(/^\/(ar|en)\/admin(\/.*)?$/);
  if (adminMatch) {
    const locale = adminMatch[1] as 'ar' | 'en';
    const token = req.cookies.get('auth_token')?.value;
    // Verify token signature before trusting role
    const secret = process.env.JWT_SECRET || '';
    const verified = token && secret ? await verifyJwtHS256<{ role?: string }>(token, secret) : { valid: false };
    if (!verified.valid || verified.payload?.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/account`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect signed-in user areas with exceptions
  // - orders: always require auth
  // - account: allow public pages (/account, /account/login, /account/register, /account/verify), protect other subpaths
  // - checkout, cart, wishlist: always require auth
  const protectedMatch = pathname.match(/^\/(ar|en)\/(orders|account|checkout|cart|wishlist)(\/.*)?$/);
  if (protectedMatch) {
    const locale = protectedMatch[1] as 'ar' | 'en';
    const section = protectedMatch[2] as 'orders' | 'account';
    const subpath = protectedMatch[3] || '';

    // Public account routes (no auth required)
    if (section === 'account') {
      const sp = subpath || '';
      const isRoot = sp === '' || sp === '/';
      const isPublic = isRoot || sp.startsWith('/login') || sp.startsWith('/register') || sp.startsWith('/verify');
      if (isPublic) {
        return NextResponse.next();
      }
    }

    // For orders and private account subpaths, require VALID token and non-guest role
    const token = req.cookies.get('auth_token')?.value;
    const secret = process.env.JWT_SECRET || '';
    const verified = token && secret ? await verifyJwtHS256<{ role?: string }>(token, secret) : { valid: false };
    if (!verified.valid || verified.payload?.role === 'guest' || !verified.payload) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/account`;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Locale home pages: redirect admins to admin dashboard
  const homeMatch = pathname.match(/^\/(ar|en)\/?$/);
  if (homeMatch) {
    const locale = homeMatch[1] as 'ar' | 'en';
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.next();
    const payload = decodeJwtPayload<{ role?: string }>(token);
    if (payload?.role === 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/admin`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/ar',
    '/en',
    '/ar/',
    '/en/',
    // Admin area
    '/(ar|en)/admin/:path*',
    // Admin APIs
    '/api/admin/:path*',
    // Signed-in user areas
    '/(ar|en)/orders/:path*',
    '/(ar|en)/account/:path*',
    '/(ar|en)/checkout/:path*',
    '/(ar|en)/checkout',
    '/(ar|en)/cart/:path*',
    '/(ar|en)/cart',
    '/(ar|en)/wishlist/:path*',
    '/(ar|en)/wishlist',
  ],
};

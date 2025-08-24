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

export function middleware(req: NextRequest) {
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
    const payload = token ? decodeJwtPayload<{ role?: string }>(token) : null;
    if (!payload || payload.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/account`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect signed-in user areas with exceptions
  // - orders: always require auth
  // - account: allow public pages (/account, /account/login, /account/register, /account/verify), protect other subpaths
  const protectedMatch = pathname.match(/^\/(ar|en)\/(orders|account)(\/.*)?$/);
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

    // For orders and private account subpaths, require token
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
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
    // Signed-in user areas
    '/(ar|en)/orders/:path*',
    '/(ar|en)/account/:path*',
  ],
};

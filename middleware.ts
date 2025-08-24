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
  // Match only locale home pages
  const homeMatch = pathname.match(/^\/(ar|en)\/?$/);
  if (!homeMatch) return NextResponse.next();

  const locale = homeMatch[1] as 'ar' | 'en';
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.next();
  const payload = decodeJwtPayload<{ role?: string }>(token);
  if (payload?.role === 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/admin`;
    return NextResponse.redirect(url);
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
  ],
};

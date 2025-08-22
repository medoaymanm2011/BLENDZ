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
    url.pathname = `/${nextIntlConfig.defaultLocale}`;
    return NextResponse.redirect(url);
  }
  // match "/ar" or "/en" exactly (allow trailing slash)
  const match = pathname.match(/^\/(ar|en)\/?$/);
  if (!match) return NextResponse.next();

  const locale = match[1];
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.next();
  const payload = decodeJwtPayload<{ role?: string }>(token);
  if (payload?.role === 'admin') {
    const url = req.nextUrl.clone();
    // If at locale home, redirect to admin dashboard
    if (pathname.match(/^\/(ar|en)\/?$/)) {
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
  ],
};

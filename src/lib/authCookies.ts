import { NextResponse } from 'next/server';
import { signToken, JwtPayload } from './jwt';

export function setAuthCookie(res: NextResponse, payload: JwtPayload) {
  const token = signToken(payload, '7d');
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(res: NextResponse) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

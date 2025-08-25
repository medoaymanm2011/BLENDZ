import { connectToDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcrypt';
import { registerSchema, loginSchema } from '@/server/validators/auth';
import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie, clearAuthCookie } from '@/lib/authCookies';
import { verifyToken } from '@/lib/jwt';
import { Types } from 'mongoose';
import { sendVerificationEmail } from '@/lib/email';
import { OAuth2Client } from 'google-auth-library';

export async function registerHandler(req: NextRequest) {
  await connectToDB();
  const json = await req.json();
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', fieldErrors: flat.fieldErrors } },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;
  const normalizedEmail = String(email).toLowerCase().trim();
  const headerLocale = (req.headers.get('accept-language') || '').split(',')[0]?.slice(0,2);
  const locale = headerLocale === 'ar' ? 'ar' : 'en';
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    // If user exists but not verified, resend a new code and allow frontend to proceed to verify page
    if (!exists.verified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      exists.verificationCode = verificationCode;
      await exists.save();
      try { void sendVerificationEmail(exists.email, verificationCode, locale).catch((e) => { try { console.error('Email send failed (register resend):', e); } catch {} }); } catch {}
      return NextResponse.json({ user: { id: exists._id, name: exists.name, email: exists.email, role: exists.role }, requiresVerification: true }, { status: 200 });
    }
    return NextResponse.json({ error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role: 'admin' | 'user' = 'user';
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const user = await User.create({ name, email: normalizedEmail, passwordHash, role, verified: false, verificationCode });
  try { void sendVerificationEmail(user.email, verificationCode, locale).catch((e) => { try { console.error('Email send failed (register):', e); } catch {} }); } catch {}
  return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, requiresVerification: true }, { status: 201 });
}

export async function loginHandler(req: NextRequest) {
  await connectToDB();
  const json = await req.json();
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: { code: 'VALIDATION_FAILED', message: 'Validation failed', fieldErrors: flat.fieldErrors } },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }, { status: 401 });
  if (!user.verified) return NextResponse.json({ error: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' } }, { status: 403 });

  const res = NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  try {
    setAuthCookie(res, { sub: String(user._id), email: user.email, role: user.role });
  } catch (e) {
    return NextResponse.json({ error: { code: 'SESSION_ERROR', message: 'Failed to establish session' } }, { status: 500 });
  }
  return res;
}

export async function meHandler(req: NextRequest) {
  await connectToDB();
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  let payload: any = null;
  try {
    payload = verifyToken(token);
  } catch {
    payload = null;
  }
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });
  const user = await User.findById(payload.sub).lean();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function logoutHandler(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}

export async function verifyEmailHandler(req: NextRequest) {
  await connectToDB();
  const { email, code } = await req.json();
  if (!email || !code) return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.verified) return NextResponse.json({ ok: true, alreadyVerified: true });
  if (!user.verificationCode || user.verificationCode !== String(code)) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }
  user.verified = true;
  user.verificationCode = null;
  await user.save();
  return NextResponse.json({ ok: true });
}

export async function resendVerificationHandler(req: NextRequest) {
  await connectToDB();
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.verified) return NextResponse.json({ ok: true, alreadyVerified: true });
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = verificationCode;
  await user.save();
  const headerLocale2 = (req.headers.get('accept-language') || '').split(',')[0]?.slice(0,2);
  const locale2 = headerLocale2 === 'ar' ? 'ar' : 'en';
  try { await sendVerificationEmail(user.email, verificationCode, locale2); } catch (e) { try { console.error('Email send failed (resend):', e); } catch {} }
  return NextResponse.json({ ok: true });
}

// Google Social Login: verify idToken, upsert user, set auth cookie
export async function socialLoginHandler(req: NextRequest) {
  await connectToDB();
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    const clientId = process.env.ClientID;
    if (!clientId) return NextResponse.json({ error: 'Server not configured for Google login' }, { status: 500 });

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const email = String(payload.email || '').toLowerCase().trim();
    const emailVerified = !!payload.email_verified;
    const name = payload.name || email.split('@')[0] || 'User';
    const sub = payload.sub || email; // unique identifier
    if (!email) return NextResponse.json({ error: 'Email missing in token' }, { status: 400 });

    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(String(sub), 10);
      user = await User.create({ name, email, passwordHash, role: 'user', verified: emailVerified, verificationCode: null });
    } else if (!user.verified && emailVerified) {
      user.verified = true;
      user.verificationCode = null;
      await user.save();
    }

    const res = NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 200 });
    try {
      setAuthCookie(res, { sub: String(user._id), email: user.email, role: user.role });
    } catch {
      return NextResponse.json({ error: { code: 'SESSION_ERROR', message: 'Failed to establish session' } }, { status: 500 });
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 400 });
  }
}

// Facebook Social Login: verify accessToken, upsert user, set auth cookie
export async function facebookLoginHandler(req: NextRequest) {
  await connectToDB();
  try {
    const { accessToken } = await req.json();
    if (!accessToken) return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) return NextResponse.json({ error: 'Server not configured for Facebook login' }, { status: 500 });

    const appAccess = `${appId}|${appSecret}`;
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccess)}`;
    const debugRes = await fetch(debugUrl, { next: { revalidate: 0 } });
    const debugJson: any = await debugRes.json();
    if (!debugRes.ok || !debugJson?.data?.is_valid) {
      return NextResponse.json({ error: 'Invalid Facebook token' }, { status: 401 });
    }

    const meUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    const meRes = await fetch(meUrl, { next: { revalidate: 0 } });
    const me: any = await meRes.json();
    if (!meRes.ok || !me?.id) {
      return NextResponse.json({ error: 'Failed to fetch Facebook profile' }, { status: 400 });
    }

    const rawEmail = String(me.email || '').toLowerCase().trim();
    const email = rawEmail || `${me.id}@facebook.local`;
    const name = me.name || (rawEmail ? rawEmail.split('@')[0] : 'Facebook User');
    const sub = me.id;

    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash(String(sub), 10);
      user = await User.create({ name, email, passwordHash, role: 'user', verified: !!rawEmail, verificationCode: null });
    } else if (!user.verified && rawEmail) {
      user.verified = true;
      user.verificationCode = null;
      await user.save();
    }

    const res = NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 200 });
    try {
      setAuthCookie(res, { sub: String(user._id), email: user.email, role: user.role });
    } catch {
      return NextResponse.json({ error: { code: 'SESSION_ERROR', message: 'Failed to establish session' } }, { status: 500 });
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Facebook login failed' }, { status: 400 });
  }
}

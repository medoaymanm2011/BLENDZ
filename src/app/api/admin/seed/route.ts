import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectToDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    const hdr = req.headers.get('x-admin-token') || '';
    if (!adminToken || hdr !== adminToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password } = (body || {}) as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: 'name, email, password are required' }, { status: 400 });
    }

    await connectToDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      existing.name = name;
      existing.passwordHash = passwordHash;
      existing.role = 'admin';
      await existing.save();
      return NextResponse.json({ ok: true, created: false, user: { id: existing._id, email: existing.email, role: existing.role } });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      verified: true,
    });

    return NextResponse.json({ ok: true, created: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Seed error' }, { status: 500 });
  }
}

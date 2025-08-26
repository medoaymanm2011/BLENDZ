import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order } from '@/models/Order';

export const runtime = 'nodejs';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// POST /api/orders/mark-seen -> Admin only, marks all unseen orders as seen
export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDB();
    const res = await Order.updateMany({ adminSeen: { $ne: true } }, { $set: { adminSeen: true } });
    return NextResponse.json({ updated: (res as any).modifiedCount || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

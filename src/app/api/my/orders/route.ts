import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order } from '@/models/Order';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// GET /api/my/orders -> list orders for logged-in user
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDB();

    const orders = await Order.find({ userId: auth.sub }).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

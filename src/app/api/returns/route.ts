import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { ReturnModel } from '@/models/Return';
import { Order } from '@/models/Order';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// GET /api/returns -> list returns (admin: all, user: own)
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const orderId = searchParams.get('orderId') || undefined;

    const query: any = {};
    if (status) query.status = status;
    if (orderId) query.orderId = orderId;
    if (auth.role !== 'admin') query.userId = auth.sub;

    const returns = await ReturnModel.find(query).sort({ createdAt: -1 }).lean();

    // Attach minimal order info for UI convenience
    const orderIds = Array.from(new Set(returns.map((r: any) => r.orderId))).filter(Boolean);
    const orders = orderIds.length ? await Order.find({ _id: { $in: orderIds } }).lean() : [];
    const orderMap = new Map<string, any>(orders.map((o: any) => [String(o._id), o]));

    const items = returns.map((r: any) => {
      const o = orderMap.get(String(r.orderId));
      return {
        ...r,
        order: o ? {
          _id: String(o._id),
          totals: o.totals,
          shippingInfo: o.shippingInfo,
          status: o.status,
          createdAt: o.createdAt,
        } : undefined,
      };
    });

    return NextResponse.json({ returns: items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

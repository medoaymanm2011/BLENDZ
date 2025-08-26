import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order } from '@/models/Order';
import { ReturnModel } from '@/models/Return';

export const runtime = 'nodejs';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// GET /api/admin/revenue?from=ISO&to=ISO&mode=net
// Returns { totalRevenue, refundsTotal, netRevenue, currency, orders: [...] }
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const mode = (searchParams.get('mode') || '').toLowerCase();
    const match: any = {
      status: { $ne: 'cancelled' },
      'payment.status': { $ne: 'cancelled' },
    };
    if (from || to) {
      match.createdAt = {} as any;
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    // List recent orders matching filters (cap to 500)
    const list = await Order.find(match)
      .select('_id createdAt totals status payment.status')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean<any>();

    const orders = (list || []).map((o: any) => ({
      _id: String(o._id),
      createdAt: o.createdAt,
      total: o?.totals?.total ?? 0,
      currency: o?.totals?.currency ?? 'EGP',
      status: o?.status,
      paymentStatus: o?.payment?.status,
    }));

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
    const currency = orders[0]?.currency || 'EGP';

    // Calculate refunds total (only refunded) when needed
    let refundsTotal = 0;
    if (mode === 'net') {
      const orderIds = orders.map((o: any) => o._id);
      const rQuery: any = { orderId: { $in: orderIds }, status: 'refunded' };
      if (from || to) {
        rQuery.createdAt = {} as any;
        if (from) rQuery.createdAt.$gte = new Date(from);
        if (to) rQuery.createdAt.$lte = new Date(to);
      }
      const returns = orderIds.length ? await ReturnModel.find(rQuery).select('refundAmount').lean<any>() : [];
      refundsTotal = (returns || []).reduce((s: number, r: any) => s + (Number(r?.refundAmount) || 0), 0);
    }

    const resp: any = { totalRevenue, currency, orders };
    if (mode === 'net') {
      resp.refundsTotal = refundsTotal;
      resp.netRevenue = totalRevenue - refundsTotal;
    }

    return NextResponse.json(resp);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

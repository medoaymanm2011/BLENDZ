import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { ReturnModel } from '@/models/Return';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// GET /api/returns/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await params;
    const ret = (await ReturnModel.findById(id).lean()) as any;
    if (!ret) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const order = ret?.orderId ? (await Order.findById(ret.orderId).lean()) as any : null;

    // Enrich items with image fallback from Product if missing
    const itemsSource: any[] = (ret?.items && ret.items.length) ? ret.items : (order?.items || []);
    const missing = itemsSource.filter((it: any) => !it?.image && it?.productId).map((it: any) => String(it.productId));
    if (missing.length) {
      const prods = await Product.find({ _id: { $in: missing } }).lean();
      const pmap = new Map<string, any>(prods.map((p: any) => [String(p._id), p]));
      for (const it of itemsSource) {
        if (!it.image && it.productId) {
          const p = pmap.get(String(it.productId));
          const url = p?.images?.[0]?.url as string | undefined;
          if (url) it.image = url;
        }
      }
    }
    // write enriched array back
    if (ret?.items && ret.items.length) ret.items = itemsSource;
    else if (order?.items) order.items = itemsSource;
    return NextResponse.json({
      return: ret,
      order: order ? {
        _id: String(order._id),
        items: order.items,
        totals: order.totals,
        shippingInfo: order.shippingInfo,
        payment: order.payment,
        status: order.status,
        tracking: order.tracking,
        createdAt: order.createdAt,
      } : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// PATCH /api/returns/[id] -> approve/reject/update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDB();

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').toLowerCase(); // 'approve' | 'reject'
    const note = (body.note != null ? String(body.note) : '').trim();

    const ret = await ReturnModel.findById(id);
    if (!ret) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // only admin can change status
    if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const order = ret.orderId ? await Order.findById(ret.orderId) : null;

    if (action === 'approve') {
      ret.status = 'approved';
      ret.history = ret.history || [];
      ret.history.push({ ts: new Date(), status: 'approved', note });
      if (order) {
        order.tracking = order.tracking || ({} as any);
        order.tracking.history = order.tracking.history || [];
        order.tracking.history.push({ ts: new Date(), status: 'return approved', note });
        // normalize order status out of temporary state
        order.status = 'delivered' as any;
        await order.save();
      }
      await ret.save();
    } else if (action === 'reject') {
      ret.status = 'rejected';
      ret.history = ret.history || [];
      ret.history.push({ ts: new Date(), status: 'rejected', note });
      if (order) {
        order.tracking = order.tracking || ({} as any);
        order.tracking.history = order.tracking.history || [];
        order.tracking.history.push({ ts: new Date(), status: 'return rejected', note });
        order.status = 'delivered' as any;
        await order.save();
      }
      await ret.save();
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ return: ret, order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

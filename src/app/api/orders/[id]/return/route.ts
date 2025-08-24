import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order } from '@/models/Order';
import { ReturnModel } from '@/models/Return';
import { Product } from '@/models/Product';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// POST /api/orders/[id]/return -> customer requests a return (owner or admin)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDB();

    const body = await req.json().catch(() => ({} as any));
    const reason = String(body?.reason || '').trim();
    const notes = String(body?.notes || '').trim();

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only owner or admin can request return
    const isAdmin = auth.role === 'admin';
    const isOwner = auth.sub && String(order.userId || '') === String(auth.sub);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status and append tracking history event
    order.status = 'return requested' as any;
    order.tracking = order.tracking || {} as any;
    order.tracking.history = order.tracking.history || [];
    order.tracking.history.push({ ts: new Date(), status: 'return requested', note: reason || notes ? `${reason}${reason && notes ? ' - ' : ''}${notes}` : undefined });

    // Build items with image fallback from Product if missing on order item
    const orderItems = (order.items || []).map((it: any) => ({
      productId: String(it.productId),
      name: it.name,
      price: it.price,
      qty: it.qty,
      image: it.image as string | undefined,
    }));
    const missingImageIds = orderItems
      .filter((i: { image?: string }) => !i.image)
      .map((i: { productId: string }) => i.productId);
    if (missingImageIds.length) {
      const prods = await Product.find({ _id: { $in: missingImageIds } }).lean();
      const pmap = new Map<string, any>(prods.map((p: any) => [String(p._id), p]));
      for (const it of orderItems) {
        if (!it.image) {
          const p = pmap.get(it.productId);
          const first = p?.images?.[0];
          const url = (typeof first === 'string') ? first : (first?.url as string | undefined);
          if (url) it.image = url;
        }
      }
    }

    // Create Return document
    const ret = await ReturnModel.create({
      orderId: String(order._id),
      userId: auth.sub || null,
      reason: reason || null,
      notes: notes || null,
      items: orderItems,
      status: 'requested',
      history: [{ ts: new Date(), status: 'requested', note: reason || notes ? `${reason}${reason && notes ? ' - ' : ''}${notes}` : undefined }],
    });

    await order.save();
    return NextResponse.json({ order, return: ret });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

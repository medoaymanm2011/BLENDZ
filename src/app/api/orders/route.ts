import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order, type IOrder, type OrderStatus } from '@/models/Order';
import { Product } from '@/models/Product';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// GET /api/orders -> Admin only list with basic filters
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const q: Record<string, any> = {};
    if (status) q.status = status;

    const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200);
    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/orders -> Create order (COD by default)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();

    // Basic validation
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: 'No items' }, { status: 400 });

    const shippingInfo = body?.shippingInfo || {};
    if (!shippingInfo?.name || !shippingInfo?.phone) {
      return NextResponse.json({ error: 'Missing shipping info' }, { status: 400 });
    }

    // Validate and compute totals from DB to avoid tampering
    let subtotal = 0;
    for (const it of items) {
      const p = await Product.findById(it.productId);
      if (!p) return NextResponse.json({ error: `Product not found: ${it.productId}` }, { status: 400 });
      if (p.stock < it.qty) return NextResponse.json({ error: `Insufficient stock for ${p.name}` }, { status: 400 });
      const price = p.salePrice ?? p.price;
      subtotal += price * it.qty;
    }
    const shipping = Number(body?.totals?.shipping ?? 0) || 0;
    const currency = body?.totals?.currency || 'EGP';
    const total = subtotal + shipping;

    const auth = getAuth(req);

    // Create order
    const order: IOrder = {
      userId: auth?.sub || null,
      customerEmail: auth?.email || body?.customerEmail || null,
      shippingInfo,
      items: items.map((it: any) => ({
        productId: String(it.productId),
        name: String(it.name || ''),
        price: Number(it.price || 0), // will be recalculated below
        qty: Number(it.qty || 0),
        image: it.image,
      })),
      totals: { subtotal, shipping, total, currency },
      payment: { method: String(body?.payment?.method || 'cod'), status: 'pending' },
      status: 'processing',
      tracking: { history: [] },
    };

    // Replace item prices with trusted values from DB
    for (const it of order.items) {
      const p = await Product.findById(it.productId);
      if (!p) continue; // already validated
      it.price = (p.salePrice ?? p.price) as number;
    }

    // Decrement stock
    for (const it of order.items) {
      await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } });
    }

    const saved = await Order.create(order);
    return NextResponse.json({ order: saved }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order, type OrderStatus } from '@/models/Order';
import { Product } from '@/models/Product';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// GET /api/orders/[id] -> admin or owner
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    await connectToDB();
    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Enforce access: admin or owner (by userId)
    const isAdmin = auth?.role === 'admin';
    const isOwner = auth?.sub && String(order.userId || '') === String(auth.sub);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// PATCH /api/orders/[id]/status handled here (single endpoint)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDB();

    const body = await req.json();
    const nextStatus = body?.status as OrderStatus | undefined;
    const trackingNumber = body?.trackingNumber as string | undefined;
    const provider = body?.provider as string | undefined;
    const note = body?.note as string | undefined;

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (nextStatus) order.status = nextStatus;
    if (trackingNumber || provider || note) {
      order.tracking = order.tracking || {} as any;
      if (trackingNumber) order.tracking.number = trackingNumber;
      if (provider) order.tracking.provider = provider;
      order.tracking.history = order.tracking.history || [];
      order.tracking.history.push({ ts: new Date(), status: nextStatus || order.status, note });
    }

    await order.save();
    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] -> cancel order and restock (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDB();

    const { id } = await params;
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (order.status === 'cancelled') {
      return NextResponse.json({ order });
    }

    // restock
    for (const it of order.items || []) {
      await Product.updateOne({ _id: it.productId }, { $inc: { stock: it.qty } });
    }

    order.status = 'cancelled';
    order.payment.status = 'cancelled';
    order.tracking = order.tracking || {} as any;
    order.tracking.history = order.tracking.history || [];
    order.tracking.history.push({ ts: new Date(), status: 'cancelled', note: 'Order cancelled' });

    await order.save();
    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order } from '@/models/Order';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

// POST /api/orders/[id]/receipt -> owner or admin can attach/replace receiptUrl
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDB();

    const { id } = await params;
    const body = await req.json();
    const url = (body?.url || body?.receiptUrl || '').trim();
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isAdmin = auth.role === 'admin';
    const isOwner = auth.sub && String(order.userId || '') === String(auth.sub);
    if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    order.payment = order.payment || ({} as any);
    order.payment.receiptUrl = url;
    // keep status pending; admin will confirm and mark paid
    order.tracking = order.tracking || ({} as any);
    order.tracking.history = order.tracking.history || [];
    order.tracking.history.push({ ts: new Date(), status: order.status, note: 'Receipt uploaded' });

    await order.save();
    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

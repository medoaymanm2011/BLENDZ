import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { Order } from '@/models/Order';
import { ReturnModel } from '@/models/Return';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDB();
    const { id } = await params;

    const order = await Order.findById(id).lean<any>();
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = auth?.sub && String(order.userId || '') === String(auth.sub);
    if (!isOwner && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const st = String(order.status || '').toLowerCase();
    if (st !== 'processing') {
      return NextResponse.json({ error: 'Refund allowed only during processing' }, { status: 400 });
    }

    const payment = order.payment || {};
    const paidViaInsta = String(payment?.channel || '').toLowerCase() === 'instapay' && String(payment?.status || '').toLowerCase() === 'paid';
    if (!paidViaInsta) {
      return NextResponse.json({ error: 'Refund request only for paid InstaPay orders' }, { status: 400 });
    }

    const body = await req.json();
    const name = String(body?.name || '').trim();
    const phone = String(body?.phone || '').trim();
    const address = String(body?.address || '').trim();
    const reason = String(body?.reason || '').trim() || 'Processing refund request';

    if (!name || !phone || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a Return/Refund record for admin processing
    const notes = `Refund during processing\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`;

    const ret = await ReturnModel.create({
      orderId: String(order._id),
      userId: String(auth.sub),
      reason,
      notes,
      refundAmount: Number(order?.totals?.total || 0),
      status: 'requested',
    });

    return NextResponse.json({ request: { id: String(ret._id) } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

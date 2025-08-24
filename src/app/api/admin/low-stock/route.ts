import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { LowStockAlert } from '@/models/LowStockAlert';

// In-memory fallback (per server process) when DB is unavailable
type MemAlert = { productId?: string; slug?: string; stock?: number; at: string };
const g = global as any;
if (!g._lowStockAlerts) g._lowStockAlerts = [] as MemAlert[];
const memStore: MemAlert[] = g._lowStockAlerts;

// Lightweight endpoint to record/forward low-stock events.
// Security note: This endpoint does not mutate product stock; it only logs/forwards events.
// If LOW_STOCK_WEBHOOK is set, the event will be forwarded to that URL (POST JSON).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productId, slug, stock } = body || {};

    if (!productId && !slug) {
      return NextResponse.json({ error: 'productId or slug is required' }, { status: 400 });
    }

    const s = typeof stock === 'number' ? stock : undefined;

    // Persist alert (best-effort)
    try {
      await connectToDB();
      await LowStockAlert.create({ productId, slug, stock: s, at: new Date() });
    } catch (e) {
      console.warn('[low-stock] persist error', (e as any)?.message || e);
      // Fallback to memory store
      try { memStore.unshift({ productId, slug, stock: s, at: new Date().toISOString() }); } catch {}
    }

    // Optional: forward to webhook for admin notification integrations (e.g., Slack, email service)
    const webhook = process.env.LOW_STOCK_WEBHOOK;
    if (webhook && (s == null || s <= 5)) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'low_stock', productId, slug, stock: s, at: new Date().toISOString() }),
          cache: 'no-store',
        });
      } catch (e) {
        console.warn('[low-stock] webhook error', (e as any)?.message || e);
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to record low-stock event' }, { status: 500 });
  }
}

// List recent low-stock alerts (no auth here; rely on admin layout protection in UI)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const skip = Math.max(Number(searchParams.get('skip') || 0), 0);
    try {
      await connectToDB();
      const items = await LowStockAlert.find({}).sort({ at: -1 }).skip(skip).limit(limit).lean();
      return NextResponse.json({ alerts: items });
    } catch {
      // Memory fallback
      const items = memStore.slice(skip, skip + limit);
      return NextResponse.json({ alerts: items });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load low-stock alerts' }, { status: 500 });
  }
}

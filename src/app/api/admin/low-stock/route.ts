import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { LowStockAlert } from '@/models/LowStockAlert';
import { Product } from '@/models/Product';

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
    const THRESH = Number(process.env.LOW_STOCK_THRESHOLD ?? 2);

    // If provided stock is above threshold, ignore silently (no alert)
    if (typeof s === 'number' && s > THRESH) {
      return new NextResponse(null, { status: 204 });
    }

    // Persist alert (best-effort) with de-duplication
    try {
      await connectToDB();
      // de-duplicate: if last alert for same productId/slug has same stock within 6 hours, skip
      const q: any = {};
      if (productId) q.productId = productId;
      if (!productId && slug) q.slug = slug;
      const last = Object.keys(q).length ? await LowStockAlert.findOne(q).sort({ at: -1 }).lean<any>() : null;
      const now = Date.now();
      const recent6h = 6 * 60 * 60 * 1000;
      if (!(last && typeof last?.stock === 'number' && last.stock === s && last?.at && (now - new Date(last.at).getTime()) < recent6h)) {
        await LowStockAlert.create({ productId, slug, stock: s, at: new Date() });
      }
    } catch (e) {
      console.warn('[low-stock] persist error', (e as any)?.message || e);
      // Fallback to memory store
      try {
        // simple in-memory de-dup: skip if same as last
        const last = memStore[0];
        if (!(last && (last.productId === productId || (!productId && last.slug === slug)) && last.stock === s)) {
          memStore.unshift({ productId, slug, stock: s, at: new Date().toISOString() });
        }
      } catch {}
    }

    // Optional: forward to webhook for admin notification integrations (e.g., Slack, email service)
    const webhook = process.env.LOW_STOCK_WEBHOOK;
    if (webhook && (s == null || s <= THRESH)) {
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
    const THRESH = Number(process.env.LOW_STOCK_THRESHOLD ?? 2);
    const NEAR = Number(process.env.LOW_STOCK_NEAR_THRESHOLD ?? (THRESH + 3));
    try {
      await connectToDB();
      // Load recent alerts (more than requested so we can de-dup)
      const raw = await LowStockAlert.find({}).sort({ at: -1 }).limit(Math.max(limit * 5, 200)).lean<any>();

      // De-duplicate: keep latest per product key
      const map = new Map<string, any>();
      for (const a of raw) {
        const key = String(a.productId || a.slug || '');
        if (!key) continue;
        if (!map.has(key)) map.set(key, a);
      }

      // Fetch current product stocks to filter out replenished ones
      const ids = Array.from(new Set(Array.from(map.values()).map((v: any) => v.productId).filter(Boolean)));
      const products = ids.length ? await Product.find({ _id: { $in: ids } }).select('stock slug').lean<any>() : [];
      const pMap = new Map<string, any>(products.map((p: any) => [String(p._id), p]));

      const keep: any[] = [];
      const removeIds: string[] = [];
      for (const [key, a] of map.entries()) {
        let currentStock: number | undefined = undefined;
        if (a.productId && pMap.has(String(a.productId))) currentStock = Number(pMap.get(String(a.productId))?.stock);
        // If we know stock and it's above threshold, schedule cleanup
        if (typeof currentStock === 'number' && currentStock > THRESH) {
          // schedule deletion of all alerts for this productId
          removeIds.push(String(a.productId));
          continue;
        }
        // otherwise, keep
        keep.push(a);
      }

      // Cleanup replenished alerts asynchronously (best-effort)
      if (removeIds.length) {
        try { await LowStockAlert.deleteMany({ productId: { $in: removeIds } }); } catch {}
      }

      // Paginate the deduped list
      const items = keep.slice(skip, skip + limit);

      // Build summary counts
      let outOfStockCount = 0;
      let lowStockCount = 0;
      for (const a of keep) {
        const cur = a.productId ? Number(pMap.get(String(a.productId))?.stock ?? a.stock ?? NaN) : Number(a.stock ?? NaN);
        if (isFinite(cur)) {
          if (cur === 0) outOfStockCount++;
          else if (cur > 0 && cur <= THRESH) lowStockCount++;
        }
      }

      // Near-to-finish products (not in alerts): THRESH < stock <= NEAR
      const nearList = NEAR > THRESH
        ? await Product.find({ stock: { $gt: THRESH, $lte: NEAR } })
            .select('slug stock')
            .sort({ stock: 1 })
            .limit(200)
            .lean<any>()
        : [];
      const near = nearList.map((p: any) => ({ productId: String(p._id), slug: p.slug, stock: Number(p.stock ?? 0) }));

      return NextResponse.json({ alerts: items, near, stats: { outOfStockCount, lowStockCount, nearCount: near.length, threshold: THRESH, nearThreshold: NEAR } });
    } catch {
      // Memory fallback with simple de-dup
      const seen = new Set<string>();
      const uniq: MemAlert[] = [];
      for (const a of memStore) {
        const k = String(a.productId || a.slug || '');
        if (!k || seen.has(k)) continue;
        seen.add(k);
        uniq.push(a);
      }
      const items = uniq.slice(skip, skip + limit);
      return NextResponse.json({ alerts: items });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load low-stock alerts' }, { status: 500 });
  }
}

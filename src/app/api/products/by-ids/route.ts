import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { Product } from '@/models/Product';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ products: [] });
    }
    // fetch in one query; projection minimal for list usage
    const products = await Product.find({ _id: { $in: ids } })
      .select('name slug price salePrice images sectionTypes brandId createdAt')
      .lean();

    const res = NextResponse.json({ products });
    // light public caching; ISR-like for API layer
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch products' }, { status: 500 });
  }
}

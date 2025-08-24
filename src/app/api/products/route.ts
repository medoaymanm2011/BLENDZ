import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { listProducts, createProduct } from '@/server/controllers/productsController';
import { requireAdmin } from '@/server/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const categoryIds: string[] = [];
    const brandIds: string[] = [];
    const sectionTypes: Array<'featured' | 'sale' | 'new' | 'bestseller' | 'recommended'> = [];
    for (const [key, val] of (searchParams as any).entries()) {
      const v = Array.isArray(val) ? val[0] : (val as string);
      if (key.startsWith('categories[') && v) categoryIds.push(v);
      if (key.startsWith('brands[') && v) brandIds.push(v);
      if (key.startsWith('sectionTypes[') && v) sectionTypes.push(v as any);
    }
    const q = searchParams.get('q') || undefined;
    const minPriceRaw = searchParams.get('minPrice');
    const maxPriceRaw = searchParams.get('maxPrice');
    const sort = (searchParams.get('sort') as any) || undefined;
    const sectionSlug = searchParams.get('sectionSlug') || undefined;
    const minPrice = minPriceRaw != null ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw != null ? Number(maxPriceRaw) : undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined;
    const fields = searchParams.get('fields')?.split(',').map(s => s.trim()).filter(Boolean);

    const result = await listProducts({
      categoryIds,
      brandIds,
      q,
      minPrice,
      maxPrice,
      sort,
      sectionTypes: sectionTypes.length ? sectionTypes : undefined,
      sectionSlug,
      page,
      pageSize,
      fields,
    });
    const res = NextResponse.json({ products: result.items, total: result.total, page: result.page, pageSize: result.pageSize });
    // Public cache for listing endpoints; tune max-age as needed
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const product = await createProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (e: any) {
    // Translate duplicate key error to 409 Conflict with a friendly message
    const msg: string = e?.message || 'Failed to create product';
    const code: number | undefined = e?.code;
    if (code === 11000 || /E11000/i.test(msg)) {
      // Try to extract key from error message
      const keyMatch = msg.match(/index:\s*(\w+)/i);
      const key = keyMatch?.[1] || 'unique field';
      const detail = msg.includes('slug') ? 'slug' : key;
      return NextResponse.json({ error: `Duplicate ${detail}: value must be unique.` }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

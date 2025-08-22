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
    for (const [key, val] of (searchParams as any).entries()) {
      const v = Array.isArray(val) ? val[0] : (val as string);
      if (key.startsWith('categories[') && v) categoryIds.push(v);
      if (key.startsWith('brands[') && v) brandIds.push(v);
    }
    const q = searchParams.get('q') || undefined;
    const minPriceRaw = searchParams.get('minPrice');
    const maxPriceRaw = searchParams.get('maxPrice');
    const sort = (searchParams.get('sort') as any) || undefined;
    const minPrice = minPriceRaw != null ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw != null ? Number(maxPriceRaw) : undefined;

    const products = await listProducts({ categoryIds, brandIds, q, minPrice, maxPrice, sort });
    return NextResponse.json({ products });
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
    return NextResponse.json({ error: e.message || 'Failed to create product' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { listBrands, createBrand } from '@/server/controllers/brandsController';
import { requireAdmin } from '@/server/middleware/auth';

export async function GET() {
  try {
    await connectToDB();
    const brands = await listBrands();
    return NextResponse.json({ brands });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const brand = await createBrand(body);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create brand' }, { status: 400 });
  }
}

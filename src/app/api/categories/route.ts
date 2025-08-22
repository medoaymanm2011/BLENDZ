import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { listCategories, createCategory } from '@/server/controllers/categoriesController';
import { requireAdmin } from '@/server/middleware/auth';

export async function GET() {
  try {
    await connectToDB();
    const categories = await listCategories();
    return NextResponse.json({ categories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const category = await createCategory(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create category' }, { status: 400 });
  }
}

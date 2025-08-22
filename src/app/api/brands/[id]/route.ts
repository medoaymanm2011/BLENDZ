import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { updateBrand, deleteBrand } from '@/server/controllers/brandsController';
import { requireAdmin } from '@/server/middleware/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const brand = await updateBrand(params.id, body);
    if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ brand });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update brand' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(_req);
    const res = await deleteBrand(params.id);
    if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete brand' }, { status: 400 });
  }
}

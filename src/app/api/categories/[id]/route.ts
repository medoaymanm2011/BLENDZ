import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { updateCategory, deleteCategory } from '@/server/controllers/categoriesController';
import { requireAdmin } from '@/server/middleware/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const category = await updateCategory(params.id, body);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ category });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update category' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const res = await deleteCategory(params.id);
    if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete category' }, { status: 400 });
  }
}

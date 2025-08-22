import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { updateProduct, deleteProduct, getProductById, getProductBySlug } from '@/server/controllers/productsController';
import { requireAdmin } from '@/server/middleware/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    const { id } = await params;
    let product = null;
    if (/^[a-fA-F0-9]{24}$/.test(id)) {
      product = await getProductById(id);
    }
    if (!product) {
      product = await getProductBySlug(id);
    }
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const product = await updateProduct(id, body);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update product' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const { id } = await params;
    const res = await deleteProduct(id);
    if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete product' }, { status: 400 });
  }
}

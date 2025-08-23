import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { updateSlide, deleteSlide } from '@/server/controllers/slidesController';
import { requireAdmin } from '@/server/middleware/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const { id } = await params;
    const slide = await updateSlide(id, body);
    if (!slide) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ slide });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update slide' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const { id } = await params;
    const res = await deleteSlide(id);
    if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete slide' }, { status: 400 });
  }
}


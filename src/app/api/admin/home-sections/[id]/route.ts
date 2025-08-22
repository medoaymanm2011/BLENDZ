import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { requireAdmin } from '@/server/middleware/auth';
import { deleteHomeSection, updateHomeSection } from '@/server/controllers/homeSectionsController';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const section = await updateHomeSection(params.id, body);
    return NextResponse.json({ section });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    await deleteHomeSection(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 400 });
  }
}

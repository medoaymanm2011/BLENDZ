import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { requireAdmin } from '@/server/middleware/auth';
import { updateUser, deleteUser } from '@/server/controllers/usersController';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const user = await updateUser(params.id, body);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDB();
    requireAdmin(req);
    const ok = await deleteUser(params.id);
    if (!ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete user' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { requireAdmin } from '@/server/middleware/auth';
import { listUsers } from '@/server/controllers/usersController';

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch users' }, { status: 401 });
  }
}

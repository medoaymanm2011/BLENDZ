import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { requireAdmin } from '@/server/middleware/auth';
import { createHomeSection, listHomeSections } from '@/server/controllers/homeSectionsController';

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const sections = await listHomeSections({ includeDisabled: true });
    return NextResponse.json({ sections });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const section = await createHomeSection(body);
    return NextResponse.json({ section }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { requireAdmin } from '@/server/middleware/auth';
import { getOrCreateSettings, upsertSettings } from '@/server/controllers/settingsController';

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch' }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const settings = await upsertSettings(body);
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save' }, { status: 400 });
  }
}

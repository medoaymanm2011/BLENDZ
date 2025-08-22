import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { getSettings } from '@/server/controllers/settingsController';

export async function GET(_req: NextRequest) {
  try {
    await connectToDB();
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

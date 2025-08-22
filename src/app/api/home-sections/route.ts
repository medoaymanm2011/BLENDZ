import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { listHomeSections } from '@/server/controllers/homeSectionsController';

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const locale = (searchParams.get('locale') as 'ar' | 'en' | null) || null;
    const sections = await listHomeSections({ includeDisabled: false, locale: locale || undefined });
    return NextResponse.json({ sections });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch sections' }, { status: 500 });
  }
}

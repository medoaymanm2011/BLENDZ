import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';

export async function GET() {
  try {
    await connectToDB();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'DB error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { listSlides, createSlide } from '@/server/controllers/slidesController';
import { requireAdmin } from '@/server/middleware/auth';

export async function GET() {
  try {
    await connectToDB();
    const slides = await listSlides();
    return NextResponse.json({ slides });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch slides' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    requireAdmin(req);
    const body = await req.json();
    const slide = await createSlide(body);
    return NextResponse.json({ slide }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create slide' }, { status: 400 });
  }
}

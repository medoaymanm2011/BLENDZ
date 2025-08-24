import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { verifyToken, JwtPayload } from '@/lib/jwt';
import { User } from '@/models/User';

function getAuth(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { return verifyToken<JwtPayload>(token); } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDB();
    const user = await User.findById(auth.sub).lean();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ wishlist: user.wishlist || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDB();
    const body = await req.json();
    const productId = String(body?.productId || '');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
    const user = await User.findById(auth.sub);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.wishlist.includes(productId)) user.wishlist.push(productId);
    await user.save();
    return NextResponse.json({ wishlist: user.wishlist });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const all = searchParams.get('all') === 'true';
    const user = await User.findById(auth.sub);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (all) {
      user.wishlist = [];
    } else if (productId) {
      user.wishlist = user.wishlist.filter((id) => id !== productId);
    } else {
      return NextResponse.json({ error: 'Specify productId or all=true' }, { status: 400 });
    }
    await user.save();
    return NextResponse.json({ wishlist: user.wishlist });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

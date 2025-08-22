import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAdmin } from '@/server/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    // Protect this endpoint with the admin token
    requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const { folder } = body || {} as { folder?: string };

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME as string;
    const apiKey = process.env.CLOUDINARY_API_KEY as string;
    const apiSecret = process.env.CLOUDINARY_API_SECRET as string;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { ok: false, error: 'Cloudinary server env vars missing (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)' },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Build string_to_sign per Cloudinary rules (alphabetical params, no api_key/secret)
    // We sign at minimum the timestamp; folder is optional for organizing assets
    const params: Record<string, string | number> = { timestamp };
    if (folder) params.folder = folder;

    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(`${toSign}${apiSecret}`)
      .digest('hex');

    return NextResponse.json({
      ok: true,
      cloudName,
      apiKey,
      timestamp,
      folder: folder || undefined,
      signature,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Sign error' }, { status: 400 });
  }
}

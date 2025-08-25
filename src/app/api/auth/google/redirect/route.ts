import { NextRequest, NextResponse } from 'next/server';
import { socialLoginHandler } from '@/server/controllers/authController';

async function handleCredentialRedirect(req: NextRequest) {
  // Extract idToken ("credential") from POST form or URL query
  let idToken: string | null = null;
  try {
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const form = await req.formData();
        idToken = (form.get('credential') as string) || null;
      } else if (contentType.includes('application/json')) {
        const json = await req.json();
        idToken = (json?.credential as string) || (json?.idToken as string) || null;
      }
    }
  } catch {}
  if (!idToken) {
    const cred = req.nextUrl.searchParams.get('credential');
    if (cred) idToken = cred;
  }
  if (!idToken) {
    return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
  }

  // Call existing social login handler to verify token and set cookie.
  // It returns a JSON response with Set-Cookie header. We forward that cookie onto our redirect response.
  const proxyReq = new Request('http://local/api/auth/google', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const apiRes = await socialLoginHandler(proxyReq as any);

  if (!apiRes.ok) {
    return apiRes;
  }

  // Determine redirect target
  const acceptLang = (req.headers.get('accept-language') || '').split(',')[0]?.slice(0, 2);
  const locale = acceptLang === 'ar' ? 'ar' : 'en';
  const target = req.nextUrl.searchParams.get('redirect') || `/${locale}`;
  const url = req.nextUrl.clone();
  url.pathname = target;
  url.search = '';

  const redirectRes = NextResponse.redirect(url);

  // Copy session cookie from apiRes to redirect response
  const setCookie = apiRes.headers.get('set-cookie');
  if (setCookie) redirectRes.headers.set('set-cookie', setCookie);

  return redirectRes;
}

export async function POST(req: NextRequest) {
  return handleCredentialRedirect(req);
}

export async function GET(req: NextRequest) {
  return handleCredentialRedirect(req);
}

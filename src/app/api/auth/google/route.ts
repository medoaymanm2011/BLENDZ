import { socialLoginHandler } from '@/server/controllers/authController';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Delegate to controller
  // Expect body: { idToken: string }
  // Returns: { user } and sets auth cookie
  // Errors with 400/401/500 on failure
  // We rely on middleware to gate admin/user areas after login
  // This endpoint is public
  // @ts-ignore - Next's Request is compatible with NextRequest subset used in controller
  return socialLoginHandler(req as any);
}

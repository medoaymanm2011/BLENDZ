import { NextRequest } from 'next/server';
import { resendVerificationHandler } from '@/server/controllers/authController';

export async function POST(req: NextRequest) {
  return resendVerificationHandler(req);
}

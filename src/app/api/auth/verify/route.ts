import { NextRequest } from 'next/server';
import { verifyEmailHandler } from '@/server/controllers/authController';

export async function POST(req: NextRequest) {
  return verifyEmailHandler(req);
}

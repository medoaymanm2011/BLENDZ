import { NextRequest } from 'next/server';
import { logoutHandler } from '@/server/controllers/authController';

export async function POST(req: NextRequest) {
  return logoutHandler(req);
}

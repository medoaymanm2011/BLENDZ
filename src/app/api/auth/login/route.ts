import { NextRequest } from 'next/server';
import { loginHandler } from '@/server/controllers/authController';

export async function POST(req: NextRequest) {
  return loginHandler(req);
}

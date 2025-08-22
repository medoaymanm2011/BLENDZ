import { NextRequest } from 'next/server';
import { registerHandler } from '@/server/controllers/authController';

export async function POST(req: NextRequest) {
  return registerHandler(req);
}

import { NextRequest } from 'next/server';
import { meHandler } from '@/server/controllers/authController';

export async function GET(req: NextRequest) {
  return meHandler(req);
}

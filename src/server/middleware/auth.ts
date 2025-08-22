import { NextRequest } from 'next/server';

// Simple header token check. Replace with real JWT/session later.
export function requireAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token');
  const expected = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  if (!expected || token !== expected) {
    throw new Error('Unauthorized');
  }
  return true;
}

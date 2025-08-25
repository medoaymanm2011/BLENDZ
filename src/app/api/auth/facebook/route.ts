export const dynamic = 'force-dynamic';

export async function POST() {
  return new Response(JSON.stringify({ error: 'Facebook login is disabled' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}

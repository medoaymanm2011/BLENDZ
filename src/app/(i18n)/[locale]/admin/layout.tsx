import AdminTopbar from '@/components/AdminTopbar';
import AdminSidebarNav from '@/components/AdminSidebarNav';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, type JwtPayload } from '@/lib/jwt';

export const runtime = 'nodejs';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Server-side admin guard: redirect non-admins away immediately
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) redirect(`/${locale}/account`);
    const payload = verifyToken<JwtPayload>(token);
    if (!payload || payload.role !== 'admin') {
      redirect(`/${locale}/account`);
    }
  } catch {
    redirect(`/${locale}/account`);
  }
  const base = `/${locale}/admin`;
  const isAR = locale === 'ar';
  const adminLabel = isAR ? 'لوحة التحكم' : 'Admin';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col" dir={isAR ? 'rtl' : 'ltr'}>
      <AdminTopbar locale={locale} />
      <main className={`container mx-auto px-4 py-6 flex-1 ${isAR ? 'text-right' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="md:col-span-3 lg:col-span-2">
            <div className="sticky top-6 rounded-xl p-3 bg-white border shadow-sm">
              <div className="text-xs font-semibold uppercase text-gray-500 px-3 pb-2">{adminLabel}</div>
              <AdminSidebarNav base={base} />
            </div>
          </aside>
          <section className="md:col-span-9 lg:col-span-10">
            <div className="bg-white border shadow-sm rounded-xl p-5">
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

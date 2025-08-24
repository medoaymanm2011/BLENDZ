'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AlertItem { _id?: string; productId?: string; slug?: string; stock?: number; at?: string; }

export default function LowStockAdminPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const locale = useMemo(() => (pathname ? pathname.split('/').filter(Boolean)[0] : 'en'), [pathname]);
  const isAR = locale === 'ar';

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/low-stock?limit=100', { cache: 'no-store' });
      const json = await res.json();
      setAlerts(Array.isArray(json?.alerts) ? json.alerts : []);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAlerts(); }, []);

  return (
    <div className="text-gray-900" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`px-1 py-2 ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-2xl font-bold mb-4">{isAR ? 'تنبيهات انخفاض المخزون' : 'Low Stock Alerts'}</h1>
        <div className="mb-4 flex items-center gap-2">
          <button onClick={loadAlerts} disabled={loading} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50">
            {loading ? (isAR ? 'جارٍ التحديث...' : 'Refreshing...') : (isAR ? 'تحديث' : 'Refresh')}
          </button>
          <Link href={`/${locale}/admin/products`} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50">{isAR ? 'المنتجات' : 'Products'}</Link>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">{isAR ? 'المنتج' : 'Product'}</th>
                <th className="px-3 py-2 text-left">{isAR ? 'المخزون' : 'Stock'}</th>
                <th className="px-3 py-2 text-left">{isAR ? 'التاريخ' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={4}>{isAR ? 'لا توجد تنبيهات' : 'No alerts'}</td></tr>
              ) : alerts.map((a, idx) => (
                <tr key={a._id || idx} className="border-t">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">
                    {a.slug || a.productId ? (
                      <Link
                        href={`/${locale}/admin/products?edit=${encodeURIComponent(a.slug || a.productId || '')}`}
                        className="text-blue-700 hover:underline"
                        title={isAR ? 'فتح تعديل المنتج' : 'Open product editor'}
                      >
                        {a.slug || a.productId}
                      </Link>
                    ) : (
                      <span className="text-gray-700">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{a.stock ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-600">{a.at ? new Date(a.at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

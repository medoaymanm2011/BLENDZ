'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AlertItem { _id?: string; productId?: string; slug?: string; stock?: number; at?: string; }
interface NearItem { productId?: string; slug?: string; stock?: number }
interface Stats { outOfStockCount: number; lowStockCount: number; nearCount: number; threshold: number; nearThreshold: number }

export default function LowStockAdminPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [near, setNear] = useState<NearItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const locale = useMemo(() => (pathname ? pathname.split('/').filter(Boolean)[0] : 'en'), [pathname]);
  const isAR = locale === 'ar';

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/low-stock?limit=200', { cache: 'no-store' });
      const json = await res.json();
      setAlerts(Array.isArray(json?.alerts) ? json.alerts : []);
      setNear(Array.isArray(json?.near) ? json.near : []);
      setStats(json?.stats || null);
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

        {stats && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-100 text-red-700">
              {isAR ? 'نفذت (' : 'Out of stock ('}{stats.outOfStockCount})
            </span>
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-orange-100 text-orange-700">
              {isAR ? 'منخفض (' : 'Low ('}{stats.lowStockCount}) ≤ {stats.threshold}
            </span>
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              {isAR ? 'قارب على النفاد (' : 'Near to finish ('}{stats.nearCount}) ≤ {stats.nearThreshold}
            </span>
          </div>
        )}

        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">{isAR ? 'المنتج (منخفض/نفذ)' : 'Product (Low/Out)'}</th>
                <th className="px-3 py-2 text-left">{isAR ? 'المخزون الحالي' : 'Current Stock'}</th>
                <th className="px-3 py-2 text-left">{isAR ? 'آخر تنبيه' : 'Last Alert'}</th>
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

        <div className="mt-6 rounded-xl border bg-white overflow-hidden">
          <div className="px-3 py-2 font-semibold bg-gray-50 border-b">{isAR ? 'قائمة المنتجات التي قاربت على النفاد' : 'Near to finish products'}</div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">{isAR ? 'المنتج' : 'Product'}</th>
                <th className="px-3 py-2 text-left">{isAR ? 'المخزون الحالي' : 'Current Stock'}</th>
              </tr>
            </thead>
            <tbody>
              {near.length === 0 ? (
                <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={3}>{isAR ? 'لا توجد منتجات قريبة من النفاد' : 'No near-to-finish products'}</td></tr>
              ) : near.map((n, idx) => (
                <tr key={(n.productId || n.slug || '') + idx} className="border-t">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/${locale}/admin/products?edit=${encodeURIComponent(n.slug || n.productId || '')}`}
                      className="text-blue-700 hover:underline"
                    >
                      {n.slug || n.productId}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{n.stock ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

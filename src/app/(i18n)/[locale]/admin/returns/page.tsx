'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type ReturnItem = {
  _id: string;
  orderId: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  createdAt?: string;
  order?: {
    _id: string;
    totals?: { total?: number; currency?: string };
    shippingInfo?: { name?: string; phone?: string };
    createdAt?: string;
  };
};

export default function AdminReturnsPage() {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const isAR = locale === 'ar';

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/returns?status=' + encodeURIComponent('requested'), { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      const list: ReturnItem[] = Array.isArray(data?.returns) ? data.returns : [];
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function extractReason(r: ReturnItem): string | undefined {
    return r.reason || r.notes || undefined;
  }

  return (
    <div className="space-y-4" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-2xl font-bold">{isAR ? 'لوحة التحكم • المرتجعات' : 'Admin • Returns'}</h1>
      </div>

      <div className="grid gap-3">
        {loading && <div className="text-gray-600">{isAR ? 'جارٍ التحميل...' : 'Loading...'}</div>}
        {!loading && items.length === 0 && <div className="text-gray-600">{isAR ? 'لا توجد مرتجعات' : 'No returns'}</div>}
        {items.map((r) => (
          <div key={r._id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="font-semibold">#{r._id.slice(-6)}</div>
              <div className="text-sm text-gray-700">{new Date(r.createdAt || '').toLocaleString()}</div>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{r.status}</span>
              {extractReason(r) && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 max-w-[300px] truncate">
                  {extractReason(r)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-800">{r.order?.totals?.total ?? 0} {r.order?.totals?.currency ?? 'EGP'}</div>
              <button onClick={() => router.push(`/${locale}/admin/returns/${r._id}`)} className="px-3 py-1.5 rounded border hover:bg-gray-50">{isAR ? 'فتح' : 'Open'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

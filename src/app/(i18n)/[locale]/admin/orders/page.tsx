'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Order = {
  _id: string;
  status: string;
  payment?: { status?: string };
  totals?: { total?: number; currency?: string };
  createdAt?: string;
  shippingInfo?: { name?: string; phone?: string };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);

  async function load() {
    setLoading(true);
    try {
      const url = status ? `/api/orders?status=${encodeURIComponent(status)}` : '/api/orders';
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin • Orders</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600">Status</label>
          <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border border-gray-300 rounded px-2 py-1">
            <option value="">All</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3">
        {loading && <div className="text-gray-600">Loading...</div>}
        {!loading && orders.length === 0 && <div className="text-gray-600">No orders</div>}
        {orders.map((o) => (
          <div key={o._id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="font-semibold">#{o._id.slice(-6)}</div>
              <div className="text-sm text-gray-700">{new Date(o.createdAt || '').toLocaleString()}</div>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{o.status}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-800">{o.totals?.total ?? 0} {o.totals?.currency ?? 'EGP'}</div>
              <button onClick={()=>router.push(`/${locale}/admin/orders/${o._id}`)} className="px-3 py-1.5 rounded border hover:bg-gray-50">Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

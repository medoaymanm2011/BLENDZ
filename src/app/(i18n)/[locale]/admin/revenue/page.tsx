'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type RevenueOrder = {
  _id: string;
  createdAt?: string;
  total: number;
  currency: string;
  status?: string;
  paymentStatus?: string;
};

export default function AdminRevenuePage() {
  const pathname = usePathname();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const isAR = locale === 'ar';

  const [orders, setOrders] = useState<RevenueOrder[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('EGP');
  const [mode, setMode] = useState<'gross' | 'net'>('gross');
  const [refundsTotal, setRefundsTotal] = useState<number>(0);
  const [netRevenue, setNetRevenue] = useState<number>(0);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to).toISOString());
      if (mode === 'net') params.set('mode', 'net');
      const qs = params.toString();
      const res = await fetch(`/api/admin/revenue${qs ? `?${qs}` : ''}` , { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setTotal(Number(data.totalRevenue || 0));
        setCurrency(String(data.currency || 'EGP'));
        setRefundsTotal(Number(data.refundsTotal || 0));
        setNetRevenue(Number(data.netRevenue || 0));
      } else {
        setOrders([]);
        setTotal(0);
        setRefundsTotal(0);
        setNetRevenue(0);
      }
    } catch {
      setOrders([]);
      setTotal(0);
      setRefundsTotal(0);
      setNetRevenue(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);

  function quickRange(days: number) {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - days);
    setFrom(fromDate.toISOString().slice(0, 10));
    setTo(now.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-4" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isAR ? (
            <>
              <span>لوحة التحكم</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:ms-1">الإيرادات</span>
            </>
          ) : (
            <>
              <span>Admin</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:ms-1">Revenue</span>
            </>
          )}
        </h1>
      </div>

      <div className={`grid gap-3 ${isAR ? 'text-right' : ''}`}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">{isAR ? 'الوضع' : 'Mode'}</label>
            <select value={mode} onChange={(e)=>setMode(e.target.value as 'gross'|'net')} className="border border-gray-300 rounded px-2 py-1">
              <option value="gross">{isAR ? 'إجمالي (قبل المرتجعات)' : 'Gross (before returns)'}</option>
              <option value="net">{isAR ? 'صافي (بعد المرتجعات)' : 'Net (after returns)'}</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">{isAR ? 'من تاريخ' : 'From'}</label>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border border-gray-300 rounded px-2 py-1" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">{isAR ? 'إلى تاريخ' : 'To'}</label>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border border-gray-300 rounded px-2 py-1" />
          </div>
          <button onClick={load} className="px-3 py-1.5 rounded border hover:bg-gray-50">{isAR ? 'تطبيق' : 'Apply'}</button>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={()=>quickRange(7)} className="px-2 py-1 rounded border hover:bg-gray-50">{isAR ? 'آخر 7 أيام' : 'Last 7d'}</button>
            <button onClick={()=>quickRange(30)} className="px-2 py-1 rounded border hover:bg-gray-50">{isAR ? 'آخر 30 يوم' : 'Last 30d'}</button>
            <button onClick={()=>{ setFrom(''); setTo(''); setTimeout(load, 0); }} className="px-2 py-1 rounded border hover:bg-gray-50">{isAR ? 'الكل' : 'All'}</button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 space-y-1">
          <div className="text-sm text-gray-600">{isAR ? (mode === 'net' ? 'صافي الإيرادات' : 'إجمالي الإيرادات') : (mode === 'net' ? 'Net Revenue' : 'Total Revenue')}</div>
          <div className="text-2xl font-bold">{(mode === 'net' ? netRevenue : total).toFixed(2)} {currency}</div>
          {mode === 'net' && (
            <div className="text-sm text-gray-600">
              {isAR ? 'إجمالي المرتجعات: ' : 'Refunds total: '}<span className="font-medium text-gray-800">{refundsTotal.toFixed(2)} {currency}</span>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-xl p-3 sm:p-4 overflow-x-auto">
          {loading && <div className="text-gray-600">{isAR ? 'جارٍ التحميل...' : 'Loading...'}</div>}
          {!loading && orders.length === 0 && <div className="text-gray-600">{isAR ? 'لا توجد بيانات' : 'No data'}</div>}
          {!loading && orders.length > 0 && (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className={`text-left py-2 ${isAR ? 'text-right' : 'text-left'}`}>{isAR ? 'الطلب' : 'Order'}</th>
                  <th className={`text-left py-2 ${isAR ? 'text-right' : 'text-left'}`}>{isAR ? 'التاريخ' : 'Date'}</th>
                  <th className={`text-left py-2 ${isAR ? 'text-right' : 'text-left'}`}>{isAR ? 'الحالة' : 'Status'}</th>
                  <th className={`text-left py-2 ${isAR ? 'text-right' : 'text-left'}`}>{isAR ? 'الدفع' : 'Payment'}</th>
                  <th className={`text-left py-2 ${isAR ? 'text-right' : 'text-left'}`}>{isAR ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="py-2">#{o._id.slice(-6)}</td>
                    <td className="py-2">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</td>
                    <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{o.status}</span></td>
                    <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{o.paymentStatus}</span></td>
                    <td className="py-2 font-medium">{o.total} {o.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

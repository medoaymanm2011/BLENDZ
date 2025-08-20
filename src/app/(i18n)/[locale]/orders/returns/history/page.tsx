"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type RawReturn = any;
type DisplayReturn = {
  id: string;
  orderId: string;
  date: string; // ISO
  status: string;
  itemsCount: number;
  reason?: string;
};

export default function ReturnHistoryPage() {
  const locale = useLocale();
  const router = useRouter();
  const [returns, setReturns] = useState<DisplayReturn[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vk_returns');
      const arr: RawReturn[] = raw ? JSON.parse(raw) : [];
      const normalized: DisplayReturn[] = arr.map((r: RawReturn) => ({
        id: String(r.id ?? ''),
        orderId: String(r.orderId ?? ''),
        date: String(r.createdAt ?? r.date ?? new Date().toISOString()),
        status: String(r.status ?? 'Pending'),
        itemsCount: Array.isArray(r.items) ? r.items.length : Number(r.items ?? 0),
        reason: r.reason ? String(r.reason) : undefined,
      }));
      normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReturns(normalized);
    } catch {
      setReturns([]);
    }
  }, []);

  const badge = (stRaw: string) => {
    const st = String(stRaw).toLowerCase();
    if (st === 'approved') return <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">{locale === 'ar' ? 'مقبول' : 'Approved'}</span>;
    if (st === 'rejected') return <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">{locale === 'ar' ? 'مرفوض' : 'Rejected'}</span>;
    if (st === 'refunded' || st === 'completed') return <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">{locale === 'ar' ? 'مكتمل' : 'Completed'}</span>;
    if (st === 'requested' || st === 'request' || st === 'return requested') return <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">{locale === 'ar' ? 'تم الطلب' : 'Requested'}</span>;
    return <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">{locale === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/${locale}/orders`} className="text-sm text-[#2F3E77] hover:underline">← {locale === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}</Link>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F3E77]"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v6h-6"/></svg>
          <h1 className="text-2xl font-bold text-[#2F3E77]">{locale === 'ar' ? 'سجل المرتجعات' : 'Return History'}</h1>
        </div>

        <section className="bg-white rounded-xl border">
          <div className="p-6">
            {returns.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-10 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#2F3E77]/10 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F3E77]"><path d="m3 7 5 5-5 5"/><path d="m13 7 5 5-5 5"/></svg>
                </div>
                <div className="text-lg font-semibold text-[#2F3E77] mb-1">{locale === 'ar' ? 'لا توجد طلبات إرجاع' : 'No Return Requests'}</div>
                <p className="text-sm text-gray-700 mb-5">{locale === 'ar' ? 'لم تقم بإنشاء أي مرتجعات بعد' : "You haven't requested any returns yet"}</p>
                <button onClick={() => router.push(`/${locale}/orders`)} className="px-4 py-2 rounded bg-[#2F3E77] text-white hover:brightness-95">
                  {locale === 'ar' ? 'عرض الطلبات' : 'View Orders'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between px-5 py-3">
                      <div className="font-medium text-gray-800">{locale === 'ar' ? 'إرجاع #' : 'Return #'}{r.id}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{new Date(r.date).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
                        {badge(r.status)}
                      </div>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-5 py-4 items-center">
                      <div className="text-sm">
                        <div className="text-gray-600 mb-1">{locale === 'ar' ? 'رقم الطلب' : 'Order ID'}</div>
                        <div className="text-gray-900">#{r.orderId}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-600 mb-1">{locale === 'ar' ? 'العناصر' : 'Items'}</div>
                        <div className="text-gray-900">{r.itemsCount}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-600 mb-1">{locale === 'ar' ? 'السبب' : 'Reason'}</div>
                        <div className="text-gray-900 truncate" title={r.reason || ''}>{r.reason || (locale === 'ar' ? '—' : '—')}</div>
                      </div>
                      <div className="flex md:justify-end">
                        <button className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">{locale === 'ar' ? 'تفاصيل' : 'View Details'}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

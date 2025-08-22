"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

// localStorage keys used by checkout flow (fallback when not logged in)
const LAST_ORDER_KEY = 'lastOrder';
const ORDERS_KEY = 'vk_orders';

type OrderItem = { productId: string; qty: number };
interface StoredOrder {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  shipping?: number;
  total: number;
  paymentMethod: string;
  status?: 'processing' | 'shipped' | 'delivered';
  paymentStatus?: 'pending' | 'paid' | 'cancelled';
  currency?: string;
}

export default function OrdersPage() {
  const locale = useLocale();
  const router = useRouter();
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  const nf = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }), [locale]);

  useEffect(() => {
    let active = true;
    // Try fetching from server for logged-in user
    (async () => {
      try {
        const res = await fetch('/api/my/orders', { cache: 'no-store', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const serverOrders = Array.isArray(data?.orders) ? data.orders : [];
          const mapped: StoredOrder[] = serverOrders.map((o: any) => ({
            id: String(o._id),
            date: o.createdAt || o.updatedAt || new Date().toISOString(),
            items: (o.items || []).map((it: any) => ({ productId: String(it.productId), qty: Number(it.qty || 0) })),
            subtotal: Number(o?.totals?.subtotal || 0),
            shipping: Number(o?.totals?.shipping || 0),
            total: Number(o?.totals?.total || 0),
            paymentMethod: String(o?.payment?.method || 'cod'),
            status: o?.status,
            paymentStatus: o?.payment?.status,
            currency: String(o?.totals?.currency || 'EGP'),
          }));
          // sort desc
          mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (active) setOrders(mapped);
          return;
        }
      } catch {
        // ignore and fallback to localStorage
      }

      // Fallback: load from localStorage (guest / offline)
      try {
        const listRaw = localStorage.getItem(ORDERS_KEY);
        const lastRaw = localStorage.getItem(LAST_ORDER_KEY);

        let list: StoredOrder[] = [];
        if (listRaw) {
          list = JSON.parse(listRaw) as StoredOrder[];
        }
        if (lastRaw) {
          const last = JSON.parse(lastRaw) as StoredOrder;
          if (!list.find((o) => o.id === last.id)) list.push(last);
        }

        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (active) setOrders(list);
      } catch {
        if (active) setOrders([]);
      }
    })();
    return () => { active = false; };
  }, []);

  const currency = (orders[0]?.currency) ?? (locale === 'ar' ? 'ج.م' : 'EGP');

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F3E77]"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
          <h1 className="text-3xl font-bold text-[#2F3E77]">{locale === 'ar' ? 'طلباتي' : 'My Orders'}</h1>
        </div>

        <div className="space-y-4">
          {orders.length === 0 && (
            <div className="rounded-xl border bg-gray-50 p-10 text-center">
              <div className="text-lg font-semibold text-[#2F3E77] mb-1">{locale === 'ar' ? 'لا توجد طلبات' : 'No Orders'}</div>
              <p className="text-sm text-gray-700 mb-5">{locale === 'ar' ? 'لم تقم بإجراء أي طلبات حتى الآن' : "You haven't placed any orders yet"}</p>
              <Link href={`/${locale}`} className="px-4 py-2 rounded bg-[#2F3E77] text-white hover:brightness-95">{locale === 'ar' ? 'تسوق الآن' : 'Shop Now'}</Link>
            </div>
          )}

          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Header Row */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="font-medium text-gray-800">{locale === 'ar' ? 'طلب #' : 'Order #'}{order.id}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{new Date(order.date).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}</span>
                  {(() => {
                    const raw = (order as any)?.status ?? (order as any)?.orderStatus ?? '';
                    const st = String(raw).toLowerCase();
                    const ps = order?.paymentStatus ? String(order.paymentStatus).toLowerCase() : '';
                    if (st.includes('cancel') || ps === 'cancelled') {
                      return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">{locale === 'ar' ? 'أُلغي' : 'Cancelled'}</span>;
                    }
                    if (st.includes('deliver')) {
                      return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{locale === 'ar' ? 'تم التسليم' : 'Delivered'}</span>;
                    }
                    if (st.includes('ship')) {
                      return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{locale === 'ar' ? 'تم الشحن' : 'Shipped'}</span>;
                    }
                    // default and also map Pending -> Processing
                    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">{locale === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>;
                  })()}
                  {(() => {
                    const ps = order?.paymentStatus ? String(order.paymentStatus).toLowerCase() : '';
                    return ps === 'pending';
                  })() && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">{locale === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                  )}
                </div>
              </div>
              <div className="h-px bg-gray-200" />

              {/* Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-5 py-4 items-center">
                <div className="text-sm">
                  <div className="text-gray-600 mb-1">{locale === 'ar' ? 'العناصر' : 'Items'}</div>
                  <div className="text-gray-900">{order.items?.reduce((a, b) => a + (b?.qty || 0), 0) || 0} {locale === 'ar' ? 'عنصر' : 'Items'}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-600 mb-1">Total</div>
                  <div className="text-gray-900">{nf.format(order.total)} {currency}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-600 mb-1">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</div>
                  <div className="text-gray-900">{order.paymentMethod}</div>
                </div>
                <div className="flex md:justify-end">
                  <button onClick={() => router.push(`/${locale}/orders/${order.id}`)} className="px-4 py-2 rounded-lg border text-sm text-[#2F3E77] border-[#2F3E77] hover:bg-[#2F3E77] hover:text-white">
                    {locale === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

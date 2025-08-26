'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Truck, Clock } from 'lucide-react';

type CartItem = { productId: string; qty: number; name?: string; price?: number; image?: string };

type Address = { fullName: string; phone: string; governorate: string; city: string; addressLine: string };

type StoredOrder = {
  id: string;
  date: string;
  paymentMethod: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | string;
  address: Address | null;
  items: CartItem[];
  subtotal: number;
  shipping?: number | null;
  total: number;
  currency: string;
  paymentStatus?: string;
  paymentRawMethod?: string;
  paymentChannel?: string;
  receiptUrl?: string | null;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const router = useRouter();
  const locale = useLocale();
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [retReason, setRetReason] = useState<string>('');
  const [retNotes, setRetNotes] = useState<string>('');
  // Processing refund request modal (InstaPay paid orders)
  const [showProcRefundModal, setShowProcRefundModal] = useState(false);
  const [rfName, setRfName] = useState('');
  const [rfPhone, setRfPhone] = useState('');
  const [rfAddress, setRfAddress] = useState('');
  const [rfReason, setRfReason] = useState('');
  const REASON_OPTIONS = useMemo(() => [
    locale === 'ar' ? 'مقاس غير مناسب' : 'Wrong size',
    locale === 'ar' ? 'عنصر تالف' : 'Damaged item',
    locale === 'ar' ? 'عنصر مختلف عما هو موضح' : 'Item not as described',
    locale === 'ar' ? 'وصل متأخراً' : 'Arrived late',
    locale === 'ar' ? 'أخرى' : 'Other',
  ], [locale]);

  useEffect(() => {
    let mounted = true;
    // 1) Load local copy first for instant UI
    let localCopy: StoredOrder | null = null;
    try {
      const raw = localStorage.getItem('lastOrder');
      if (raw) localCopy = JSON.parse(raw) as StoredOrder;
      if (mounted && localCopy) setOrder(localCopy);
    } catch {}

    // 2) Fetch from backend and merge
    (async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return; // keep local if unauthorized or not found
        const data = await res.json();
        const o = data?.order;
        if (!o) return;
        try { console.log('[OrderDetails] fetched payment:', o?.payment); } catch {}
        const mapped: StoredOrder = {
          id: String(o._id || id),
          date: new Date(o.createdAt || Date.now()).toISOString(),
          paymentMethod: (o.payment?.method === 'cod') ? (locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery') : (o.payment?.method || 'Payment'),
          status: String(o.status || 'processing').replace(/^(.)/, s=>s.toUpperCase()),
          address: o.shippingInfo ? {
            fullName: o.shippingInfo.name || '',
            phone: o.shippingInfo.phone || '',
            governorate: '',
            city: o.shippingInfo.city || '',
            addressLine: o.shippingInfo.address || '',
          } : null,
          // Use backend items for names/prices; fallback to local copy if missing
          items: (Array.isArray(o.items) && o.items.length > 0)
            ? o.items.map((it: any) => ({ productId: String(it.productId), qty: Number(it.qty||0), name: it.name, price: it.price, image: it.image }))
            : (localCopy?.items || []),
          subtotal: o.totals?.subtotal ?? localCopy?.subtotal ?? 0,
          shipping: o.totals?.shipping ?? localCopy?.shipping ?? 0,
          total: o.totals?.total ?? localCopy?.total ?? 0,
          currency: o.totals?.currency ?? localCopy?.currency ?? (locale === 'ar' ? 'ج.م' : 'EGP'),
          paymentStatus: o.payment?.status || 'pending',
          paymentRawMethod: o.payment?.method || '',
          paymentChannel: o.payment?.channel || '',
          receiptUrl: o.payment?.receiptUrl || null,
        };
        if (mounted) setOrder(mapped);
      } catch {
        // ignore network errors; local view remains
      }
    })();

    return () => { mounted = false; };
  }, [id, locale]);

  // Enrich legacy orders whose items are missing images
  useEffect(() => {
    if (!order || !Array.isArray(order.items)) return;
    const missing = order.items.filter((it) => !it.image && it.productId).map((it) => String(it.productId));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids: missing })
        });
        const data = await res.json();
        const products: any[] = Array.isArray(data?.products) ? data.products : [];
        const map = new Map<string, any>();
        for (const p of products) map.set(String(p._id), p);
        const updated = order.items.map((it) => {
          if (it.image || !it.productId) return it;
          const p = map.get(String(it.productId));
          const first = Array.isArray(p?.images) && p.images.length ? (p.images[0]?.url || p.images[0]) : undefined;
          return first ? { ...it, image: first } : it;
        });
        if (!cancelled) setOrder({ ...order, items: updated });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [order]);

  const nf = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }), [locale]);
  const currency = order?.currency ?? (locale === 'ar' ? 'ج.م' : 'EGP');

  // Progress computation based on backend status
  const { progressPct, isProcessing, isShipped, isDelivered } = useMemo(() => {
    const st = String(order?.status || '').toLowerCase();
    const isDelivered = st === 'delivered';
    const isShipped = st === 'shipped' || isDelivered;
    const isProcessing = st === 'processing' || st === '' || (!isShipped && !isDelivered);
    const progressPct = isDelivered ? 100 : isShipped ? 66 : 33;
    return { progressPct, isProcessing, isShipped, isDelivered };
  }, [order?.status]);

  const cancellable = useMemo(() => {
    const st = order?.status ? String(order.status).toLowerCase() : 'pending';
    return st !== 'shipped' && st !== 'delivered' && st !== 'cancelled';
  }, [order?.status]);

  // Allow refund request only during processing when InstaPay paid
  const canRefundProcessing = useMemo(() => {
    if (!order) return false;
    const st = String(order.status || '').toLowerCase();
    const pstat = String(order.paymentStatus || '').toLowerCase();
    const channel = String(order.paymentChannel || '').toLowerCase();
    return st === 'processing' && pstat === 'paid' && channel === 'instapay';
  }, [order]);

  // Return eligibility: allow only if delivered and within 30 days, and not already cancelled/returned
  const returnEligible = useMemo(() => {
    if (!order) return false;
    const st = String(order.status ?? '').toLowerCase();
    if (st === 'cancelled' || st === 'return requested' || st === 'returned') return false;
    if (st !== 'delivered') return false;
    const created = new Date(order.date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }, [order]);

  const handleCancel = async () => {
    if (!order || !cancellable) return;
    // Try backend cancel if possible
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const next = { ...order, status: 'Cancelled' as const };
        try {
          localStorage.setItem('lastOrder', JSON.stringify(next));
          const raw = localStorage.getItem('vk_orders');
          if (raw) {
            const arr = JSON.parse(raw) as any[];
            const idx = arr.findIndex((o) => String(o.id) === String(order.id));
            if (idx !== -1) {
              arr[idx] = { ...arr[idx], status: 'Cancelled', paymentStatus: 'cancelled' };
              localStorage.setItem('vk_orders', JSON.stringify(arr));
            }
          }
        } catch {}
        setOrder(next);
        return;
      }
    } catch {}
    // Fallback to local-only cancel
    const next = { ...order, status: 'Cancelled' as const };
    try {
      localStorage.setItem('lastOrder', JSON.stringify(next));
      const raw = localStorage.getItem('vk_orders');
      if (raw) {
        const arr = JSON.parse(raw) as any[];
        const idx = arr.findIndex((o) => String(o.id) === String(order.id));
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], status: 'Cancelled', paymentStatus: 'cancelled' };
          localStorage.setItem('vk_orders', JSON.stringify(arr));
        }
      }
    } catch {}
    setOrder(next);
  };

  const handleRequestReturn = () => {
    if (!order || !returnEligible) return;
    const reason = (retReason || '').trim();
    const record = {
      id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : String(Date.now()),
      orderId: String(order.id),
      items: order.items ?? [],
      reason,
      notes: (retNotes || '').trim(),
      createdAt: new Date().toISOString(),
      status: 'Requested',
    };
    (async () => {
      // 1) Try backend API
      try {
        const res = await fetch(`/api/orders/${order.id}/return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason, notes: (retNotes || '').trim() })
        });
        if (res.ok) {
          const data = await res.json();
          const saved = data?.order;
          const next = { ...order, status: 'Return Requested' as const };
          // update local caches
          try {
            const raw = localStorage.getItem('vk_returns');
            const list = raw ? (JSON.parse(raw) as any[]) : [];
            list.unshift(record);
            localStorage.setItem('vk_returns', JSON.stringify(list));
            localStorage.setItem('lastOrder', JSON.stringify(next));
            const ordersRaw = localStorage.getItem('vk_orders');
            if (ordersRaw) {
              const arr = JSON.parse(ordersRaw) as any[];
              const idx = arr.findIndex((o) => String(o.id) === String(order.id));
              if (idx !== -1) {
                arr[idx] = { ...arr[idx], status: 'Return Requested' };
                localStorage.setItem('vk_orders', JSON.stringify(arr));
              }
            }
          } catch {}
          setOrder(next);
          setShowReturnModal(false);
          router.push(`/${locale}/orders/returns/history`);
          return;
        }
      } catch {}

      // 2) Fallback to local-only behavior
      try {
        const raw = localStorage.getItem('vk_returns');
        const list = raw ? (JSON.parse(raw) as any[]) : [];
        list.unshift(record);
        localStorage.setItem('vk_returns', JSON.stringify(list));
        const next = { ...order, status: 'Return Requested' as const };
        localStorage.setItem('lastOrder', JSON.stringify(next));
        const ordersRaw = localStorage.getItem('vk_orders');
        if (ordersRaw) {
          const arr = JSON.parse(ordersRaw) as any[];
          const idx = arr.findIndex((o) => String(o.id) === String(order.id));
          if (idx !== -1) {
            arr[idx] = { ...arr[idx], status: 'Return Requested' };
            localStorage.setItem('vk_orders', JSON.stringify(arr));
          }
        }
        setOrder(next);
      } catch {}
      setShowReturnModal(false);
      router.push(`/${locale}/orders/returns/history`);
    })();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-start mb-3">
          <Link href={`/${locale}/orders`} className="text-sm text-[#2F3E77] hover:underline">← {locale === 'ar' ? 'العودة للطلبات' : 'Back to Orders'}</Link>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2F3E77]">{locale === 'ar' ? 'طلب #' : 'Order #'}{id}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{locale === 'ar' ? 'حالة الطلب:' : 'Order Status:'}</span>
            {(() => {
              const st = order?.status ? String(order.status).toLowerCase() : 'pending';
              if (st === 'cancelled') return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">{locale === 'ar' ? 'أُلغي' : 'Cancelled'}</span>;
              if (st === 'return requested') return <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">{locale === 'ar' ? 'تم طلب الإرجاع' : 'Return Requested'}</span>;
              if (st === 'delivered') return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">{locale === 'ar' ? 'تم التسليم' : 'Delivered'}</span>;
              if (st === 'shipped') return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">{locale === 'ar' ? 'تم الشحن' : 'Shipped'}</span>;
              return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">{locale === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>;
            })()}
          </div>
        </div>
        <div className="h-px bg-gray-200 mt-4" />

        <div className="flex items-center justify-between mt-2">
          <div className="text-sm font-semibold text-[#2F3E77]">{locale === 'ar' ? 'تقدم الطلب' : 'Order Progress'}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/${locale}/orders/returns/history`)} className="inline-flex items-center text-sm px-3 py-1 border rounded-lg text-[#2F3E77] border-[#2F3E77] hover:bg-[#2F3E77] hover:text-white">
              {locale === 'ar' ? 'سجل المرتجعات' : 'Return History'}
            </button>
            <button onClick={() => setShowReturnModal(true)} disabled={!returnEligible} className={`inline-flex items-center text-sm px-3 py-1 rounded-lg text-white ${returnEligible ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}>
              {returnEligible ? (locale === 'ar' ? 'طلب إرجاع' : 'Request Return') : (locale === 'ar' ? 'غير مؤهل للإرجاع' : 'Not Eligible')}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-2 bg-white rounded-xl border p-5">
          <div className="h-2 bg-gray-200 rounded-full mb-6">
            <div className="h-2 bg-[#2F3E77] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="grid grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <Clock className={`w-6 h-6 ${isProcessing ? 'text-[#2F3E77]' : 'text-gray-500'}`} />
              <span className={`text-sm ${isProcessing ? 'font-semibold text-[#2F3E77]' : 'text-gray-800'}`}>{locale === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className={`w-6 h-6 ${isShipped ? 'text-[#2F3E77]' : 'text-gray-500'}`} />
              <span className={`text-sm ${isShipped ? 'font-semibold text-[#2F3E77]' : 'text-gray-800'}`}>{locale === 'ar' ? 'تم الشحن' : 'Shipped'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className={`w-6 h-6 ${isDelivered ? 'text-[#2F3E77]' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDelivered ? 'font-semibold text-[#2F3E77]' : 'text-gray-800'}`}>{locale === 'ar' ? 'تم التسليم' : 'Delivered'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Order Details */}
          <div className="bg-white rounded-xl border">
            <div className="px-5 py-3 border-b font-semibold text-[#2F3E77] flex items-center gap-2">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-[#2F3E77] text-white text-xs">ℹ︎</span>
              {locale === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#2F3E77] font-medium">{locale === 'ar' ? 'تاريخ الطلب' : 'Order Date'}</span>
                <span className="text-gray-800">{order ? new Date(order.date).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US') : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2F3E77] font-medium">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
                <span className="text-gray-800">{order?.paymentMethod ?? (locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery')}</span>
              </div>
              {order?.receiptUrl ? (
                <div className="pt-2">
                  <div className="mb-2 text-[#2F3E77] font-medium">{locale === 'ar' ? 'إيصال التحويل' : 'Transfer Receipt'}</div>
                  <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={order.receiptUrl}
                      alt="receipt"
                      referrerPolicy="no-referrer"
                      className="max-h-64 max-w-full object-contain rounded border"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </a>
                  <div className="mt-2 text-xs">
                    <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="text-[#2F3E77] underline">
                      {locale === 'ar' ? 'فتح الإيصال في تبويب جديد' : 'Open receipt in new tab'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-xs text-gray-600">{locale === 'ar' ? 'لم يتم رفع إيصال حتى الآن.' : 'No receipt uploaded yet.'}</div>
              )}

      {/* Processing Refund Request Modal */}
      {showProcRefundModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowProcRefundModal(false)} />
          <div className="relative z-10 flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#2F3E77]">{locale === 'ar' ? 'طلب استرجاع المبلغ (أثناء المعالجة)' : 'Request Refund (Processing stage)'}</h3>
                  <p className="text-sm text-gray-500">{locale === 'ar' ? 'يرجى إدخال الاسم ورقم الهاتف والعنوان كما على التحويل.' : 'Please enter name, phone and address as per the transfer.'}</p>
                </div>
                <button onClick={() => setShowProcRefundModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'الاسم' : 'Full Name'}</label>
                  <input value={rfName} onChange={(e)=>setRfName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-[#2F3E77]" />
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input value={rfPhone} onChange={(e)=>setRfPhone(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-[#2F3E77]" />
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'العنوان' : 'Address'}</label>
                  <textarea value={rfAddress} onChange={(e)=>setRfAddress(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 border rounded-lg text-[#2F3E77]" />
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'سبب الاسترجاع (اختياري)' : 'Reason (optional)'}</label>
                  <input value={rfReason} onChange={(e)=>setRfReason(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg text-[#2F3E77]" />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
                <button onClick={() => setShowProcRefundModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button
                  onClick={async () => {
                    if (!order) return;
                    const name = rfName.trim();
                    const phone = rfPhone.trim();
                    const address = rfAddress.trim();
                    if (!name || !phone || !address) { alert(locale === 'ar' ? 'يرجى إدخال الاسم والهاتف والعنوان' : 'Please fill name, phone, and address'); return; }
                    try {
                      const res = await fetch(`/api/orders/${order.id}/refund-request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ name, phone, address, reason: rfReason.trim() })
                      });
                      if (res.ok) {
                        setShowProcRefundModal(false);
                        setRfName(''); setRfPhone(''); setRfAddress(''); setRfReason('');
                        alert(locale === 'ar' ? 'تم إرسال طلب الاسترجاع إلى الإدارة.' : 'Refund request has been sent to admin.');
                      } else {
                        const data = await res.json().catch(() => ({}));
                        alert(data?.error || (locale === 'ar' ? 'تعذر إرسال الطلب' : 'Failed to submit request'));
                      }
                    } catch {
                      alert(locale === 'ar' ? 'تعذر إرسال الطلب' : 'Failed to submit request');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${canRefundProcessing ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-white cursor-not-allowed'}`}
                  disabled={!canRefundProcessing}
                >
                  {locale === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
              {order?.receiptUrl ? (
                <div className="mt-1 text-[11px] text-gray-600 break-all">
                  {locale === 'ar' ? 'رابط الإيصال:' : 'Receipt URL:'} {order.receiptUrl}
                </div>
              ) : null}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border">
            <div className="px-5 py-3 border-b font-semibold text-[#2F3E77] flex items-center gap-2">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-[#2F3E77] text-white">🏠</span>
              {locale === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
            </div>
            <div className="p-5 text-sm space-y-2">
              {order?.address ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {order.address.governorate && <span className="px-2 py-1 rounded border border-[#2F3E77] text-[#2F3E77] bg-[#2F3E77]/5">{order.address.governorate}</span>}
                    {order.address.city && <span className="px-2 py-1 rounded border border-[#2F3E77] text-[#2F3E77] bg-[#2F3E77]/5">{order.address.city}</span>}
                  </div>
                  {order.address.addressLine && (
                    <div className="mt-2 p-3 rounded bg-gray-50 text-gray-700">{order.address.addressLine}</div>
                  )}
                </>
              ) : (
                <div className="text-gray-500">{locale === 'ar' ? 'لا يوجد عنوان' : 'No address provided'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border mt-6">
          <div className="px-5 py-3 border-b font-semibold text-[#2F3E77] flex items-center gap-2">
            <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-[#2F3E77] text-white">📦</span>
            {locale === 'ar' ? 'عناصر الطلب' : 'Order Items'}
          </div>
          <div className="p-5">
            {order?.items?.length ? (
              <div className="space-y-4">
                {order.items.map((ci, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {ci.image ? (
                        <div className="w-10 h-10 rounded bg-gray-100" style={{ backgroundImage: `url(${ci.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">📦</div>
                      )}
                      <div>
                        <div className="font-medium text-[#2F3E77]">{ci.name || (locale === 'ar' ? 'عنصر' : 'Item')}</div>
                        <div className="text-xs text-gray-700">{locale === 'ar' ? 'الكمية' : 'Quantity'}: {ci.qty}</div>
                      </div>
                    </div>
                    <div className="text-sm text-right min-w-[90px] text-[#2F3E77] font-semibold">{nf.format(ci.price ?? 0)} {currency}</div>
                  </div>
                ))}

                <div className="border-t pt-4 mt-2 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#2F3E77] font-medium">Subtotal</span><span className="min-w-[90px] text-right text-gray-900">{nf.format(order.subtotal)} {currency}</span></div>
                  <div className="flex justify-between"><span className="text-[#2F3E77] font-medium">Shipping</span><span className="min-w-[90px] text-right text-gray-900">{nf.format(order.shipping ?? 0)} {currency}</span></div>
                  <div className="flex justify-between font-semibold text-[#2F3E77]"><span>Total</span><span className="min-w-[90px] text-right text-[#2F3E77]">{nf.format(order.total)} {currency}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-gray-700">{locale === 'ar' ? 'لا توجد عناصر' : 'No items'}</div>
            )}
          </div>
        </div>

        {/* Payment receipt section removed: now handled at checkout */}

        {/* Cancellation Policy */}
        <div className="mt-6">
          <div className="rounded-xl border bg-white">
            <div className="px-5 py-3 border-b font-semibold text-[#2F3E77] flex items-center gap-2">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded bg-yellow-500 text-white">!</span>
              {locale === 'ar' ? 'سياسة الإلغاء' : 'Cancellation Policy'}
            </div>
            <div className="p-5">
              <div className="rounded border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm p-3">
                {locale === 'ar'
                  ? 'يمكنك إلغاء الطلب أثناء مرحلة المعالجة. بمجرد تغير الحالة إلى "تم الشحن" لا يمكن إلغاؤه.'
                  : "You can cancel your order while it's still in the processing stage. Once the order status changes to 'Shipped', it can no longer be cancelled."}
              </div>
              <div className="text-center mt-4">
                <button onClick={handleCancel} disabled={!cancellable} className={`px-4 py-2 rounded text-white ${cancellable ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                  {cancellable ? (locale === 'ar' ? 'إلغاء الطلب' : 'Cancel Order') : (locale === 'ar' ? 'لا يمكن الإلغاء' : 'Cannot Cancel')}
                </button>
                <button
                  onClick={() => setShowProcRefundModal(true)}
                  disabled={!canRefundProcessing}
                  className={`ml-3 px-4 py-2 rounded text-white ${canRefundProcessing ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  {canRefundProcessing ? (locale === 'ar' ? 'طلب استرجاع (InstaPay)' : 'Request Refund (InstaPay)') : (locale === 'ar' ? 'غير مؤهل للاسترجاع' : 'Not Eligible for Refund')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-8">
          <div className="text-gray-600 mb-3">{locale === 'ar' ? 'شكراً لطلبك!' : 'Thank You for Your Order!'}</div>
          <button onClick={() => router.push(`/${locale}`)} className="px-4 py-2 rounded bg-[#2F3E77] text-white">{locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</button>
        </div>
      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReturnModal(false)} />
          <div className="relative z-10 flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#2F3E77]">{locale === 'ar' ? 'تأكيد طلب الإرجاع' : 'Confirm Return Request'}</h3>
                  <p className="text-sm text-gray-500">{locale === 'ar' ? 'رجاءً اختر سبب الإرجاع وأضف ملاحظات اختيارية.' : 'Please select a reason and add optional notes.'}</p>
                </div>
                <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'سبب الإرجاع' : 'Return Reason'}</label>
                  <select
                    value={retReason}
                    onChange={(e) => setRetReason(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-[#2F3E77]"
                  >
                    <option value="">{locale === 'ar' ? 'اختر سبباً' : 'Select a reason'}</option>
                    {REASON_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional Notes (optional)'}</label>
                  <textarea
                    value={retNotes}
                    onChange={(e) => setRetNotes(e.target.value)}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border rounded-lg placeholder-[#2F3E77] text-[#2F3E77] caret-[#2F3E77]"
                    placeholder={locale === 'ar' ? 'اكتب التفاصيل هنا...' : 'Add details here...'}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
                <button onClick={() => setShowReturnModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleRequestReturn} disabled={!retReason} className={`px-4 py-2 rounded-lg ${retReason ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-white cursor-not-allowed'}`}>{locale === 'ar' ? 'تأكيد' : 'Confirm'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      </main>

      <Footer />
    </div>
  );
}

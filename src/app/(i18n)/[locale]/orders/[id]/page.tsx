'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { products as productsData } from '@/data/products';
import { CheckCircle2, Truck, Clock } from 'lucide-react';

type CartItem = { productId: number; qty: number };

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
  const REASON_OPTIONS = useMemo(() => [
    locale === 'ar' ? 'مقاس غير مناسب' : 'Wrong size',
    locale === 'ar' ? 'عنصر تالف' : 'Damaged item',
    locale === 'ar' ? 'عنصر مختلف عما هو موضح' : 'Item not as described',
    locale === 'ar' ? 'وصل متأخراً' : 'Arrived late',
    locale === 'ar' ? 'أخرى' : 'Other',
  ], [locale]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastOrder');
      if (raw) {
        const parsed: StoredOrder = JSON.parse(raw);
        setOrder(parsed);
      }
    } catch {}
  }, []);

  const nf = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }), [locale]);
  const currency = order?.currency ?? (locale === 'ar' ? 'ج.م' : 'EGP');

  const cancellable = useMemo(() => {
    const st = order?.status ? String(order.status).toLowerCase() : 'pending';
    return st !== 'shipped' && st !== 'delivered' && st !== 'cancelled';
  }, [order?.status]);

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

  const handleCancel = () => {
    if (!order || !cancellable) return;
    const next = { ...order, status: 'Cancelled' as const };
    try {
      // Update lastOrder
      localStorage.setItem('lastOrder', JSON.stringify(next));
      // Update vk_orders array if present
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
    try {
      // Save return record
      const raw = localStorage.getItem('vk_returns');
      const list = raw ? (JSON.parse(raw) as any[]) : [];
      list.unshift(record);
      localStorage.setItem('vk_returns', JSON.stringify(list));

      // Update order status locally
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
    // Navigate to returns history
    router.push(`/${locale}/orders/returns/history`);
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
            <div className="h-2 bg-[#2F3E77] rounded-full" style={{ width: '40%' }} />
          </div>
          <div className="grid grid-cols-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-6 h-6 text-[#2F3E77]" />
              <span className="text-sm font-semibold text-[#2F3E77]">{locale === 'ar' ? 'قيد المعالجة' : 'Processing'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-6 h-6 text-gray-700" />
              <span className="text-sm text-gray-800">{locale === 'ar' ? 'تم الشحن' : 'Shipped'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="w-6 h-6 text-gray-700" />
              <span className="text-sm text-gray-800">{locale === 'ar' ? 'تم التسليم' : 'Delivered'}</span>
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
                {order.items.map((ci, idx) => {
                  const product = productsData.find(p => p.id === ci.productId);
                  if (!product) return null;
                  const name = locale === 'ar' ? product.name.ar : product.name.en;
                  return (
                    <div key={idx} className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">📦</div>
                        <div>
                          <div className="font-medium text-[#2F3E77]">{name}</div>
                          <div className="text-xs text-gray-700">{locale === 'ar' ? 'الكمية' : 'Quantity'}: {ci.qty}</div>
                        </div>
                      </div>
                      <div className="text-sm text-right min-w-[90px] text-[#2F3E77] font-semibold">{nf.format(product.price)} {currency}</div>
                    </div>
                  );
                })}

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

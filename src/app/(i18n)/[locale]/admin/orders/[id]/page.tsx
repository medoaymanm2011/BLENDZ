'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import { useToast } from '@/context/ToastContext';

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const isAR = locale === 'ar';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [newReceiptUrl, setNewReceiptUrl] = useState('');
  const [savingReceipt, setSavingReceipt] = useState(false);
  const { confirm } = useConfirmDialog();
  const { showToastCustom } = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      setOrder(data.order);
      setStatus(data.order?.status || 'processing');
      setTrackingNumber(data.order?.tracking?.number || '');
      setProvider(data.order?.tracking?.provider || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  async function saveReceiptUrl() {
    if (!params?.id) return;
    const url = (newReceiptUrl || '').trim();
    if (!url) {
      showToastCustom({ variant: 'danger', title: isAR ? 'أدخل رابط الإيصال' : 'Enter receipt URL' });
      return;
    }
    setSavingReceipt(true);
    try {
      const res = await fetch(`/api/orders/${params.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, payment: { ...(prev?.payment||{}), receiptUrl: url } }));
        setNewReceiptUrl('');
        showToastCustom({ variant: 'success', title: isAR ? 'تم حفظ الإيصال' : 'Receipt saved' });
      } else {
        showToastCustom({ variant: 'danger', title: isAR ? 'فشل الحفظ' : 'Save failed', description: data?.error || '' });
      }
    } catch (e) {
      console.error(e);
      showToastCustom({ variant: 'danger', title: isAR ? 'خطأ بالشبكة' : 'Network error' });
    } finally {
      setSavingReceipt(false);
    }
  }

  async function markAsPaid() {
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentStatus: 'paid' }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        showToastCustom({ variant: 'success', title: isAR ? 'تم تأكيد الدفع' : 'Payment marked as paid' });
      } else {
        showToastCustom({ variant: 'danger', title: isAR ? 'فشل التحديث' : 'Update failed', description: data.error || '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  }

  async function approveReturn() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'returned', note: note || (isAR ? 'تمت الموافقة على الإرجاع' : 'Return approved') }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setStatus('returned');
        setNote('');
        showToastCustom({ variant: 'success', title: isAR ? 'تمت الموافقة على الإرجاع' : 'Return approved' });
      } else {
        showToastCustom({ variant: 'danger', title: isAR ? 'فشل العملية' : 'Action failed', description: data.error || '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }
  async function rejectReturn() {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'delivered', note: note || (isAR ? 'تم رفض الإرجاع' : 'Return rejected') }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setStatus('delivered');
        setNote('');
        showToastCustom({ variant: 'success', title: isAR ? 'تم رفض الإرجاع' : 'Return rejected' });
      } else {
        showToastCustom({ variant: 'danger', title: isAR ? 'فشل العملية' : 'Action failed', description: data.error || '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params?.id]);

  // Enrich legacy orders missing item images by fetching products in batch
  useEffect(() => {
    if (!order || !Array.isArray(order.items)) return;
    const missing = order.items.filter((it: any) => !it?.image && it?.productId).map((it: any) => String(it.productId));
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
        const updatedItems = order.items.map((it: any) => {
          if (it.image || !it.productId) return it;
          const p = map.get(String(it.productId));
          const firstImage = Array.isArray(p?.images) && p.images.length ? (p.images[0]?.url || p.images[0]) : undefined;
          return firstImage ? { ...it, image: firstImage } : it;
        });
        if (!cancelled) setOrder({ ...order, items: updatedItems });
      } catch {
        // ignore enrichment errors
      }
      return () => { cancelled = true; };
    })();
  }, [order]);

  async function updateStatus(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, trackingNumber, provider, note }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setNote('');
      } else {
        showToastCustom({
          variant: 'danger',
          title: locale === 'ar' ? 'فشل التحديث' : 'Update failed',
          description: data.error || (locale === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error')
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder() {
    const ok = await confirm({
      variant: 'danger',
      title: locale === 'ar' ? 'إلغاء الطلب؟' : 'Cancel order?',
      message: locale === 'ar' ? 'سيتم إلغاء هذا الطلب نهائيًا.' : 'This order will be cancelled permanently.',
      confirmText: locale === 'ar' ? 'إلغاء' : 'Cancel',
      cancelText: locale === 'ar' ? 'تراجع' : 'Back',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        showToastCustom({ title: locale === 'ar' ? 'تم إلغاء الطلب' : 'Order cancelled', variant: 'success' });
      } else {
        showToastCustom({ variant: 'danger', title: locale === 'ar' ? 'تعذّر الإلغاء' : 'Cancel failed', description: data.error || '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-600">{isAR ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  if (!order) return <div className="text-gray-600">{isAR ? 'غير موجود' : 'Not found'}</div>;

  return (
    <div className="space-y-6" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-2xl font-bold">{isAR ? 'الطلب' : 'Order'} #{String(order._id).slice(-6)}</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>router.push(`/${locale}/admin/orders`)} className="px-3 py-1.5 rounded border hover:bg-gray-50">{isAR ? 'رجوع' : 'Back'}</button>
          <button onClick={cancelOrder} disabled={saving || order.status==='cancelled'} className="px-3 py-1.5 rounded border text-red-600 hover:bg-red-50 disabled:opacity-50">{isAR ? 'إلغاء' : 'Cancel'}</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">{isAR ? 'العناصر' : 'Items'}</div>
            <div className="divide-y">
              {order.items?.map((it: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded" style={{backgroundImage:`url(${it.image||''})`, backgroundSize:'cover', backgroundPosition:'center'}} />
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-600">{isAR ? '×' : 'x'}{it.qty}</div>
                    </div>
                  </div>
                  <div className="text-sm">{it.price} {order.totals?.currency || 'EGP'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">{isAR ? 'الشحن' : 'Shipping'}</div>
            <div className="text-sm text-gray-800">
              <div>{order.shippingInfo?.name}</div>
              <div>{order.shippingInfo?.phone}</div>
              {order.shippingInfo?.city && <div>{order.shippingInfo.city}</div>}
              {order.shippingInfo?.address && <div>{order.shippingInfo.address}</div>}
              {order.shippingInfo?.notes && <div className="text-gray-600">{order.shippingInfo.notes}</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">{isAR ? 'الملخص' : 'Summary'}</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>{isAR ? 'الإجمالي الفرعي' : 'Subtotal'}</span><span>{order.totals?.subtotal} {order.totals?.currency}</span></div>
              <div className="flex justify-between"><span>{isAR ? 'الشحن' : 'Shipping'}</span><span>{order.totals?.shipping} {order.totals?.currency}</span></div>
              <div className="flex justify-between font-semibold"><span>{isAR ? 'الإجمالي' : 'Total'}</span><span>{order.totals?.total} {order.totals?.currency}</span></div>
              <div className="flex justify-between"><span>{isAR ? 'الحالة' : 'Status'}</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{order.status}</span></div>
              <div className="flex justify-between"><span>{isAR ? 'الدفع' : 'Payment'}</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{order.payment?.status}</span></div>
            </div>
          </div>

          {/* Payment Receipt & Actions */}
          <div className="border rounded-xl p-4 space-y-3">
            <div className="font-semibold">{isAR ? 'إيصال الدفع' : 'Payment Receipt'}</div>
            {order.payment?.receiptUrl ? (
              <div className="space-y-2">
                <a href={order.payment.receiptUrl} target="_blank" rel="noreferrer" className="inline-block">
                  <img src={order.payment.receiptUrl} alt="receipt" className="max-h-64 rounded border" />
                </a>
                <div className="text-xs text-gray-600 break-all">{order.payment.receiptUrl}</div>
              </div>
            ) : (
              <div className="text-gray-600 text-sm">{isAR ? 'لا يوجد إيصال مرفوع' : 'No receipt uploaded yet'}</div>
            )}

            {/* Admin attach/replace receipt URL */}
            <div className="mt-2 space-y-2">
              <input
                value={newReceiptUrl}
                onChange={(e)=>setNewReceiptUrl(e.target.value)}
                placeholder={isAR ? 'ألصق رابط صورة الإيصال' : 'Paste receipt image URL'}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveReceiptUrl}
                  disabled={savingReceipt || !newReceiptUrl.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 disabled:opacity-50"
                >
                  {savingReceipt ? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (isAR ? 'حفظ الإيصال' : 'Save Receipt')}
                </button>
                {order.payment?.receiptUrl && (
                  <button
                    onClick={()=>{ setOrder((prev:any)=>({ ...prev, payment: { ...(prev?.payment||{}), receiptUrl: null }})); setNewReceiptUrl(''); }}
                    className="px-4 py-2 rounded border"
                    type="button"
                  >
                    {isAR ? 'إزالة محليًا' : 'Clear (local)'}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={markAsPaid}
              disabled={paying || order.payment?.status === 'paid'}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50"
            >
              {paying ? (isAR ? 'جارٍ التأكيد...' : 'Confirming...') : (isAR ? 'تأكيد الدفع (مدفوع)' : 'Mark as Paid')}
            </button>
          </div>

          <form onSubmit={updateStatus} className="border rounded-xl p-4 space-y-3">
            <div className="font-semibold">{isAR ? 'تحديث الحالة' : 'Update Status'}</div>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2">
              <option value="processing">{isAR ? 'قيد المعالجة' : 'Processing'}</option>
              <option value="shipped">{isAR ? 'تم الشحن' : 'Shipped'}</option>
              <option value="delivered">{isAR ? 'تم التسليم' : 'Delivered'}</option>
              <option value="cancelled">{isAR ? 'ملغي' : 'Cancelled'}</option>
              <option value="return requested">{isAR ? 'طلب إرجاع' : 'Return Requested'}</option>
              <option value="returned">{isAR ? 'تم الإرجاع' : 'Returned'}</option>
            </select>
            <div className="grid grid-cols-1 gap-2">
              <input value={trackingNumber} onChange={(e)=>setTrackingNumber(e.target.value)} placeholder={isAR ? 'رقم التتبع (اختياري)' : 'Tracking number (optional)'} className="border border-gray-300 rounded px-3 py-2" />
              <input value={provider} onChange={(e)=>setProvider(e.target.value)} placeholder={isAR ? 'شركة الشحن (مثل Aramex)' : 'Provider (e.g. Aramex)'} className="border border-gray-300 rounded px-3 py-2" />
              <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder={isAR ? 'ملاحظة (اختياري)' : 'Note (optional)'} className="border border-gray-300 rounded px-3 py-2" />
            </div>
            <button disabled={saving} className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50">{saving? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (isAR ? 'حفظ' : 'Save')}</button>
          </form>

          {/* Quick actions for return requested */}
          {String(order.status).toLowerCase() === 'return requested' && (
            <div className="border rounded-xl p-4 space-y-2">
              <div className="font-semibold">{isAR ? 'إجراءات الإرجاع السريعة' : 'Return Quick Actions'}</div>
              <button
                onClick={approveReturn}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2">
                {isAR ? 'الموافقة على الإرجاع' : 'Approve Return'}
              </button>
              <button
                onClick={rejectReturn}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2">
                {isAR ? 'رفض الإرجاع' : 'Reject Return'}
              </button>
            </div>
          )}

          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-2">{isAR ? 'الخط الزمني' : 'Timeline'}</div>
            <div className="space-y-2 text-sm">
              {(order.tracking?.history || []).slice().reverse().map((ev: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{ev.status}</div>
                    {ev.note && <div className="text-gray-700 whitespace-pre-wrap">{ev.note}</div>}
                  </div>
                  <div className="text-gray-600 whitespace-nowrap">{new Date(ev.ts).toLocaleString()}</div>
                </div>
              ))}
              {(!order.tracking?.history || order.tracking.history.length===0) && <div className="text-gray-600">{isAR ? 'لا توجد أحداث' : 'No events'}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

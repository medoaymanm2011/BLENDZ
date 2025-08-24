'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

export default function AdminReturnDetailPage() {
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
  const [ret, setRet] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const { showToastCustom } = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/returns/${params.id}`, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      setOrder(data.order || null);
      setRet(data.return || null);
    } catch (e) {
      console.error(e);
      setOrder(null);
      setRet(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params?.id]);

  function getReturnReason(): string | undefined {
    return ret?.reason || ret?.notes || undefined;
  }

  async function approveReturn() {
    setSaving(true);
    try {
      const res = await fetch(`/api/returns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve', note: note || (isAR ? 'تمت الموافقة على الإرجاع' : 'Return approved') }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setRet(data.return);
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
      const res = await fetch(`/api/returns/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reject', note: note || (isAR ? 'تم رفض الإرجاع' : 'Return rejected') }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        setRet(data.return);
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

  if (loading) return <div className="text-gray-600">{isAR ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  if (!order || !ret) return <div className="text-gray-600">{isAR ? 'غير موجود' : 'Not found'}</div>;

  return (
    <div className="space-y-6" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-2xl font-bold">{isAR ? 'تفاصيل المرتجع' : 'Return Details'} #{String(ret._id).slice(-6)}</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>router.push(`/${locale}/admin/returns`)} className="px-3 py-1.5 rounded border hover:bg-gray-50">{isAR ? 'رجوع' : 'Back'}</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">{isAR ? 'سبب الإرجاع' : 'Return Reason'}</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {getReturnReason() || (isAR ? '—' : '—')}
            </div>
          </div>

          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">{isAR ? 'العناصر' : 'Items'}</div>
            <div className="divide-y">
              {(ret?.items && ret.items.length ? ret.items : (order.items || [])).map((it: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded" style={{backgroundImage: it.image ? `url('${it.image}')` : undefined, backgroundSize:'cover', backgroundPosition:'center'}} />
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
        </div>

        <div className="space-y-4">
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">{isAR ? 'الملخص' : 'Summary'}</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>{isAR ? 'الحالة' : 'Status'}</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{order.status}</span></div>
              <div className="flex justify-between"><span>{isAR ? 'الدفع' : 'Payment'}</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{order.payment?.status}</span></div>
            </div>
          </div>

          <div className="border rounded-xl p-4 space-y-3">
            <div className="font-semibold">{isAR ? 'إجراء' : 'Action'}</div>
            {/** lock actions if already decided */}
            {(() => {
              const locked = saving || (ret?.status && String(ret.status).toLowerCase() !== 'requested');
              return (
                <>
                  <input
                    value={note}
                    onChange={(e)=>setNote(e.target.value)}
                    placeholder={isAR ? 'ملاحظة (اختياري)' : 'Note (optional)'}
                    className="border border-gray-300 rounded px-3 py-2 w-full disabled:opacity-50"
                    disabled={locked}
                  />
                  <button
                    onClick={approveReturn}
                    disabled={locked}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50">
                    {isAR ? 'الموافقة على الإرجاع' : 'Approve Return'}
                  </button>
                  <button
                    onClick={rejectReturn}
                    disabled={locked}
                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 disabled:opacity-50">
                    {isAR ? 'رفض الإرجاع' : 'Reject Return'}
                  </button>
                  {locked && (
                    <div className="text-xs text-gray-600">
                      {isAR ? 'تم اتخاذ القرار — لا يمكن تنفيذ إجراء آخر.' : 'Decision made — further actions are disabled.'}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

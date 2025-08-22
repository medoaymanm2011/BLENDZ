'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [params?.id]);

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
        alert(data.error || 'Failed');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder() {
    if (!confirm('Cancel this order?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok) setOrder(data.order);
      else alert(data.error || 'Failed');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-gray-600">Loading...</div>;
  if (!order) return <div className="text-gray-600">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{String(order._id).slice(-6)}</h1>
        <div className="flex items-center gap-2">
          <button onClick={()=>router.push(`/${locale}/admin/orders`)} className="px-3 py-1.5 rounded border hover:bg-gray-50">Back</button>
          <button onClick={cancelOrder} disabled={saving || order.status==='cancelled'} className="px-3 py-1.5 rounded border text-red-600 hover:bg-red-50 disabled:opacity-50">Cancel</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">Items</div>
            <div className="divide-y">
              {order.items?.map((it: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded" style={{backgroundImage:`url(${it.image||''})`, backgroundSize:'cover', backgroundPosition:'center'}} />
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-600">x{it.qty}</div>
                    </div>
                  </div>
                  <div className="text-sm">{it.price} {order.totals?.currency || 'EGP'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-3">Shipping</div>
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
            <div className="font-semibold mb-3">Summary</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{order.totals?.subtotal} {order.totals?.currency}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{order.totals?.shipping} {order.totals?.currency}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{order.totals?.total} {order.totals?.currency}</span></div>
              <div className="flex justify-between"><span>Status</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{order.status}</span></div>
              <div className="flex justify-between"><span>Payment</span><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">{order.payment?.status}</span></div>
            </div>
          </div>

          <form onSubmit={updateStatus} className="border rounded-xl p-4 space-y-3">
            <div className="font-semibold">Update Status</div>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1">
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="grid grid-cols-1 gap-2">
              <input value={trackingNumber} onChange={(e)=>setTrackingNumber(e.target.value)} placeholder="Tracking number" className="border border-gray-300 rounded px-3 py-2" />
              <input value={provider} onChange={(e)=>setProvider(e.target.value)} placeholder="Provider (e.g. Aramex)" className="border border-gray-300 rounded px-3 py-2" />
              <input value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Note (optional)" className="border border-gray-300 rounded px-3 py-2" />
            </div>
            <button disabled={saving} className="w-full bg-black text-white rounded px-4 py-2 disabled:opacity-50">{saving? 'Saving...' : 'Save'}</button>
          </form>

          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-2">Timeline</div>
            <div className="space-y-2 text-sm">
              {(order.tracking?.history || []).slice().reverse().map((ev: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>{ev.status}</div>
                  <div className="text-gray-600">{new Date(ev.ts).toLocaleString()}</div>
                </div>
              ))}
              {(!order.tracking?.history || order.tracking.history.length===0) && <div className="text-gray-600">No events</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type ShippingMethod = { code: string; name: string; price: number; enabled?: boolean };
type Settings = {
  storeName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  currencies?: string[];
  defaultCurrency?: string;
  payments?: { cod?: boolean; stripeEnabled?: boolean };
  shippingMethods?: ShippingMethod[];
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    storeName: '',
    contactEmail: '',
    phone: '',
    address: '',
    currencies: ['EGP'],
    defaultCurrency: 'EGP',
    payments: { cod: true, stripeEnabled: false },
    shippingMethods: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pathname = usePathname();
  const locale = useMemo(() => pathname?.split('/').filter(Boolean)[0] || 'en', [pathname]);
  const isAR = locale === 'ar';
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          cache: 'no-store',
          credentials: 'include',
          headers: { ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) },
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.settings) {
          setSettings((s) => ({
            ...s,
            ...data.settings,
            currencies: Array.isArray(data.settings.currencies) && data.settings.currencies.length ? data.settings.currencies : ['EGP'],
            defaultCurrency: data.settings.defaultCurrency || 'EGP',
            payments: { cod: true, stripeEnabled: false, ...(data.settings.payments || {}) },
            shippingMethods: Array.isArray(data.settings.shippingMethods) ? data.settings.shippingMethods : [],
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ADMIN_TOKEN]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setSettings((s) => ({ ...s, ...data.settings }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function setCurrencyCsv(v: string) {
    const arr = v
      .split(',')
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    setSettings((s) => ({
      ...s,
      currencies: arr.length ? arr : ['EGP'],
      defaultCurrency: arr.includes(s.defaultCurrency || 'EGP') ? s.defaultCurrency : arr[0] || 'EGP',
    }));
  }

  function addShip() {
    setSettings((s) => ({
      ...s,
      shippingMethods: [...(s.shippingMethods || []), { code: `method_${Date.now()}`, name: 'New Method', price: 0, enabled: true }],
    }));
  }
  function removeShip(code: string) {
    setSettings((s) => ({
      ...s,
      shippingMethods: (s.shippingMethods || []).filter((m) => m.code !== code),
    }));
  }

  return (
    <div className="space-y-4" dir={isAR ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold">{isAR ? 'لوحة التحكم • الإعدادات' : 'Admin • Settings'}</h1>
      {loading ? (
        <div className="text-gray-500">{isAR ? 'جارٍ التحميل…' : 'Loading…'}</div>
      ) : (
        <form onSubmit={onSave} className={`grid gap-4 bg-white rounded-xl p-4 shadow ${isAR ? 'text-right' : ''}`}>
          {/* Store info */}
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={settings.storeName || ''}
              onChange={(e) => setSettings((s) => ({ ...s, storeName: e.target.value }))}
              placeholder={isAR ? 'اسم المتجر' : 'Store Name'}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
            <input
              value={settings.contactEmail || ''}
              onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
              placeholder={isAR ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
            <input
              value={settings.phone || ''}
              onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
              placeholder={isAR ? 'الهاتف' : 'Phone'}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
            <input
              value={settings.address || ''}
              onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
              placeholder={isAR ? 'العنوان' : 'Address'}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
          </div>

          {/* Currencies */}
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={(settings.currencies || []).join(', ')}
              onChange={(e) => setCurrencyCsv(e.target.value)}
              placeholder={isAR ? 'العملات (مفصولة بفواصل)، مثل: EGP, USD' : 'Currencies (CSV), e.g. EGP, USD'}
              className="input input-bordered w-full p-2 rounded border border-gray-300 md:col-span-2"
            />
            <select
              value={settings.defaultCurrency || ''}
              onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value }))}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            >
              {(settings.currencies || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payments */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!settings.payments?.cod}
                onChange={(e) => setSettings((s) => ({ ...s, payments: { ...(s.payments || {}), cod: e.target.checked } }))}
              />
              {isAR ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!settings.payments?.stripeEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, payments: { ...(s.payments || {}), stripeEnabled: e.target.checked } }))}
              />
              {isAR ? 'تفعيل سترايب' : 'Stripe Enabled'}
            </label>
          </div>

          {/* Shipping methods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">{isAR ? 'طرق الشحن' : 'Shipping Methods'}</div>
              <button type="button" onClick={addShip} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm">{isAR ? 'إضافة' : 'Add'}</button>
            </div>
            <div className="grid gap-2">
              {(settings.shippingMethods || []).map((m, idx) => (
                <div key={m.code || idx} className="grid md:grid-cols-5 gap-2 items-center">
                  <input
                    value={m.code}
                    onChange={(e) => setSettings((s) => ({
                      ...s,
                      shippingMethods: (s.shippingMethods || []).map((x) => x.code === m.code ? { ...x, code: e.target.value } : x),
                    }))}
                    placeholder={isAR ? 'الكود' : 'code'}
                    className="input input-bordered w-full p-2 rounded border border-gray-300"
                  />
                  <input
                    value={m.name}
                    onChange={(e) => setSettings((s) => ({
                      ...s,
                      shippingMethods: (s.shippingMethods || []).map((x) => x.code === m.code ? { ...x, name: e.target.value } : x),
                    }))}
                    placeholder={isAR ? 'الاسم' : 'name'}
                    className="input input-bordered w-full p-2 rounded border border-gray-300"
                  />
                  <input
                    type="number"
                    value={m.price}
                    onChange={(e) => setSettings((s) => ({
                      ...s,
                      shippingMethods: (s.shippingMethods || []).map((x) => x.code === m.code ? { ...x, price: Number(e.target.value) || 0 } : x),
                    }))}
                    placeholder={isAR ? 'السعر' : 'price'}
                    className="input input-bordered w-full p-2 rounded border border-gray-300"
                  />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!m.enabled}
                      onChange={(e) => setSettings((s) => ({
                        ...s,
                        shippingMethods: (s.shippingMethods || []).map((x) => x.code === m.code ? { ...x, enabled: e.target.checked } : x),
                      }))}
                    />
                    {isAR ? 'مفعّل' : 'enabled'}
                  </label>
                  <button type="button" onClick={() => removeShip(m.code)} className="text-red-600 hover:underline text-sm">{isAR ? 'حذف' : 'Remove'}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button disabled={saving} type="submit" className="bg-[#2F3E77] text-white rounded px-4 py-2 hover:brightness-95 disabled:opacity-60">
              {saving ? (isAR ? 'جارٍ الحفظ…' : 'Saving…') : (isAR ? 'حفظ الإعدادات' : 'Save Settings')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

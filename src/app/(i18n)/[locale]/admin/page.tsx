'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CloudinaryUploader from '@/components/CloudinaryUploader';
// Admin layout provides Header/Footer

type Slide = {
  _id?: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaType?: 'none' | 'scroll' | 'link';
  ctaTarget?: string | null;
  order?: number;
  isActive?: boolean;
};

export default function AdminPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Slide>({ imageUrl: '', title: '', subtitle: '', ctaText: 'Shop Now', ctaType: 'scroll', ctaTarget: '#home-products', order: 0, isActive: true });
  const pathname = usePathname();
  const locale = useMemo(() => {
    // Path like: /en/admin or /ar/admin
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/slides', { credentials: 'include' });
      const data = await res.json();
      setSlides(data.slides || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slides on mount. Authorization is enforced in the server layout.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchSlides();
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const createSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/slides', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(form),
      });
      setForm({ imageUrl: '', title: '', subtitle: '', ctaText: 'Shop Now', ctaType: 'scroll', ctaTarget: '#home-products', order: 0, isActive: true });
      await fetchSlides();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeSlide = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this slide?')) return;
    setLoading(true);
    try {
      await fetch(`/api/slides/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
      });
      await fetchSlides();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="text-gray-900">
      <div className="px-1 py-2">
        <h1 className="text-2xl font-bold mb-4">Admin • Slides</h1>

        <nav className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link className="px-3 py-1.5 rounded border hover:bg-gray-50" href={`/${locale}/admin/brands`}>Brands</Link>
          <Link className="px-3 py-1.5 rounded border hover:bg-gray-50" href={`/${locale}/admin/categories`}>Categories</Link>
          <Link className="px-3 py-1.5 rounded border hover:bg-gray-50" href={`/${locale}/admin/products`}>Products</Link>
          <span className="px-3 py-1.5 rounded border bg-[#2F3E77] text-white">Slides</span>
        </nav>

        <form onSubmit={createSlide} className="grid gap-4 md:grid-cols-2 p-4 border rounded-xl bg-white">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-gray-800">Image URL</label>
            <input required value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="/BAGS/photo....avif or https://..." />
            <div className="mt-2">
              <CloudinaryUploader
                folder="slides"
                buttonText="Upload from device"
                buttonClassName="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 cursor-pointer"
                onUploaded={(url)=> setForm((f)=> ({ ...f, imageUrl: url }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">Title</label>
            <input required value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">Subtitle</label>
            <input value={form.subtitle||''} onChange={e=>setForm({...form, subtitle:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">CTA Text</label>
            <input value={form.ctaText||''} onChange={e=>setForm({...form, ctaText:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">CTA Type</label>
            <select value={form.ctaType} onChange={e=>setForm({...form, ctaType:e.target.value as any})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="none">None</option>
              <option value="scroll">Scroll</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">CTA Target</label>
            <input value={form.ctaTarget||''} onChange={e=>setForm({...form, ctaTarget:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="#home-products or /category/all" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">Order</label>
            <input type="number" value={form.order||0} onChange={e=>setForm({...form, order:Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={!!form.isActive} onChange={e=>setForm({...form, isActive:e.target.checked})} />
            <label htmlFor="isActive">Active</label>
          </div>
          <div className="md:col-span-2">
            <button disabled={loading} className="bg-[#2F3E77] text-white px-4 py-2 rounded-lg hover:brightness-95 disabled:opacity-50">{loading? 'Saving...' : 'Add Slide'}</button>
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Slides</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map(s => (
              <div key={s._id} className="border rounded-xl overflow-hidden">
                <div className="aspect-[16/9] bg-gray-100" style={{backgroundImage:`url(${s.imageUrl})`, backgroundSize:'cover', backgroundPosition:'center'}} />
                <div className="p-3 space-y-1">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-gray-600">{s.subtitle}</div>
                  <div className="text-xs text-gray-500">CTA: {s.ctaType} {s.ctaTarget? `→ ${s.ctaTarget}`:''}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>removeSlide(s._id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

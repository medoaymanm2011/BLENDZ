'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const pathname = usePathname();
  const locale = useMemo(() => {
    // Path like: /en/admin or /ar/admin
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const isAR = locale === 'ar';
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;
  const { confirm } = useConfirmDialog();

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

  const createOrUpdateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/slides/${editingId}` : '/api/slides';
      const method = editingId ? 'PATCH' : 'POST';
      await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(form),
      });
      setForm({ imageUrl: '', title: '', subtitle: '', ctaText: 'Shop Now', ctaType: 'scroll', ctaTarget: '#home-products', order: 0, isActive: true });
      setEditingId(null);
      await fetchSlides();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onStartEdit = (s: Slide) => {
    setEditingId(s._id || null);
    setForm({
      imageUrl: s.imageUrl || '',
      title: s.title || '',
      subtitle: s.subtitle || '',
      ctaText: s.ctaText || '',
      ctaType: s.ctaType || 'none',
      ctaTarget: s.ctaTarget ?? '',
      order: s.order ?? 0,
      isActive: !!s.isActive,
    });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm({ imageUrl: '', title: '', subtitle: '', ctaText: 'Shop Now', ctaType: 'scroll', ctaTarget: '#home-products', order: 0, isActive: true });
  };

  const removeSlide = async (id?: string) => {
    if (!id) return;
    const ok = await confirm({
      variant: 'danger',
      title: locale === 'ar' ? 'حذف الشريحة؟' : 'Delete slide?',
      message: locale === 'ar' ? 'سيتم حذف هذه الشريحة نهائيًا.' : 'This slide will be permanently deleted.',
      confirmText: locale === 'ar' ? 'حذف' : 'Delete',
      cancelText: locale === 'ar' ? 'إلغاء' : 'Cancel',
    });
    if (!ok) return;
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
    <div className="text-gray-900" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`px-1 py-2 ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-2xl font-bold mb-4">{isAR ? 'لوحة التحكم • السلايدر' : 'Admin • Slides'}</h1>

        <nav className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link className="px-3 py-1.5 rounded border hover:bg-gray-50" href={`/${locale}/admin/brands`}>{isAR ? 'الماركات' : 'Brands'}</Link>
          <Link className="px-3 py-1.5 rounded border hover:bg-gray-50" href={`/${locale}/admin/categories`}>{isAR ? 'التصنيفات' : 'Categories'}</Link>
          <Link className="px-3 py-1.5 rounded border hover:bg-gray-50" href={`/${locale}/admin/products`}>{isAR ? 'المنتجات' : 'Products'}</Link>
          <span className="px-3 py-1.5 rounded border bg-[#2F3E77] text-white">{isAR ? 'السلايدر' : 'Slides'}</span>
        </nav>

        <form onSubmit={createOrUpdateSlide} className="grid gap-4 md:grid-cols-2 p-4 border rounded-xl bg-white">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'رابط الصورة' : 'Image URL'}</label>
            <input required value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="/BAGS/photo....avif or https://..." />
            <div className="mt-2">
              <CloudinaryUploader
                folder="slides"
                buttonText={isAR ? 'رفع من الجهاز' : 'Upload from device'}
                buttonClassName="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 cursor-pointer"
                onUploaded={(url)=> setForm((f)=> ({ ...f, imageUrl: url }))}
              />
            </div>
            {form.imageUrl ? (
              <div className="mt-3">
                <div className="text-xs text-gray-600 mb-1">{isAR ? 'معاينة' : 'Preview'}</div>
                <div
                  className="aspect-[16/9] rounded-lg border overflow-hidden bg-white"
                  style={{ backgroundImage: `url(${form.imageUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                />
              </div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'العنوان' : 'Title'}</label>
            <input required value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'العنوان الفرعي' : 'Subtitle'}</label>
            <input value={form.subtitle||''} onChange={e=>setForm({...form, subtitle:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'نص زر الدعوة' : 'CTA Text'}</label>
            <input value={form.ctaText||''} onChange={e=>setForm({...form, ctaText:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'نوع زر الدعوة' : 'CTA Type'}</label>
            <select value={form.ctaType} onChange={e=>setForm({...form, ctaType:e.target.value as any})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="none">{isAR ? 'بدون' : 'None'}</option>
              <option value="scroll">{isAR ? 'تمرير' : 'Scroll'}</option>
              <option value="link">{isAR ? 'رابط' : 'Link'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'هدف زر الدعوة' : 'CTA Target'}</label>
            <input value={form.ctaTarget||''} onChange={e=>setForm({...form, ctaTarget:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="#home-products or /category/all" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-800">{isAR ? 'الترتيب' : 'Order'}</label>
            <input type="number" value={form.order||0} onChange={e=>setForm({...form, order:Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={!!form.isActive} onChange={e=>setForm({...form, isActive:e.target.checked})} />
            <label htmlFor="isActive">{isAR ? 'مُفعل' : 'Active'}</label>
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button disabled={loading} className="bg-[#2F3E77] text-white px-4 py-2 rounded-lg hover:brightness-95 disabled:opacity-50">{loading? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (editingId ? (isAR ? 'تحديث الشريحة' : 'Update Slide') : (isAR ? 'إضافة شريحة' : 'Add Slide'))}</button>
            {editingId ? (
              <button type="button" onClick={onCancelEdit} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">{isAR ? 'إلغاء' : 'Cancel'}</button>
            ) : null}
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">{isAR ? 'الشرائح' : 'Slides'}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map(s => (
              <div key={s._id} className="border rounded-xl overflow-hidden">
                <div className="aspect-[16/9] bg-white" style={{backgroundImage:`url(${s.imageUrl})`, backgroundSize:'contain', backgroundPosition:'center', backgroundRepeat:'no-repeat'}} />
                <div className="p-3 space-y-1">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-gray-600">{s.subtitle}</div>
                  <div className="text-xs text-gray-500">{isAR ? 'زر الدعوة' : 'CTA'}: {s.ctaType} {s.ctaTarget? `${isAR ? '→' : '→'} ${s.ctaTarget}`:''}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>onStartEdit(s)} className="text-blue-700 text-sm hover:underline">{isAR ? 'تعديل' : 'Edit'}</button>
                    <button onClick={()=>removeSlide(s._id)} className="text-red-600 text-sm hover:underline">{isAR ? 'حذف' : 'Delete'}</button>
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

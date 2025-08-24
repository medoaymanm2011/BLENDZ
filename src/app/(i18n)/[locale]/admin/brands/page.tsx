'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import CloudinaryUploader from '@/components/CloudinaryUploader';

function slugify(v: string) {
  return v
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '') // keep letters, numbers, Arabic range, space and dash
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Brand {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  isActive?: boolean;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<Brand>({ name: '', slug: '', image: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const isAR = locale === 'ar';
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;

  async function load() {
    try {
      const res = await fetch('/api/brands', { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (e) {
      console.error(e);
    }
  }

  // Admin auth guard
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const me = await meRes.json();
        if (!cancelled && me?.user?.role !== 'admin') {
          const dest = locale ? `/${locale}/account` : '/account';
          router.replace(dest);
          return;
        }
        if (!cancelled) await load();
      } catch (e) {
        console.error(e);
        const dest = locale ? `/${locale}/account` : '/account';
        if (!cancelled) router.replace(dest);
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/brands/${editingId}` : '/api/brands';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Create failed');
      setForm({ name: '', slug: '', image: '' });
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id?: string) {
    if (!id) return;
    try {
      await fetch(`/api/brands/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
      });
      await load();
    } catch (e) { console.error(e); }
  }

  function onStartEdit(b: Brand) {
    setEditingId(b._id || null);
    setSlugTouched(true);
    setForm({ name: b.name || '', slug: b.slug || '', image: b.image || '' });
  }

  function onCancelEdit() {
    setEditingId(null);
    setSlugTouched(false);
    setForm({ name: '', slug: '', image: '' });
  }

  if (authChecking) {
    return (
      <div className="px-4 py-12">
        <div className="text-center text-gray-600">{isAR ? 'جارٍ التحقق من الصلاحيات...' : 'Checking permissions...'}</div>
      </div>
    );
  }

  return (
    <div className="text-gray-900" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`px-1 py-2 space-y-8 ${isAR ? 'text-right' : ''}`}>
        <h1 className="text-2xl font-bold">{isAR ? 'لوحة التحكم • الماركات' : 'Admin • Brands'}</h1>

        <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow">
          <input
            value={form.name}
            onChange={(e)=>{
              const name = e.target.value;
              setForm((f)=> ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
            }}
            placeholder={isAR ? 'الاسم' : 'Name'}
            className="input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <input
            value={form.slug}
            onChange={(e)=>{ setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
            onFocus={()=> setSlugTouched(true)}
            placeholder={isAR ? 'المعرف (Slug)' : 'Slug'}
            className="input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <div className="col-span-1 md:col-span-2">
            <input value={form.image} onChange={(e)=>setForm({ ...form, image: e.target.value })} placeholder={isAR ? 'رابط الشعار (Cloudinary)' : 'Logo URL (Cloudinary)'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
            <div className="mt-2">
              <CloudinaryUploader
                folder="brands"
                buttonText={isAR ? 'رفع من الجهاز' : 'Upload from device'}
                buttonClassName="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 cursor-pointer"
                onUploaded={(url)=> setForm((f)=> ({ ...f, image: url }))}
              />
            </div>
            
          </div>
          <div className="md:col-span-4 text-xs text-gray-500">{isAR ? 'مسار المعاينة:' : 'Path preview:'} <span className="font-mono">/brand/{form.slug || '...'}</span></div>
          <div className="flex items-center gap-3">
            <button disabled={loading} className="btn bg-[#2F3E77] text-white rounded px-4 py-2 hover:brightness-95 disabled:opacity-60">
              {loading ? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (editingId ? (isAR ? 'تحديث الماركة' : 'Update Brand') : (isAR ? 'إضافة ماركة' : 'Add Brand'))}
            </button>
            {editingId ? (
              <button type="button" onClick={onCancelEdit} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">{isAR ? 'إلغاء' : 'Cancel'}</button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3">
          {brands.map((b) => (
            <div key={b._id} className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                {b.image ? (<img src={b.image} alt={b.name} className="w-12 h-12 object-contain rounded" />) : (<div className="w-12 h-12 bg-gray-200 rounded" />)}
                <div>
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-xs text-gray-500">/{b.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={()=>onStartEdit(b)} className="text-blue-700 hover:underline">{isAR ? 'تعديل' : 'Edit'}</button>
                <button onClick={()=>onDelete(b._id)} className="text-red-600 hover:underline">{isAR ? 'حذف' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

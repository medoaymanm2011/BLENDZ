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

interface Category {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  sortOrder?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<Category>({ name: '', slug: '', image: '', sortOrder: 0 });
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
      const res = await fetch('/api/categories', { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      setCategories(data.categories || []);
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
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
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
      setForm({ name: '', slug: '', image: '', sortOrder: 0 });
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
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
      });
      await load();
    } catch (e) { console.error(e); }
  }

  function onStartEdit(c: Category) {
    setEditingId(c._id || null);
    setSlugTouched(true);
    setForm({ name: c.name || '', slug: c.slug || '', image: c.image || '', sortOrder: c.sortOrder ?? 0 });
  }

  function onCancelEdit() {
    setEditingId(null);
    setSlugTouched(false);
    setForm({ name: '', slug: '', image: '', sortOrder: 0 });
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
        <h1 className="text-xl sm:text-2xl font-bold">
          {isAR ? (
            <>
              <span>لوحة التحكم</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:ms-1">التصنيفات</span>
            </>
          ) : (
            <>
              <span>Admin</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:ms-1">Categories</span>
            </>
          )}
        </h1>

        <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow">
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
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <div className="flex-1">
                <input
                  value={form.image}
                  onChange={(e)=>setForm({ ...form, image: e.target.value })}
                  placeholder={isAR ? 'رابط الصورة (Cloudinary)' : 'Image URL (Cloudinary)'}
                  className="input input-bordered w-full p-2 rounded border border-gray-300"
                />
                <div className="mt-2">
                  <CloudinaryUploader
                    folder="categories"
                    buttonText={isAR ? 'رفع من الجهاز' : 'Upload from device'}
                    buttonClassName="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 cursor-pointer"
                    onUploaded={(url)=> setForm((f)=> ({ ...f, image: url }))}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">{isAR ? 'ألصق رابطًا أو ارفع صورة للمعاينة.' : 'Paste a URL or upload to preview.'}</div>
              </div>
              <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                {form.image ? (
                  <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-400">{isAR ? 'لا توجد صورة' : 'No image'}</span>
                )}
              </div>
            </div>
          </div>
          <div className="md:col-span-5 text-xs text-gray-500">{isAR ? 'مسار المعاينة:' : 'Path preview:'} <span className="font-mono break-all">/category/{form.slug || '...'}</span></div>
          <input type="number" value={form.sortOrder ?? 0} onChange={(e)=>setForm({ ...form, sortOrder: Number(e.target.value) })} placeholder={isAR ? 'الترتيب' : 'Sort'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <div className="md:col-span-5 flex flex-wrap items-center gap-2">
            <button disabled={loading} className="btn bg-[#2F3E77] text-white rounded px-4 py-2 hover:brightness-95 disabled:opacity-60">
              {loading ? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (editingId ? (isAR ? 'تحديث التصنيف' : 'Update Category') : (isAR ? 'إضافة تصنيف' : 'Add Category'))}
            </button>
            {editingId ? (
              <button type="button" onClick={onCancelEdit} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">{isAR ? 'إلغاء' : 'Cancel'}</button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3">
          {categories.map((c) => (
            <div key={c._id} className="bg-white rounded-xl p-3 sm:p-4 shadow border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                {c.image ? (<img src={c.image} alt={c.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />) : (<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded" />)}
                <div>
                  <div className="font-semibold text-sm sm:text-base truncate max-w-[220px] sm:max-w-none">{c.name}</div>
                  <div className="text-xs text-gray-500 break-all">/{c.slug}</div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs sm:text-sm w-full sm:w-auto border-t pt-2 sm:border-0 sm:pt-0">
                <button onClick={()=>onStartEdit(c)} className="px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50">{isAR ? 'تعديل' : 'Edit'}</button>
                <button onClick={()=>onDelete(c._id)} className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50">{isAR ? 'حذف' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

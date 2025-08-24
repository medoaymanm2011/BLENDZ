'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SectionType = 'featured' | 'sale' | 'new' | 'bestseller' | 'recommended' | 'custom_query';

interface HomeSection {
  _id?: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  type: SectionType;
  filters?: { tags?: string[]; brandSlugs?: string[] } | Record<string, any>;
  sort?: 'newest' | 'topSelling' | 'priceAsc' | 'priceDesc' | 'custom';
  limit?: number;
  enabled?: boolean;
  order?: number;
  localeMode?: 'all' | 'ar' | 'en';
}

const defaultForm: HomeSection = {
  titleAr: '',
  titleEn: '',
  slug: '',
  type: 'featured',
  filters: {},
  sort: 'newest',
  limit: 12,
  enabled: true,
  order: 100,
  localeMode: 'all',
};

function slugify(v: string) {
  return v.toString().trim().toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminHomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [form, setForm] = useState<HomeSection>({ ...defaultForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    const res = await fetch('/api/admin/home-sections', {
      cache: 'no-store',
      credentials: 'include',
      headers: { ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) },
    });
    const data = await res.json();
    setSections(data.sections || []);
  }

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

  function resetForm() {
    setForm({ ...defaultForm });
    setEditingId(null);
  }

  async function onCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: any = { ...form };
      // convert comma lists to arrays for filters
      if (typeof (form.filters as any)?.tagsCsv === 'string') {
        const parts = String((form.filters as any).tagsCsv).split(',').map(s=>s.trim()).filter(Boolean);
        body.filters = { ...(form.filters||{}), tags: parts };
        delete body.filters.tagsCsv;
      }
      if (typeof (form.filters as any)?.brandSlugsCsv === 'string') {
        const parts = String((form.filters as any).brandSlugsCsv).split(',').map(s=>s.trim()).filter(Boolean);
        body.filters = { ...(body.filters||{}), brandSlugs: parts };
        delete body.filters.brandSlugsCsv;
      }

      const url = editingId ? `/api/admin/home-sections/${editingId}` : '/api/admin/home-sections';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      await load();
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id?: string) {
    if (!id) return;
    await fetch(`/api/admin/home-sections/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) },
    });
    await load();
  }

  async function onChangeOrder(id: string, delta: number) {
    const s = sections.find(x=>x._id===id);
    if (!s) return;
    const nextOrder = Math.max(0, (s.order ?? 100) + delta);
    await fetch(`/api/admin/home-sections/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
      },
      body: JSON.stringify({ order: nextOrder }),
    });
    await load();
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
              <span className="sm:ms-1">أقسام الصفحة الرئيسية</span>
            </>
          ) : (
            <>
              <span>Admin</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:ms-1">Home Sections</span>
            </>
          )}
        </h1>

        <form onSubmit={onCreateOrUpdate} className="grid md:grid-cols-6 gap-4 bg-white p-4 rounded-xl shadow">
          <div className="md:col-span-3">
            <input
              value={form.titleEn}
              onChange={(e)=> setForm((f)=> ({ ...f, titleEn: e.target.value, slug: f.slug || slugify(e.target.value) }))}
              placeholder={isAR ? 'العنوان (EN)' : 'Title (EN)'}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
          </div>
          <div className="md:col-span-3">
            <input
              value={form.titleAr}
              onChange={(e)=> setForm((f)=> ({ ...f, titleAr: e.target.value }))}
              placeholder={isAR ? 'العنوان (AR)' : 'Title (AR)'}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
          </div>
          <input
            value={form.slug}
            onChange={(e)=> setForm((f)=> ({ ...f, slug: slugify(e.target.value) }))}
            placeholder={isAR ? 'المعرف (slug)' : 'slug'}
            className="input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <select
              value={(form.type === 'custom_query' && (form as any)?.filters?.customTypeName) ? 'other' : form.type}
              onChange={(e)=> {
                const v = e.target.value as SectionType | 'other';
                setForm((f)=> {
                  if (v === 'other') {
                    return { ...f, type: 'custom_query', filters: { ...(f.filters||{}), customTypeName: (f as any)?.filters?.customTypeName || '' } };
                  } else {
                    const nf: any = { ...f, type: v as SectionType };
                    if ((nf.filters as any)?.customTypeName) {
                      // clear custom label if switching away
                      const { customTypeName, ...rest } = (nf.filters as any);
                      nf.filters = Object.keys(rest).length ? rest : {};
                    }
                    return nf;
                  }
                });
              }}
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            >
              <option value="featured">{isAR ? 'مميّز' : 'featured'}</option>
              <option value="sale">{isAR ? 'تخفيضات' : 'sale'}</option>
              <option value="new">{isAR ? 'جديد' : 'new'}</option>
              <option value="bestseller">{isAR ? 'الأكثر مبيعًا' : 'bestseller'}</option>
              <option value="recommended">{isAR ? 'مقترح' : 'recommended'}</option>
              <option value="custom_query">{isAR ? 'مخصّص' : 'custom_query'}</option>
              <option value="other">{isAR ? 'أخرى' : 'other'}</option>
            </select>
            {(form.type === 'custom_query' && (form as any)?.filters?.customTypeName !== undefined) && (
              <input
                value={String((form as any)?.filters?.customTypeName || '')}
                onChange={(e)=> setForm((f)=> ({ ...f, filters: { ...(f.filters||{}), customTypeName: e.target.value } as any }))}
                placeholder={isAR ? 'اسم القسم المخصّص' : 'custom section name'}
                className="input input-bordered w-full p-2 rounded border border-gray-300"
              />
            )}
          </div>
          <select value={form.localeMode} onChange={(e)=> setForm((f)=> ({ ...f, localeMode: e.target.value as any }))} className="input input-bordered w-full p-2 rounded border border-gray-300">
            <option value="all">{isAR ? 'اللغة: الكل' : 'locale: all'}</option>
            <option value="ar">{isAR ? 'اللغة: العربية' : 'locale: ar'}</option>
            <option value="en">{isAR ? 'اللغة: الإنجليزية' : 'locale: en'}</option>
          </select>
          <input type="number" value={form.limit ?? 12} onChange={(e)=> setForm((f)=> ({ ...f, limit: Number(e.target.value) || 12 }))} placeholder={isAR ? 'الحد' : 'limit'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <input type="number" value={form.order ?? 100} onChange={(e)=> setForm((f)=> ({ ...f, order: Number(e.target.value) || 0 }))} placeholder={isAR ? 'الترتيب' : 'order'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <select value={form.sort} onChange={(e)=> setForm((f)=> ({ ...f, sort: e.target.value as any }))} className="input input-bordered w-full p-2 rounded border border-gray-300">
            <option value="newest">{isAR ? 'ترتيب: الأحدث' : 'sort: newest'}</option>
            <option value="topSelling">{isAR ? 'ترتيب: الأعلى مبيعًا' : 'sort: topSelling'}</option>
            <option value="priceAsc">{isAR ? 'ترتيب: السعر تصاعديًا' : 'sort: priceAsc'}</option>
            <option value="priceDesc">{isAR ? 'ترتيب: السعر تنازليًا' : 'sort: priceDesc'}</option>
            <option value="custom">{isAR ? 'ترتيب: مخصّص' : 'sort: custom'}</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.enabled} onChange={(e)=> setForm((f)=> ({ ...f, enabled: e.target.checked }))} />
            {isAR ? 'مفعّل' : 'Enabled'}
          </label>

          {/* Filters helpers */}
          <input
            value={String((form.filters as any)?.tagsCsv ?? ((form.filters as any)?.tags||[]).join(', '))}
            onChange={(e)=> setForm((f)=> ({ ...f, filters: { ...(f.filters||{}), tagsCsv: e.target.value } as any }))}
            placeholder={isAR ? 'وسوم (مفصولة بفواصل)' : 'tags (comma separated)'}
            className="md:col-span-3 input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <input
            value={String((form.filters as any)?.brandSlugsCsv ?? ((form.filters as any)?.brandSlugs||[]).join(', '))}
            onChange={(e)=> setForm((f)=> ({ ...f, filters: { ...(f.filters||{}), brandSlugsCsv: e.target.value } as any }))}
            placeholder={isAR ? 'معرفات الماركات (مفصولة بفواصل)' : 'brand slugs (comma separated)'}
            className="md:col-span-3 input input-bordered w-full p-2 rounded border border-gray-300"
          />

          <div className="md:col-span-6 flex flex-wrap items-center gap-2">
            <button disabled={loading} type="submit" className="bg-[#2F3E77] text-white rounded px-4 py-2 hover:brightness-95 disabled:opacity-60">
              {editingId ? (loading ? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (isAR ? 'تحديث القسم' : 'Update Section')) : (loading ? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (isAR ? 'إنشاء قسم' : 'Create Section'))}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">{isAR ? 'إلغاء' : 'Cancel'}</button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3">
          {sections.map((s)=> (
            <div key={s._id} className="bg-white rounded-xl p-3 sm:p-4 shadow border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{(s.type||'')[0]?.toUpperCase()}</div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">{s.titleEn} <span className="text-gray-400">/ {s.titleAr}</span></div>
                  <div className="text-xs text-gray-500 break-all">/{s.slug} • {(s as any)?.filters?.customTypeName || s.type} • {isAR ? 'الترتيب' : 'order'} {s.order ?? 0} • {s.enabled ? (isAR ? 'مفعّل' : 'enabled') : (isAR ? 'معطّل' : 'disabled')} • {isAR ? 'اللغة' : 'locale'} {s.localeMode}</div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs sm:text-sm w-full sm:w-auto border-t pt-2 sm:border-0 sm:pt-0">
                <div className="flex items-center gap-1">
                  <button onClick={()=> onChangeOrder(s._id!, -10)} className="px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-50" title={isAR ? 'أعلى' : 'Up'}>▲</button>
                  <button onClick={()=> onChangeOrder(s._id!, +10)} className="px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-50" title={isAR ? 'أسفل' : 'Down'}>▼</button>
                </div>
                <button onClick={()=> { setEditingId(s._id!); setForm({ ...s }); }} className="px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50">{isAR ? 'تعديل' : 'Edit'}</button>
                <button onClick={()=> onDelete(s._id)} className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50">{isAR ? 'حذف' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

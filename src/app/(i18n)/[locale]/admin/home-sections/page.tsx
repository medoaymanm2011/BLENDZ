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
        <div className="text-center text-gray-600">Checking permissions...</div>
      </div>
    );
  }

  return (
    <div className="text-gray-900">
      <div className="px-1 py-2 space-y-8">
        <h1 className="text-2xl font-bold">Admin • Home Sections</h1>

        <form onSubmit={onCreateOrUpdate} className="grid md:grid-cols-6 gap-4 bg-white p-4 rounded-xl shadow">
          <div className="md:col-span-3">
            <input
              value={form.titleEn}
              onChange={(e)=> setForm((f)=> ({ ...f, titleEn: e.target.value, slug: f.slug || slugify(e.target.value) }))}
              placeholder="Title (EN)"
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
          </div>
          <div className="md:col-span-3">
            <input
              value={form.titleAr}
              onChange={(e)=> setForm((f)=> ({ ...f, titleAr: e.target.value }))}
              placeholder="العنوان (AR)"
              className="input input-bordered w-full p-2 rounded border border-gray-300"
            />
          </div>
          <input
            value={form.slug}
            onChange={(e)=> setForm((f)=> ({ ...f, slug: slugify(e.target.value) }))}
            placeholder="slug"
            className="input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <div className="flex gap-2 items-center">
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
              <option value="featured">featured</option>
              <option value="sale">sale</option>
              <option value="new">new</option>
              <option value="bestseller">bestseller</option>
              <option value="recommended">recommended</option>
              <option value="custom_query">custom_query</option>
              <option value="other">other</option>
            </select>
            {(form.type === 'custom_query' && (form as any)?.filters?.customTypeName !== undefined) && (
              <input
                value={String((form as any)?.filters?.customTypeName || '')}
                onChange={(e)=> setForm((f)=> ({ ...f, filters: { ...(f.filters||{}), customTypeName: e.target.value } as any }))}
                placeholder="custom section name"
                className="input input-bordered w-full p-2 rounded border border-gray-300"
              />
            )}
          </div>
          <select value={form.localeMode} onChange={(e)=> setForm((f)=> ({ ...f, localeMode: e.target.value as any }))} className="input input-bordered w-full p-2 rounded border border-gray-300">
            <option value="all">locale: all</option>
            <option value="ar">locale: ar</option>
            <option value="en">locale: en</option>
          </select>
          <input type="number" value={form.limit ?? 12} onChange={(e)=> setForm((f)=> ({ ...f, limit: Number(e.target.value) || 12 }))} placeholder="limit" className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <input type="number" value={form.order ?? 100} onChange={(e)=> setForm((f)=> ({ ...f, order: Number(e.target.value) || 0 }))} placeholder="order" className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <select value={form.sort} onChange={(e)=> setForm((f)=> ({ ...f, sort: e.target.value as any }))} className="input input-bordered w-full p-2 rounded border border-gray-300">
            <option value="newest">sort: newest</option>
            <option value="topSelling">sort: topSelling</option>
            <option value="priceAsc">sort: priceAsc</option>
            <option value="priceDesc">sort: priceDesc</option>
            <option value="custom">sort: custom</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.enabled} onChange={(e)=> setForm((f)=> ({ ...f, enabled: e.target.checked }))} />
            Enabled
          </label>

          {/* Filters helpers */}
          <input
            value={String((form.filters as any)?.tagsCsv ?? ((form.filters as any)?.tags||[]).join(', '))}
            onChange={(e)=> setForm((f)=> ({ ...f, filters: { ...(f.filters||{}), tagsCsv: e.target.value } as any }))}
            placeholder="tags (comma separated)"
            className="md:col-span-3 input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <input
            value={String((form.filters as any)?.brandSlugsCsv ?? ((form.filters as any)?.brandSlugs||[]).join(', '))}
            onChange={(e)=> setForm((f)=> ({ ...f, filters: { ...(f.filters||{}), brandSlugsCsv: e.target.value } as any }))}
            placeholder="brand slugs (comma separated)"
            className="md:col-span-3 input input-bordered w-full p-2 rounded border border-gray-300"
          />

          <div className="md:col-span-6 flex items-center gap-3">
            <button disabled={loading} type="submit" className="bg-[#2F3E77] text-white rounded px-4 py-2 hover:brightness-95 disabled:opacity-60">
              {editingId ? (loading ? 'Saving...' : 'Update Section') : (loading ? 'Saving...' : 'Create Section')}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
            ) : null}
          </div>
        </form>

        <div className="grid gap-3">
          {sections.map((s)=> (
            <div key={s._id} className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{(s.type||'')[0]?.toUpperCase()}</div>
                <div>
                  <div className="font-semibold">{s.titleEn} <span className="text-gray-400">/ {s.titleAr}</span></div>
                  <div className="text-xs text-gray-500">/{s.slug} • {(s as any)?.filters?.customTypeName || s.type} • order {s.order ?? 0} • {s.enabled ? 'enabled' : 'disabled'} • locale {s.localeMode}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button onClick={()=> onChangeOrder(s._id!, -10)} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">▲</button>
                <button onClick={()=> onChangeOrder(s._id!, +10)} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">▼</button>
                <button onClick={()=> { setEditingId(s._id!); setForm({ ...s }); }} className="text-blue-700 hover:underline">Edit</button>
                <button onClick={()=> onDelete(s._id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

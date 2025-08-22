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
      const res = await fetch('/api/categories', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Create failed');
      setForm({ name: '', slug: '', image: '', sortOrder: 0 });
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
        <h1 className="text-2xl font-bold">Admin • Categories</h1>

        <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow">
          <input
            value={form.name}
            onChange={(e)=>{
              const name = e.target.value;
              setForm((f)=> ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
            }}
            placeholder="Name"
            className="input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <input
            value={form.slug}
            onChange={(e)=>{ setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
            onFocus={()=> setSlugTouched(true)}
            placeholder="Slug"
            className="input input-bordered w-full p-2 rounded border border-gray-300"
          />
          <div className="md:col-span-2">
            <input value={form.image} onChange={(e)=>setForm({ ...form, image: e.target.value })} placeholder="Image URL (Cloudinary)" className="input input-bordered w-full p-2 rounded border border-gray-300" />
            <div className="mt-2">
              <CloudinaryUploader
                folder="categories"
                buttonText="Upload from device"
                buttonClassName="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 cursor-pointer"
                onUploaded={(url)=> setForm((f)=> ({ ...f, image: url }))}
              />
            </div>
          </div>
          <div className="md:col-span-5 text-xs text-gray-500">Path preview: <span className="font-mono">/category/{form.slug || '...'}</span></div>
          <input type="number" value={form.sortOrder ?? 0} onChange={(e)=>setForm({ ...form, sortOrder: Number(e.target.value) })} placeholder="Sort" className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <button disabled={loading} className="btn bg-[#2F3E77] text-white rounded px-4 py-2 md:col-span-5 hover:brightness-95 disabled:opacity-60">
            {loading ? 'Adding...' : 'Add Category'}
          </button>
        </form>

        <div className="grid gap-3">
          {categories.map((c) => (
            <div key={c._id} className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
              <div className="flex items-center gap-3">
                {c.image ? (<img src={c.image} alt={c.name} className="w-12 h-12 object-cover rounded" />) : (<div className="w-12 h-12 bg-gray-200 rounded" />)}
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-gray-500">/{c.slug}</div>
                </div>
              </div>
              <button onClick={()=>onDelete(c._id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

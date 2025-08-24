'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CloudinaryUploader from '@/components/CloudinaryUploader';

interface ProductImage { url: string; alt?: string }
interface Product {
  _id?: string;
  name: string;
  slug: string;
  brandId?: string | null;
  categoryId?: string | null;
  sku?: string | null;
  color?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  description?: string;
  isFeatured?: boolean;
  images?: ProductImage[];
  sectionTypes?: ('featured' | 'sale' | 'new' | 'bestseller' | 'recommended')[];
  sectionSlugs?: string[];
}

interface HomeSection { _id: string; slug: string; type: 'featured'|'sale'|'new'|'bestseller'|'recommended'|'custom_query'; titleEn?: string; titleAr?: string; filters?: any }

interface Brand { _id: string; name: string }
interface Category { _id: string; name: string }

function slugify(v: string) {
  return v.toString().trim().toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [img, setImg] = useState('');
  const [form, setForm] = useState<Product>({ name: '', slug: '', price: 0, salePrice: null, stock: 0, images: [], sku: null, color: null, sectionTypes: [], sectionSlugs: [] });
  const [discountPct, setDiscountPct] = useState<string>('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean)[0];
    return seg || '';
  }, [pathname]);
  const isAR = locale === 'ar';
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN as string | undefined;
  const { showToastCustom } = useToast();
  const [warnedToken, setWarnedToken] = useState(false);

  async function load() {
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        fetch('/api/products', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/brands', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/categories', { cache: 'no-store', credentials: 'include' }),
      ]);

      const hsRes = await fetch('/api/admin/home-sections', { cache: 'no-store', credentials: 'include', headers: { ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}) } });

      const safeJson = async (res: Response) => {
        try {
          const ct = res.headers.get('content-type') || '';
          if (!res.ok) {
            const text = await res.text();
            console.warn('Request failed', res.url, res.status, text.slice(0, 200));
            return {};
          }
          if (ct.includes('application/json')) {
            return await res.json();
          }
          const text = await res.text();
          console.warn('Non-JSON response', res.url, text.slice(0, 200));
          return {};
        } catch (err) {
          console.warn('Failed to parse response', res.url, err);
          return {};
        }
      };

      const [pData, bData, cData, hsData] = await Promise.all([
        safeJson(pRes),
        safeJson(bRes),
        safeJson(cRes),
        safeJson(hsRes),
      ]);

      setProducts(Array.isArray(pData.products) ? pData.products : []);
      setBrands(Array.isArray(bData.brands) ? bData.brands : []);
      setCategories(Array.isArray(cData.categories) ? cData.categories : []);
      setHomeSections(Array.isArray(hsData.sections) ? hsData.sections : []);
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

  // One-time warning toast if admin token is missing
  useEffect(() => {
    if (!ADMIN_TOKEN && !warnedToken) {
      showToastCustom({
        title: isAR ? 'تحذير صلاحيات' : 'Auth Warning',
        description: isAR ? 'لم يتم ضبط NEXT_PUBLIC_ADMIN_TOKEN. قد تفشل عمليات الإنشاء/التعديل/الحذف.' : 'NEXT_PUBLIC_ADMIN_TOKEN is not set. Create/Update/Delete may fail.',
        variant: 'danger',
        duration: 4000,
      });
      setWarnedToken(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ADMIN_TOKEN, isAR, warnedToken]);

  function addImage() {
    if (!img) return;
    setForm((f) => ({ ...f, images: [...(f.images || []), { url: img }] }));
    setImg('');
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const isEditing = !!editingId;
      const url = isEditing ? `/api/products/${editingId}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let serverMsg = 'Create failed';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const j = await res.json();
            if (j?.error) serverMsg = j.error;
          } else {
            const t = await res.text();
            if (t) serverMsg = t.slice(0, 500);
          }
        } catch {}
        console.error('Product create failed', res.status, serverMsg);
        showToastCustom({
          title: isAR ? 'فشل الإنشاء' : 'Create failed',
          description: serverMsg,
          variant: 'danger',
          duration: 4000,
        });
        return;
      }
      setForm({ name: '', slug: '', price: 0, salePrice: null, stock: 0, images: [], sku: null, color: null, sectionTypes: [], sectionSlugs: [] });
      setDiscountPct('');
      setEditingId(null);
      await load();
      showToastCustom({
        title: isAR ? (editingId ? 'تم التحديث' : 'تم الإنشاء') : (editingId ? 'Updated' : 'Created'),
        description: isAR ? 'تم حفظ بيانات المنتج بنجاح.' : 'Product saved successfully.',
        variant: 'success',
      });
    } catch (e) {
      console.error(e);
      showToastCustom({ title: isAR ? 'خطأ غير متوقع' : 'Unexpected error', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  function onStartEdit(p: Product) {
    setEditingId(p._id || null);
    setForm({
      name: p.name || '',
      slug: p.slug || '',
      brandId: p.brandId ?? null,
      categoryId: p.categoryId ?? null,
      sku: p.sku ?? null,
      color: p.color ?? null,
      price: p.price || 0,
      salePrice: p.salePrice ?? null,
      stock: p.stock || 0,
      description: p.description || '',
      isFeatured: !!p.isFeatured,
      images: p.images || [],
      sectionTypes: p.sectionTypes || [],
      sectionSlugs: p.sectionSlugs || [],
    });
    // compute discount % if any
    if (p.salePrice != null && p.salePrice < p.price) {
      const pct = p.price > 0 ? Math.max(0, Math.min(100, 100 - (p.salePrice / p.price) * 100)) : 0;
      setDiscountPct(pct.toFixed(0));
    } else {
      setDiscountPct('');
    }
  }

  function onCancelEdit() {
    setEditingId(null);
    setForm({ name: '', slug: '', price: 0, salePrice: null, stock: 0, images: [], sku: null, color: null, sectionTypes: [], sectionSlugs: [] });
    setDiscountPct('');
  }

  async function onDelete(id?: string) {
    if (!id) return;
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
        },
      });
      await load();
      showToastCustom({
        title: isAR ? 'تم الحذف' : 'Deleted',
        description: isAR ? 'تم حذف المنتج.' : 'Product has been deleted.',
        variant: 'success',
      });
    } catch (e) { console.error(e); }
  }

  // Auto-open editor when coming with ?edit=<slug or id>
  useEffect(() => {
    const key = searchParams?.get('edit');
    if (!key) return;
    if (!products || products.length === 0) return;
    if (editingId) return;
    const lower = key.toLowerCase();
    const target = products.find(p => (p._id === key) || (p.slug?.toLowerCase?.() === lower));
    if (target) {
      onStartEdit(target);
      try { window?.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
    }
  }, [products, searchParams, editingId]);

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
              <span className="sm:ms-1">المنتجات</span>
            </>
          ) : (
            <>
              <span>Admin</span>
              <span className="hidden sm:inline"> • </span>
              <span className="sm:ms-1">Products</span>
            </>
          )}
        </h1>
        {/* Kept UI clean; warning is now shown as a toast on mount */}

        <form onSubmit={onSubmit} className="grid md:grid-cols-6 gap-4 bg-white p-4 rounded-xl shadow">
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
          <select value={form.brandId ?? ''} onChange={(e)=>setForm({ ...form, brandId: e.target.value || null })} className="input input-bordered w-full p-2 rounded border border-gray-300">
            <option value="">{isAR ? 'الماركة (اختياري)' : 'Brand (optional)'}</option>
            {brands.map(b=> (<option key={b._id} value={b._id}>{b.name}</option>))}
          </select>
          <select value={form.categoryId ?? ''} onChange={(e)=>setForm({ ...form, categoryId: e.target.value || null })} className="input input-bordered w-full p-2 rounded border border-gray-300">
            <option value="">{isAR ? 'التصنيف' : 'Category'}</option>
            {categories.map(c=> (<option key={c._id} value={c._id}>{c.name}</option>))}
          </select>
          <input value={form.sku ?? ''} onChange={(e)=>setForm({ ...form, sku: e.target.value || null })} placeholder={isAR ? 'رمز المنتج SKU (اختياري)' : 'SKU (optional)'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <input value={form.color ?? ''} onChange={(e)=>setForm({ ...form, color: e.target.value || null })} placeholder={isAR ? 'اللون (مثال: بني) (اختياري)' : 'Color (e.g., Brown) (optional)'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{isAR ? 'السعر' : 'Price'}</span>
            <input value={form.price} onChange={(e)=>{
              const price = Number(e.target.value) || 0;
              setForm((f)=>{
                // if discountPct set, recompute salePrice from pct
                if (discountPct !== '') {
                  const pct = Math.max(0, Math.min(100, Number(discountPct) || 0));
                  const sp = +(price * (1 - pct/100)).toFixed(2);
                  return { ...f, price, salePrice: sp };
                }
                return { ...f, price };
              });
            }} type="number" step="0.01" placeholder={isAR ? 'السعر' : 'Price'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{isAR ? 'سعر التخفيض (اختياري)' : 'Sale Price (optional)'}</span>
            <input value={form.salePrice ?? ''} onChange={(e)=>{
              const v = e.target.value;
              const sp = v === '' ? null : (Number(v) || 0);
              setForm({ ...form, salePrice: sp });
              // update discount % based on price
              if (v === '' || sp == null) {
                setDiscountPct('');
              } else {
                const pct = form.price > 0 ? Math.max(0, Math.min(100, 100 - (sp / form.price) * 100)) : 0;
                setDiscountPct(pct.toFixed(0));
              }
            }} type="number" step="0.01" placeholder={isAR ? 'سعر التخفيض (اختياري)' : 'Sale Price (optional)'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{isAR ? 'نسبة الخصم %' : 'Discount %'}</span>
            <div className="flex items-center gap-2">
              <input value={discountPct} onChange={(e)=>{
                const raw = e.target.value;
                // allow empty to clear
                setDiscountPct(raw);
                const pct = raw === '' ? null : Math.max(0, Math.min(100, Number(raw) || 0));
                setForm((f)=>{
                  if (pct === null) return { ...f, salePrice: null };
                  const sp = +(f.price * (1 - pct/100)).toFixed(2);
                  return { ...f, salePrice: sp };
                });
              }} type="number" step="1" min={0} max={100} placeholder={isAR ? 'نسبة الخصم %' : 'Discount %'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
              <button type="button" onClick={()=>{ setDiscountPct(''); setForm((f)=>({ ...f, salePrice: null })); }} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">{isAR ? 'مسح' : 'Clear'}</button>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{isAR ? 'المخزون' : 'Stock'}</span>
            <input value={form.stock} onChange={(e)=>setForm({ ...form, stock: Number(e.target.value) || 0 })} type="number" placeholder={isAR ? 'المخزون' : 'Stock'} className="input input-bordered w-full p-2 rounded border border-gray-300" />
          </div>
          <input value={img} onChange={(e)=>setImg(e.target.value)} placeholder={isAR ? 'رابط الصورة' : 'Image URL'} className="md:col-span-3 input input-bordered w-full p-2 rounded border border-gray-300" />
          <button type="button" onClick={addImage} className="md:col-span-1 bg-gray-100 hover:bg-gray-200 rounded px-3 py-2">{isAR ? 'إضافة' : 'Add'}</button>
          <div className="md:col-span-2">
            <CloudinaryUploader
              folder="products"
              buttonText={isAR ? 'رفع إلى كلاوديناري' : 'Upload to Cloudinary'}
              buttonClassName="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 cursor-pointer w-full justify-center"
              onUploaded={(url)=> setForm((f)=> ({ ...f, images: [...(f.images||[]), { url }] }))}
            />
          </div>
          {/* Images live preview: first image large, rest small thumbnails */}
          <div className="md:col-span-6">
            <div className="text-xs text-gray-500 mb-2">{isAR ? 'معاينة الصور' : 'Images preview'}</div>
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="w-40 h-40 rounded border border-gray-200 bg-gray-100 overflow-hidden flex items-center justify-center">
                {form.images && form.images.length > 0 && form.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.images[0].url} alt="main" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">{isAR ? 'لا توجد صورة' : 'No image'}</span>
                )}
                {form.salePrice != null && form.salePrice < form.price ? (
                  <span className="absolute top-2 right-2 text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    -{Math.round(((form.price - (form.salePrice||0)) / (form.price||1)) * 100)}%
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.images || []).slice(1).map((im, i) => (
                  <button
                    key={im.url + i}
                    type="button"
                    title={isAR ? 'تعيين كصورة رئيسية' : 'Set as main image'}
                    onClick={()=> setForm(f=>{
                      const arr = [...(f.images || [])];
                      const idx = i + 1; // because we sliced from 1
                      const [picked] = arr.splice(idx, 1);
                      arr.unshift(picked);
                      return { ...f, images: arr };
                    })}
                    className="relative group w-16 h-16 rounded border border-gray-200 overflow-hidden bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt={im.alt || 'thumb'} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 text-[10px] text-white bg-black/40 text-center opacity-0 group-hover:opacity-100">{isAR ? 'رئيسية' : 'Main'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea value={form.description || ''} onChange={(e)=>setForm({ ...form, description: e.target.value })} placeholder={isAR ? 'الوصف' : 'Description'} className="md:col-span-6 input input-bordered w-full p-2 rounded border border-gray-300 min-h-24" />
          <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.isFeatured} onChange={(e)=>setForm({ ...form, isFeatured: e.target.checked })} />
            {isAR ? 'مميز' : 'Featured'}
          </label>
          <div className="md:col-span-4">
            <div className="text-xs text-gray-500 mb-1">{isAR ? 'أقسام الصفحة الرئيسية (اختياري)' : 'Homepage Sections (optional)'}</div>
            <div className="flex flex-wrap gap-3 text-sm">
              {(['featured','sale','new','bestseller','recommended'] as const).map(st => (
                <label key={st} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.sectionTypes?.includes(st)}
                    onChange={(e)=>{
                      setForm(f=>{
                        const curr = new Set(f.sectionTypes || []);
                        if (e.target.checked) curr.add(st); else curr.delete(st);
                        return { ...f, sectionTypes: Array.from(curr) as Product['sectionTypes'] };
                      });
                    }}
                  />
                  {isAR ? ({
                    featured: 'مميز',
                    sale: 'تخفيض',
                    new: 'جديد',
                    bestseller: 'الأكثر مبيعاً',
                    recommended: 'مقترح',
                  } as const)[st] : st}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-6">
            <div className="text-xs text-gray-500 mb-1">{isAR ? 'إسناد إلى أقسام رئيسية محددة (يشمل المخصصة تلقائيًا)' : 'Assign to Specific Home Sections (auto: includes custom ones)'}</div>
            <div className="flex flex-wrap gap-3 text-sm">
              {homeSections.map((s)=>{
                const label = s.filters?.customTypeName || s.titleEn || s.slug;
                const slug = s.slug;
                const checked = !!form.sectionSlugs?.includes(slug);
                return (
                  <label key={s._id} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e)=>{
                        setForm(f=>{
                          const curr = new Set(f.sectionSlugs || []);
                          if (e.target.checked) curr.add(slug); else curr.delete(slug);
                          return { ...f, sectionSlugs: Array.from(curr) };
                        });
                      }}
                    />
                    {label} <span className="text-[10px] text-gray-400">/{slug}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-4 flex items-center gap-3">
            <button disabled={loading} type="submit" className="bg-[#2F3E77] text-white rounded px-4 py-2 hover:brightness-95 disabled:opacity-60">
              {loading ? (isAR ? 'جارٍ الحفظ...' : 'Saving...') : (editingId ? (isAR ? 'تحديث المنتج' : 'Update Product') : (isAR ? 'إنشاء منتج' : 'Create Product'))}
            </button>
            {editingId && (
              <button type="button" onClick={onCancelEdit} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">{isAR ? 'إلغاء' : 'Cancel'}</button>
            )}
          </div>
        </form>

        {/* Live preview of product card */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">{isAR ? 'معاينة' : 'Preview'}</h2>
          <div className="bg-white p-4 rounded-xl shadow inline-block">
            <div className="w-56">
              <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square flex items-center justify-center">
                {form.images && form.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.images[0].url} alt={form.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="text-gray-400">{isAR ? 'لا توجد صورة' : 'No image'}</div>
                )}
                {form.salePrice != null && form.salePrice < form.price ? (
                  <span className="absolute top-2 right-2 text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full">
                    -{Math.round(((form.price - (form.salePrice||0)) / (form.price||1)) * 100)}%
                  </span>
                ) : null}
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-[11px] text-gray-600">
                  {brands.find(b=>b._id===form.brandId)?.name || (isAR ? 'ماركة' : 'Brand')}
                </div>
                <div className="font-semibold line-clamp-2 text-sm">{form.name || (isAR ? 'اسم المنتج' : 'Product name')}</div>
                {form.color ? (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-gray-600">{isAR ? 'اللون' : 'Color'}</span>
                    <span className="px-2 py-0.5 rounded bg-gray-100">{form.color}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <div className="font-bold">{form.salePrice != null && form.salePrice < form.price ? form.salePrice.toFixed(2) : form.price.toFixed(2)} EGP</div>
                  {form.salePrice != null && form.salePrice < form.price ? (
                    <div className="text-xs text-gray-400 line-through">{form.price.toFixed(2)} EGP</div>
                  ) : null}
                </div>
                <div className="text-xs text-emerald-700 mt-1">{isAR ? 'متوفر بالمخزون - ' : 'In Stock - '}{form.stock || 0} {isAR ? 'قطعة' : 'available'}</div>
                <button className="w-full bg-[#2F3E77] text-white text-sm rounded px-3 py-2 mt-2">{isAR ? 'أضف إلى السلة' : 'Add to Cart'}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 mt-6">
          {products.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl p-3 sm:p-4 shadow border border-gray-100">
              <div className="flex gap-3">
                {/* Thumbnail */}
                {p.images && p.images[0]?.url ? (
                  <img src={p.images[0].url} alt={p.name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md ring-1 ring-gray-200" />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-md" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 break-all">/{p.slug}</div>
                    </div>
                    {/* Price (top-right on larger screens) */}
                    <div className="hidden sm:flex items-center gap-2 text-sm">
                      <span className="font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-gray-100 text-gray-900">{(p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price).toFixed(2)} EGP</span>
                      {p.salePrice != null && p.salePrice < p.price ? (
                        <span className="text-gray-400 line-through whitespace-nowrap">{p.price.toFixed(2)} EGP</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Badges */}
                  {p.sectionSlugs && p.sectionSlugs.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.sectionSlugs.map(sl => (
                        <span key={sl} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{sl}</span>
                      ))}
                    </div>
                  ) : null}
                  {p.sectionTypes && p.sectionTypes.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.sectionTypes.map(st => (
                        <span key={st} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{st}</span>
                      ))}
                    </div>
                  ) : null}

                  {/* Price on mobile (under content) */}
                  <div className="sm:hidden mt-2 flex items-center gap-2 text-sm">
                    <span className="font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-gray-100 text-gray-900">{(p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price).toFixed(2)} EGP</span>
                    {p.salePrice != null && p.salePrice < p.price ? (
                      <span className="text-gray-400 line-through whitespace-nowrap">{p.price.toFixed(2)} EGP</span>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="mt-2 sm:mt-0 flex justify-end sm:justify-end gap-2 text-xs sm:text-sm border-t pt-2 sm:border-0 sm:pt-0">
                    <button onClick={()=>onStartEdit(p)} className="px-3 py-1.5 rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50">
                      {isAR ? 'تعديل' : 'Edit'}
                    </button>
                    <button onClick={()=>onDelete(p._id)} className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50">
                      {isAR ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

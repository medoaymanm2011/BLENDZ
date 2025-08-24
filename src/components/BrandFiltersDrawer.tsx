'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function BrandFiltersDrawer() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  // Store selections by backend IDs
  const [selectedBrands, setSelectedBrands] = useState<Record<string, boolean>>({});
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  type ApiBrand = { _id: string; name: string; slug?: string };
  type ApiCategory = { _id: string; slug: string; name?: string; nameObj?: { ar?: string; en?: string }; nameAr?: string; nameEn?: string };
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const appliedCount = useMemo(() => {
    const brandCount = Object.values(selectedBrands).filter(Boolean).length;
    const categoryCount = Object.values(selectedCategories).filter(Boolean).length;
    const priceCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);
    return brandCount + categoryCount + priceCount;
  }, [selectedBrands, selectedCategories, minPrice, maxPrice]);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Load brands and categories
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingMeta(true);
        setMetaError(null);
        const [bRes, cRes] = await Promise.all([
          fetch('/api/brands', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);
        if (!active) return;
        if (!bRes.ok || !cRes.ok) throw new Error('Failed to load filters');
        const bJson = await bRes.json();
        const cJson = await cRes.json();
        setBrands(Array.isArray(bJson?.brands) ? bJson.brands : []);
        setCategories(Array.isArray(cJson?.categories) ? cJson.categories : []);
      } catch (e: any) {
        if (active) setMetaError(e?.message || 'Error loading filters');
      } finally {
        if (active) setLoadingMeta(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Initialize from URL
  useEffect(() => {
    const nextBrands: Record<string, boolean> = {};
    const nextCats: Record<string, boolean> = {};
    // collect all brands[i] params
    for (const [key, val] of searchParams.entries()) {
      if (key.startsWith('brands[')) {
        // val is backend brand id
        if (val) nextBrands[val] = true;
      }
      if (key.startsWith('categories[')) {
        // val is backend category id
        if (val) nextCats[val] = true;
      }
    }
    setSelectedBrands(nextBrands);
    setSelectedCategories(nextCats);
    setMinPrice(searchParams.get('minPrice') ?? '');
    setMaxPrice(searchParams.get('maxPrice') ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const resetAll = () => {
    setSelectedBrands({});
    setSelectedCategories({});
    setMinPrice('');
    setMaxPrice('');
  };

  const apply = () => {
    const params = new URLSearchParams();
    // brands[] as brands[0]=id ...
    const brandIds = Object.entries(selectedBrands)
      .filter(([, v]) => v)
      .map(([id]) => id)
      .filter(Boolean);
    brandIds.forEach((id, idx) => params.set(`brands[${idx}]`, String(id)));

    // categories[]
    const catIds = Object.entries(selectedCategories)
      .filter(([, v]) => v)
      .map(([id]) => id)
      .filter(Boolean);
    catIds.forEach((id, idx) => params.set(`categories[${idx}]`, String(id)));

    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger + applied count */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 10h12M10 16h4M11 20h2"/></svg>
          <span>{t('filters.open')}</span>
          {appliedCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
              {appliedCount}
            </span>
          )}
        </button>
        <span className="text-sm text-gray-600">
          {appliedCount > 0 ? `${t('filters.applied')} ${appliedCount}` : t('filters.none')}
        </span>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => setOpen(false)}
          aria-hidden="true"
          data-aria-hidden="true"
          data-state="open"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[440px] bg-white rounded-l-2xl border-l border-gray-200 shadow-2xl z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white z-10 rounded-tl-2xl">
          <h3 className="text-2xl font-extrabold text-gray-800">{t('filters.title')}</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetAll}
              className="text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl shadow-sm"
            >
              {t('filters.resetAll')}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-black"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Brands */}
          <section>
            <h4 className="text-lg font-bold text-gray-800 mb-3">{t('filters.brands')}</h4>
            <div className="space-y-3">
              {loadingMeta && <div className="text-sm text-gray-500">{t('common.loading')}</div>}
              {!loadingMeta && brands.length === 0 && (
                <div className="text-sm text-gray-400">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div>
              )}
              {!loadingMeta && brands.map((b) => (
                <label key={b._id} className="flex items-center gap-3 text-[15px] text-gray-800">
                  <input
                    type="checkbox"
                    className="accent-blue-700 w-5 h-5"
                    checked={!!selectedBrands[b._id]}
                    onChange={(e) => setSelectedBrands((s) => ({ ...s, [b._id]: e.target.checked }))}
                  />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
          </section>
          <div className="border-t border-gray-200 my-2" />
          {/* Categories */}
          <section>
            <h4 className="text-lg font-bold text-gray-800 mb-3">{t('filters.categories')}</h4>
            <div className="space-y-3">
              {loadingMeta && <div className="text-sm text-gray-500">{t('common.loading')}</div>}
              {!loadingMeta && categories.length === 0 && (
                <div className="text-sm text-gray-400">{locale === 'ar' ? 'لا توجد بيانات' : 'No data'}</div>
              )}
              {!loadingMeta && categories.map((c) => (
                <div key={c._id} className="flex items-center justify-between gap-3 text-[15px] text-gray-800">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="accent-blue-700 w-5 h-5"
                        checked={!!selectedCategories[c._id]}
                        onChange={(e) => setSelectedCategories((s) => ({ ...s, [c._id]: e.target.checked }))}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-left hover:text-blue-700"
                      onClick={() => { router.push(`/${locale}/search?categories[0]=${c._id}`); setOpen(false); }}
                    >
                      {(() => {
                        const ar = c.nameObj?.ar || (c as any).nameAr;
                        const en = c.nameObj?.en || (c as any).nameEn;
                        const fallback = c.name;
                        return locale === 'ar' ? (ar || fallback || c.slug) : (en || fallback || c.slug);
                      })()}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-blue-700 hover:text-blue-800 text-sm"
                    onClick={() => { router.push(`/${locale}/search?categories[0]=${c._id}`); setOpen(false); }}
                    aria-label="Open category"
                  >
                    {t('filters.view')}
                  </button>
                </div>
              ))}
            </div>
          </section>
          <div className="border-t border-gray-200 my-2" />
          {/* Price Range */}
          <section>
            <h4 className="text-lg font-bold text-gray-800 mb-3">{t('filters.priceRange')}</h4>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('filters.minPrice')}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-black placeholder:text-gray-400"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="pb-2 text-center text-gray-400">—</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('filters.maxPrice')}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-black placeholder:text-gray-400"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                className="text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-xl shadow-sm"
              >
                {t('filters.resetPrice')}
              </button>
              {(minPrice && maxPrice) && (
                <span className="text-sm text-black">
                  {t('filters.rangePrefix')}
                  {Number(minPrice).toFixed(2)} - {Number(maxPrice).toFixed(2)}
                </span>
              )}
            </div>
          </section>
        </div>

        <div className="p-5 border-t border-gray-200 bg-white rounded-bl-2xl">
          <button
            type="button"
            onClick={apply}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors font-semibold"
          >
            {t('filters.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

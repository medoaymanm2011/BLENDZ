'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import BrandFiltersDrawer from '@/components/BrandFiltersDrawer';
import SortDropdown from '@/components/SortDropdown';
import ProductSearchInput from '@/components/ProductSearchInput';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';

// No local mock data. Use shared products data so images/info match homepage.

type DbProduct = {
  _id: string;
  name: string;
  slug: string;
  brandId?: string | null;
  categoryId?: string | null;
  price: number;
  salePrice?: number | null;
  images?: { url: string }[];
};

function CardFromDb({ p }: { p: DbProduct }) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const { showToast } = useToast();
  const img = p.images && p.images[0]?.url;
  const price = p.salePrice != null && p.salePrice < p.price ? p.salePrice : p.price;
  const hasDiscount = p.salePrice != null && p.salePrice < p.price;
  const liked = isInWishlist(p._id);
  const brandLabel = p.brandId || '';

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (liked) {
      removeFromWishlist(p._id);
      showToast('Removed from wishlist');
    } else {
      addToWishlist(p._id);
      showToast('Added to wishlist');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(p._id, 1);
    showToast('Added to cart');
  };
  return (
    <div className="group relative block bg-white rounded-2xl shadow-sm transition-all overflow-hidden border border-gray-200 will-change-transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-100 hover:ring-1 hover:ring-blue-200/60">
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden>
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/40 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
      </div>
      <a href={`/product/${p.slug || (p as any)._id}`} className="block">
        <div className="relative aspect-[4/5] md:aspect-[3/4] bg-gray-100 overflow-hidden">
          {hasDiscount ? (
            <span className="absolute top-3 right-3 z-10 bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{Math.round(((p.price - (p.salePrice||0)) / (p.price||1)) * 100)}%
            </span>
          ) : null}
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={p.name} className="object-cover w-full h-full" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">🧸</div>
          )}
        </div>

        <div className="p-4">
          {brandLabel ? (
            <span className="inline-block mb-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {brandLabel}
            </span>
          ) : null}
          <h3 className="font-semibold text-gray-800 mb-2 text-left leading-snug line-clamp-2">{p.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-lg font-extrabold text-blue-900">{price.toFixed(2)} EGP</span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">{p.price.toFixed(2)} EGP</span>
              )}
            </div>
          </div>
        </div>
      </a>

      <button
        type="button"
        aria-label="Toggle wishlist"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(e); }}
        className="absolute top-3 left-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md"
      >
        <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" className={`w-5 h-5 ${liked ? 'text-rose-600' : 'text-gray-700'}`}> 
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const locale = useLocale();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<DbProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build API URL preserving query params
  const apiUrl = useMemo(() => {
    const qp = new URLSearchParams();
    for (const [k, v] of (searchParams as any).entries()) qp.append(k, Array.isArray(v) ? v[0] : v);
    return `/api/products?${qp.toString()}`;
  }, [searchParams]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setError(null);
        const res = await fetch(apiUrl, { signal: ac.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setItems(data.products || []);
      } catch (e: any) {
        // Ignore abort errors triggered by fast param changes/unmount
        if (e?.name === 'AbortError' || e?.message === 'The operation was aborted.') return;
        setError(e.message || 'Failed to load');
      }
    })();
    return () => ac.abort();
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Page Title & search input like brand page */}
        <div className="mb-2">
          <h1 className="text-xl md:text-3xl font-extrabold text-gray-800">{t('search.resultsTitle')}</h1>
        </div>
        <div className="mb-3">
          <ProductSearchInput />
        </div>

        {/* Toolbar: Filters + Sort */}
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:justify-between mb-4 md:mb-6">
          <BrandFiltersDrawer />
          <SortDropdown />
        </div>

        {/* Grid results from DB */}
        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : !items ? (
          <p className="text-gray-600">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600">{locale === 'ar' ? 'لا توجد نتائج بحث' : 'No results found'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((p) => (
              <CardFromDb key={p._id} p={p} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
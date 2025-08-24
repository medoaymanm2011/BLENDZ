'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import LocaleLink from '@/components/LocaleLink';

type WishCardProduct = {
  id: string; // DB id as string
  slug: string;
  name: { ar: string; en: string };
  brandSlug: string;
  categorySlugs: string[];
  price: number;
  originalPrice?: number;
  images: string[];
  isNew?: boolean;
  discount?: number;
  tags?: string[];
};

function DBProductCard({ product, onRemove }: { product: WishCardProduct; onRemove: (id: string) => void }) {
  const locale = useLocale();
  const t = useTranslations();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const [imgLoaded, setImgLoaded] = useState(
    !(product.images && product.images[0] && /^(https?:)?\//.test(product.images[0]))
  );

  const brandName = product.brandSlug || 'brand';

  return (
    <div className="group relative block bg-white rounded-2xl shadow-sm transition-all overflow-hidden border border-gray-200 will-change-transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-100 hover:ring-1 hover:ring-blue-200/60">
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden>
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/40 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
      </div>
      {/* Clickable area to product page */}
      <LocaleLink href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] md:aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* Discount/New badge */}
          {product.discount ? (
            <span className="absolute top-3 right-3 z-10 bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{product.discount}%
            </span>
          ) : product.isNew ? (
            <span className="absolute top-3 right-3 z-10 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {t('products.new')}
            </span>
          ) : null}

          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}

          {product.images && product.images[0] && /^(https?:)?\//.test(product.images[0]) ? (
            <Image
              src={product.images[0]}
              alt={locale === 'ar' ? product.name.ar : product.name.en}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">{product.images?.[0] ?? '🧸'}</div>
          )}
        </div>
      </LocaleLink>

      {/* Wishlist toggle */}
      <button
        type="button"
        aria-label="Toggle wishlist"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // DB ids are strings
          if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
          } else {
            addToWishlist(product.id);
          }
        }}
        className="absolute top-3 left-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full bg-transparent hover:bg-transparent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
          stroke="currentColor"
          className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-rose-600' : 'text-white'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Content */}
      <div className="p-4">
        <span className="inline-block mb-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
          {brandName}
        </span>
        <h3 className="font-semibold text-gray-800 mb-2 text-left leading-snug line-clamp-2">
          {locale === 'ar' ? product.name.ar : product.name.en}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="text-lg font-extrabold text-blue-900">{product.price} {t('products.currency')}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">{product.originalPrice} {t('products.currency')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Add to cart bar */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => { addToCart(product.id, 1); }}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          {/* cart icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>
          {t('products.addToCart')}
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const locale = useLocale();
  const store = useStore();
  const { showToast } = useToast();

  const [items, setItems] = useState<WishCardProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch each product in wishlist from API (DB)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = store.wishlist.map((id) => String(id)).filter(Boolean);
      if (ids.length === 0) { setItems([]); return; }
      setLoading(true);
      try {
        const resp = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (cancelled) return;
        if (!resp.ok) { setItems([]); setLoading(false); return; }
        const json = await resp.json();
        const products = Array.isArray(json?.products) ? json.products : [];
        const mapped: WishCardProduct[] = products.map((p: any) => {
          const hasSale = typeof p?.salePrice === 'number' && p.salePrice >= 0 && p.salePrice < p.price;
          const price = hasSale ? p.salePrice : p.price;
          const originalPrice = hasSale ? p.price : undefined;
          const firstImage = Array.isArray(p?.images) && p.images.length ? p.images[0]?.url : undefined;
          const discount = hasSale && originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
          return {
            id: String(p?._id || p?.slug || ''),
            slug: p?.slug || String(p?._id || ''),
            name: { ar: p?.name || '', en: p?.name || '' },
            brandSlug: 'brand',
            categorySlugs: [],
            price,
            originalPrice,
            images: firstImage ? [firstImage] : [],
            isNew: false,
            discount: discount && discount > 0 ? discount : undefined,
            tags: Array.isArray(p?.sectionTypes) ? p.sectionTypes : undefined,
          };
        });
        setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [store.wishlist]);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8 relative">
        {/* Title row */}
        <div className="flex items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#2F3E77]" />
            <h1 className="text-3xl font-bold tracking-tight text-[#2F3E77]">{locale === 'ar' ? 'قائمة المفضلة' : 'Wishlist'}</h1>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              store.wishlist.forEach((id) => store.removeFromWishlist(id));
              showToast(locale === 'ar' ? 'تم حذف كل المفضلة' : 'Cleared Wishlist');
            }}
            className="absolute top-2 right-2 inline-flex items-center gap-2 h-8 px-3 rounded-lg text-xs border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" /> {locale === 'ar' ? 'حذف الكل' : 'Clear Wishlist'}
          </button>
        )}
        {/* Content area: full-width container aligned to the left */}
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="min-h-[50vh] max-w-md w-full mx-auto flex flex-col items-center justify-center text-center text-gray-600">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : items.length === 0 ? (
            <div className="min-h-[50vh] max-w-md w-full mx-auto flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-[#2F3E77]" />
              </div>
              <h2 className="text-[#2F3E77] font-semibold text-lg">
                {locale === 'ar' ? 'قائمة المفضلة فارغة' : 'Your wishlist is empty'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {locale === 'ar' ? 'العناصر التي تُضيفها للمفضلة ستظهر هنا' : 'Items added to your wishlist will appear here'}
              </p>
              <Link
                href={`/${locale}`}
                className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-md bg-[#2F3E77] text-white hover:brightness-95 shadow-sm"
              >
                {locale === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="relative">
                  {/* remove button floating over card */}
                  <button
                    onClick={() => { store.removeFromWishlist(String(item.id)); showToast(locale === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from Wishlist'); }}
                    className="absolute z-30 top-3 left-3 inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <DBProductCard product={item} onRemove={(id) => store.removeFromWishlist(id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
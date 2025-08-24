'use client';

import { useEffect, useState } from 'react';
import LocaleLink from './LocaleLink';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { usePathname, useRouter } from 'next/navigation';
import type { Product as ProductData } from '@/data/products';

type SectionType = 'featured' | 'sale' | 'new' | 'bestseller' | 'recommended' | 'custom_query';
type HomeSection = {
  _id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  type: SectionType;
  filters?: { tags?: string[]; brandSlugs?: string[] } | Record<string, any>;
  sort?: 'newest' | 'topSelling' | 'priceAsc' | 'priceDesc' | 'custom';
  limit?: number;
};

export default function ProductSections() {
  const locale = useLocale();
  const t = useTranslations();
  const [sections, setSections] = useState<HomeSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionItems, setSectionItems] = useState<Record<string, ProductData[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/home-sections?locale=${locale}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (cancelled) return;
        setSections(Array.isArray(data?.sections) ? data.sections : []);
      } catch {
        if (!cancelled) setSections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [locale]);

  // When dynamic sections are available, fetch products for each section from DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!sections || sections.length === 0) return;
      const fetchOne = async (s: HomeSection): Promise<[string, ProductData[]]> => {
        try {
          // Only handle built-in section types via API for now
          if (['featured','sale','new','bestseller','recommended'].includes(s.type)) {
            const url = new URL('/api/products', window.location.origin);
            url.searchParams.set('sectionTypes[0]', s.type);
            const res = await fetch(url.toString(), { cache: 'no-store' });
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            const items = Array.isArray(data?.products) ? data.products : [];
            return [s.slug, items.map(mapDbProductToCardData)];
          } else if (s.type === 'custom_query') {
            const url = new URL('/api/products', window.location.origin);
            url.searchParams.set('sectionSlug', s.slug);
            const res = await fetch(url.toString(), { cache: 'no-store' });
            if (!res.ok) throw new Error('failed');
            const data = await res.json();
            const items = Array.isArray(data?.products) ? data.products : [];
            return [s.slug, items.map(mapDbProductToCardData)];
          }
        } catch {}
        // graceful empty
        return [s.slug, []];
      };

      const entries = await Promise.all(sections.map(fetchOne));
      if (cancelled) return;
      setSectionItems(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [sections]);

  // If dynamic sections are available, render them; otherwise show an empty state
  if (!loading && sections && sections.length > 0) {
    return (
      <>
        {sections.map((s) => (
          <section key={s._id} className="py-4 md:py-10 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="9" r="3.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5L8 20l4-2 4 2-1.5-6.5" />
                    </svg>
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{locale === 'ar' ? s.titleAr : s.titleEn}</h2>
                </div>
                <LocaleLink href={`/sections/${s.slug}`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
                  {t('products.viewAll')}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </LocaleLink>
              </div>
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                  {(sectionItems[s.slug] ?? []).slice(0, s.limit ?? 12).map((product, i) => (
                    <div key={`${s.slug}-${product.id}-${i}`} className="snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                  {(!sectionItems[s.slug] || sectionItems[s.slug].length === 0) && (
                    <div className="text-sm text-gray-500 py-8 px-4">{t('common.noData')}</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </>
    );
  }

  // No sections -> empty state
  if (!loading && (!sections || sections.length === 0)) {
    return (
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">{t('common.noData')}</div>
        </div>
      </section>
    );
  }

  // Map DB product to local ProductData shape used by cards
  function mapDbProductToCardData(db: any): ProductData {
    const hasSale = typeof db?.salePrice === 'number' && db.salePrice >= 0 && db.salePrice < db.price;
    const price = hasSale ? db.salePrice : db.price;
    const originalPrice = hasSale ? db.price : undefined;
    const firstImage = Array.isArray(db?.images) && db.images.length ? db.images[0]?.url : undefined;
    const discount = hasSale && originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
    return {
      id: db?._id || db?.slug || Math.random(),
      slug: db?.slug || String(db?._id || ''),
      name: { ar: db?.name || '', en: db?.name || '' },
      brandSlug: db?.brand?.slug || db?.brandSlug || 'brand',
      categorySlugs: [],
      price,
      originalPrice,
      images: firstImage ? [firstImage] : [],
      isNew: false,
      discount: discount && discount > 0 ? discount : undefined,
      tags: (Array.isArray(db?.sectionTypes) ? db.sectionTypes : undefined) as any,
      // pass stock for OOS rendering
      stock: typeof db?.stock === 'number' ? db.stock : undefined,
    } as any;
  }

  function ProductCard({ product }: { product: ProductData }) {
    const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useStore();
    const { showToast, showToastCustom } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const [imgLoaded, setImgLoaded] = useState(
      !(product.images && product.images[0] && /^(https?:)?\//.test(product.images[0]))
    );
    const isOut = ((product as any)?.stock ?? 0) <= 0;

    return (
      <div className="relative w-80 flex-shrink-0">
      <LocaleLink href={`/product/${product.slug}`} className="group relative block bg-white rounded-2xl shadow-sm transition-all overflow-hidden border border-gray-200 will-change-transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-100 hover:ring-1 hover:ring-blue-200/60">
        {/* soft glow overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden>
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
        </div>
        {/* Image area */}
        <div className="relative aspect-[4/5] md:aspect-[3/4] bg-gray-100 overflow-hidden">
          {/* Discount/New badge */}
          {product.discount && (
            <span className="absolute top-3 right-3 z-10 bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              -{product.discount}%
            </span>
          )}
          {!product.discount && product.isNew && (
            <span className="absolute top-3 right-3 z-10 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {t('products.new')}
            </span>
          )}
          {/* Removed OOS overlay badge per request */}

          {/* Skeleton */}
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-200" />
          )}

          {/* Image or emoji */}
          {product.images && product.images[0] && /^(https?:)?\//.test(product.images[0]) ? (
            <Image
              src={product.images[0]}
              alt={locale === 'ar' ? product.name.ar : product.name.en}
              fill
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 20rem"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">{product.images?.[0] ?? '🧸'}</div>
          )}
          {/* Optional: bottom fade removed for full-bleed look */}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Optional brand chip (show slug if available) */}
          {product.brandSlug && (
            <span className="inline-block mb-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {product.brandSlug}
            </span>
          )}
          <h3 className="font-semibold text-gray-800 mb-2 text-left leading-snug line-clamp-2">
            {locale === 'ar' ? product.name.ar : product.name.en}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-lg font-extrabold text-blue-900">{product.price} {t('products.currency')}</span>
            </div>
          </div>
        </div>

        {/* Add to cart bar */}
        <div className="px-4 pb-4">
          <button
            disabled={isOut}
            className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${isOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isOut) return;
              // require login
              try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                const data = await res.json();
                if (!res.ok || !data?.user) {
                  showToastCustom({
                    title: t('auth.loginRequired.title'),
                    description: t('auth.loginRequired.description'),
                    variant: 'danger',
                    duration: 1500,
                  });
                  const target = pathname || `/${locale}`;
                  router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
                  return;
                }
              } catch {
                showToastCustom({
                  title: t('auth.loginRequired.title'),
                  description: t('auth.loginRequired.description'),
                  variant: 'danger',
                  duration: 1500,
                });
                const target = pathname || `/${locale}`;
                router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
                return;
              }
              await addToCart(product.id, 1);
              showToast(t('toasts.addedToCart'));
            }}
          >
            {/* bag icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>
            {isOut ? (locale === 'ar' ? 'غير متوفر' : 'Out of stock') : t('products.addToCart')}
          </button>
        </div>
      </LocaleLink>

      {/* Wishlist overlay button (outside Link) */}
      <button
        type="button"
        aria-label="wishlist"
        title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        disabled={isOut}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isOut) return;
          // require login
          try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            const data = await res.json();
            if (!res.ok || !data?.user) {
              showToastCustom({
                title: t('auth.loginRequired.title'),
                description: t('auth.loginRequired.description'),
                variant: 'danger',
                duration: 1500,
              });
              const target = pathname || `/${locale}`;
              router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
              return;
            }
          } catch {
            showToastCustom({
              title: t('auth.loginRequired.title'),
              description: t('auth.loginRequired.description'),
              variant: 'danger',
              duration: 1500,
            });
            const target = pathname || `/${locale}`;
            router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
            return;
          }
          if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
            showToast('Removed from Wishlist');
          } else {
            addToWishlist(product.id);
            showToast('Added to Wishlist');
          }
        }}
        className={`absolute top-3 left-3 z-20 w-9 h-9 rounded-full border inline-flex items-center justify-center transition-colors duration-150 ${isOut ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-200 bg-white shadow-md'} ${isInWishlist(product.id) ? 'text-rose-600 hover:bg-rose-50' : (!isOut ? 'text-gray-700 hover:bg-red-50 hover:text-red-600' : '')}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.1 20.3s-4.9-3.3-7.2-6.2C2.6 11.6 3.4 8 6.3 7.4c1.4-.3 2.8.3 3.7 1.4.9-1.1 2.3-1.7 3.7-1.4 2.9.6 3.7 4.2 1.4 6.7-2.3 2.9-7 6.2-7 6.2z"/>
        </svg>
      </button>
      </div>
    );
  };

  // Loading state
  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-500">{t('common.loading')}</div>
      </div>
    </section>
  );
};
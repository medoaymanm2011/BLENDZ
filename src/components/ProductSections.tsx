'use client';

import { useEffect, useState } from 'react';
import LocaleLink from './LocaleLink';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { products as productsData, type Product as ProductData } from '@/data/products';
import { brands as brandsData } from '@/data/brands';

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

  const getFilteredProducts = () => {
    const featured = productsData.filter(p => p.tags?.includes('featured'));
    if (featured.length === 0) return productsData.slice(0, 12);
    const minCount = 12;
    if (featured.length >= minCount) return featured;
    const repeats = Math.ceil(minCount / featured.length);
    return Array.from({ length: repeats })
      .flatMap(() => featured)
      .slice(0, minCount);
  }

  // If dynamic sections are available, render them; otherwise fallback to static layout
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
                  {getProductsForSection(s).map((product, i) => (
                    <div key={`${s.slug}-${product.id}-${i}`} className="snap-start">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </>
    );
  }

  function getCustomProducts(filters?: HomeSection['filters'], limit = 12) {
    let items = productsData.slice();
    const f = (filters || {}) as any;
    if (Array.isArray(f.tags) && f.tags.length) {
      items = items.filter((p) => p.tags?.some((t: string) => f.tags.includes(t)));
    }
    if (Array.isArray(f.brandSlugs) && f.brandSlugs.length) {
      items = items.filter((p) => f.brandSlugs.includes(p.brandSlug));
    }
    return (items.length ? items : productsData).slice(0, limit);
  }

  function getProductsForSection(s: HomeSection) {
    const lim = s.limit ?? 12;
    switch (s.type) {
      case 'featured': return getFilteredProducts().slice(0, lim);
      case 'sale': return getSaleProducts().slice(0, lim);
      case 'new': return getNewProducts().slice(0, lim);
      case 'bestseller': return getBestSellerProducts().slice(0, lim);
      case 'recommended': return getRecommendedProducts().slice(0, lim);
      case 'custom_query': return getCustomProducts(s.filters, lim);
      default: return productsData.slice(0, lim);
    }
  }

  function prettifyBrand(slug: string) {
    return brandsData.find(b => b.slug === slug)?.name ?? slug.replace(/-/g, ' ').toLowerCase();
  }

  function getSaleProducts() {
    const sale = productsData.filter(p => p.tags?.includes('sale'));
    if (sale.length === 0) return productsData.slice(0, 12);
    const minCount = 12;
    if (sale.length >= minCount) return sale;
    const repeats = Math.ceil(minCount / sale.length);
    return Array.from({ length: repeats })
      .flatMap(() => sale)
      .slice(0, minCount);
  }

  function getNewProducts() {
    const fresh = productsData.filter(p => p.tags?.includes('new'));
    if (fresh.length === 0) return productsData.slice(0, 12);
    const minCount = 12;
    if (fresh.length >= minCount) return fresh;
    const repeats = Math.ceil(minCount / fresh.length);
    return Array.from({ length: repeats })
      .flatMap(() => fresh)
      .slice(0, minCount);
  }

  function getBestSellerProducts() {
    const best = productsData.filter(p => p.tags?.includes('bestseller'));
    if (best.length === 0) return productsData.slice(0, 12);
    const minCount = 12;
    if (best.length >= minCount) return best;
    const repeats = Math.ceil(minCount / best.length);
    return Array.from({ length: repeats })
      .flatMap(() => best)
      .slice(0, minCount);
  }

  function getRecommendedProducts() {
    const rec = productsData.filter(p => p.tags?.includes('recommended'));
    if (rec.length === 0) return productsData.slice(0, 12);
    const minCount = 12;
    if (rec.length >= minCount) return rec;
    const repeats = Math.ceil(minCount / rec.length);
    return Array.from({ length: repeats })
      .flatMap(() => rec)
      .slice(0, minCount);
  }

  function ProductCard({ product }: { product: ProductData }) {
    const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useStore();
    const { showToast } = useToast();
    const [imgLoaded, setImgLoaded] = useState(
      !(product.images && product.images[0] && /^(https?:)?\//.test(product.images[0]))
    );

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
          {/* Brand chip below image, left */}
          <span className="inline-block mb-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {prettifyBrand(product.brandSlug)}
          </span>
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
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product.id, 1);
              showToast(t('toasts.addedToCart'));
            }}
          >
            {/* bag icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>
            {t('products.addToCart')}
          </button>
        </div>
      </LocaleLink>

      {/* Wishlist overlay button (outside Link) */}
      <button
        type="button"
        aria-label="wishlist"
        title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
            showToast('Removed from Wishlist');
          } else {
            addToWishlist(product.id);
            showToast('Added to Wishlist');
          }
        }}
        className={`absolute top-3 left-3 z-20 w-9 h-9 rounded-full border border-gray-200 bg-white shadow-md inline-flex items-center justify-center transition-colors duration-150 ${isInWishlist(product.id) ? 'text-rose-600 hover:bg-rose-50' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.1 20.3s-4.9-3.3-7.2-6.2C2.6 11.6 3.4 8 6.3 7.4c1.4-.3 2.8.3 3.7 1.4.9-1.1 2.3-1.7 3.7-1.4 2.9.6 3.7 4.2 1.4 6.7-2.3 2.9-7 6.2-7 6.2z"/>
        </svg>
      </button>
      </div>
    );
  };

  return (
    <>
      {/* Featured Section */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="9" r="3.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5L8 20l4-2 4 2-1.5-6.5" />
                </svg>
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('sections.featured')}</h2>
            </div>
            <LocaleLink href={`/sections/featured`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
              {t('products.viewAll')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </LocaleLink>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
              {getFilteredProducts().map((product, i) => (
                <div key={`${product.id}-${i}`} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Sale Section */}
      <section className="py-4 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l10-10"/>
                  <circle cx="7" cy="7" r="1.5"/>
                  <circle cx="17" cy="17" r="1.5"/>
                </svg>
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('sections.sale')}</h2>
            </div>
            <LocaleLink href={`/sections/sale`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
              {t('products.viewAll')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </LocaleLink>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
              {getSaleProducts().map((product, i) => (
                <div key={`sale-${product.id}-${i}`} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-4 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.8 3.8L18 8.6l-3.6 1.1L12 14l-2.4-4.3L6 8.6l4.2-1.8L12 3z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 14l.9 1.9L8 17l-1.6.5L5 19l-.9-1.5L2 17l2.1-1.1L5 14zM19 12l.9 1.9L22 15l-1.6.5L19 17l-.9-1.5L16 15l2.1-1.1L19 12z"/>
                </svg>
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('sections.new')}</h2>
            </div>
            <LocaleLink href={`/sections/new`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
              {t('products.viewAll')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </LocaleLink>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
              {getNewProducts().map((product, i) => (
                <div key={`new-${product.id}-${i}`} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-4 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.3 4.7 5.2.8-3.7 3.7.9 5.3L12 14.8 7.3 16.5l.9-5.3L4.5 7.5l5.2-.8L12 2z"/>
                </svg>
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('sections.best')}</h2>
            </div>
            <LocaleLink href={`/sections/bestseller`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
              {t('products.viewAll')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </LocaleLink>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
              {getBestSellerProducts().map((product, i) => (
                <div key={`best-${product.id}-${i}`} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended For You Section */}
      <section className="py-4 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.2l5-.7L12 4z"/>
                </svg>
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('sections.recommended')}</h2>
            </div>
            <LocaleLink href={`/sections/recommended`} className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
              {t('products.viewAll')}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </LocaleLink>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
              {getRecommendedProducts().map((product, i) => (
                <div key={`rec-${product.id}-${i}`} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
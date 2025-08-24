'use client';

import { useState } from 'react';
import LocaleLink from './LocaleLink';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { type Product as ProductData } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { usePathname, useRouter } from 'next/navigation';

type CardProduct = ProductData & { stock?: number };

export default function BrandProductCard({ product }: { product: CardProduct }) {
  const locale = useLocale();
  const t = useTranslations();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore();
  const { showToast, showToastCustom } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [imgLoaded, setImgLoaded] = useState(
    !(product.images && product.images[0] && /^(https?:)?\//.test(product.images[0]))
  );

  // Prefer product.brandSlug (already human-friendly if backend provided), otherwise hide chip
  const brandName = product.brandSlug || '';
  const outOfStock = typeof (product as any).stock === 'number' && (product as any).stock <= 0;

  return (
    <div className="group relative block bg-white rounded-2xl shadow-sm transition-all overflow-hidden border border-gray-200 will-change-transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-100 hover:ring-1 hover:ring-blue-200/60">
      {/* soft glow overlay */}
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
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">{product.images?.[0] ?? '🧸'}</div>
          )}
          {/* Removed bottom gradient to let the image look full-bleed */}
        </div>
      </LocaleLink>

      {/* Wishlist toggle - outside Link to avoid navigation */}
      <button
        type="button"
        aria-label="Toggle wishlist"
        disabled={outOfStock}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (outOfStock) return;
          // Require login before wishlist actions
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
            showToast(t('toasts.removedFromWishlist'));
          } else {
            addToWishlist(product.id);
            showToast(t('toasts.addedToWishlist'));
          }
        }}
        className={`absolute top-3 left-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full shadow-md ${outOfStock ? 'bg-gray-200 cursor-not-allowed opacity-60' : 'bg-white/90 hover:bg-white'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
          stroke="currentColor"
          className={`w-5 h-5 ${isInWishlist(product.id) ? 'text-rose-600' : 'text-gray-700'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Content */}
      <div className="p-4">
        {/* Brand chip below image, left side */}
        {brandName && (
          <span className="inline-block mb-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            {brandName}
          </span>
        )}
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
          disabled={outOfStock}
          onClick={async () => {
            if (outOfStock) return;
            // Require login before cart actions
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
          className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${outOfStock ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>
          {outOfStock ? (locale === 'ar' ? 'غير متوفر' : 'Out of stock') : t('products.addToCart')}
        </button>
      </div>
    </div>
  );
}

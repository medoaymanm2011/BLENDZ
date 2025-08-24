'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Product as ProductData } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useParams, usePathname, useRouter } from 'next/navigation';
import BrandProductCard from '@/components/BrandProductCard';

export default function ProductPage() {
  const locale = useLocale();
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const store = useStore();
  const { showToast, showToastCustom } = useToast();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const pathname = usePathname();

  type DbProduct = {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number | null;
    stock: number;
    brandId?: string | null;
    categoryId?: string | null;
    images?: { url: string }[];
    color?: string | null;
  };
  const [dbProduct, setDbProduct] = useState<DbProduct | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [related, setRelated] = useState<ProductData[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // If slug is numeric (legacy), we will simply try fetching by that slug string; no static fallback redirect.

  // Fetch DB product by slug
  useEffect(() => {
    let active = true;
    setLoadingDb(true);
    fetch(`/api/products/${slug}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setDbProduct(data.product);
        } else {
          setDbProduct(null);
        }
      })
      .catch(() => active && setDbProduct(null))
      .finally(() => active && setLoadingDb(false));
    return () => { active = false; };
  }, [slug]);

  // No static product fallback

  // Map DB product to card data shape (for BrandProductCard)
  function mapDbToCard(db: any): ProductData {
    const hasSale = typeof db?.salePrice === 'number' && db.salePrice >= 0 && db.salePrice < db.price;
    const price = hasSale ? db.salePrice : db.price;
    const originalPrice = hasSale ? db.price : undefined;
    const firstImage = Array.isArray(db?.images) && db.images.length ? db.images[0]?.url : undefined;
    const discount = hasSale && originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
    return {
      id: db?._id || db?.slug || Math.random(),
      slug: db?.slug || String(db?._id || ''),
      name: { ar: db?.name || '', en: db?.name || '' },
      brandSlug: 'brand',
      categorySlugs: [],
      price,
      originalPrice,
      images: firstImage ? [firstImage] : [],
      isNew: false,
      discount: discount && discount > 0 ? discount : undefined,
      tags: Array.isArray(db?.sectionTypes) ? db.sectionTypes : undefined,
      // extra field for card to decide OOS
      stock: typeof db?.stock === 'number' ? db.stock : undefined,
    } as any as ProductData;
  }

  // Fetch dynamic related when DB product is available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dbProduct) { setRelated([]); return; }
      try {
        setLoadingRelated(true);
        const url = new URL('/api/products', window.location.origin);
        if (dbProduct.categoryId) url.searchParams.set('categories[0]', dbProduct.categoryId);
        if (dbProduct.brandId) url.searchParams.set('brands[0]', dbProduct.brandId);
        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        const items = Array.isArray(data?.products) ? data.products : [];
        const mapped = items
          .filter((p: any) => (p._id || p.slug) !== (dbProduct._id || dbProduct.slug))
          .map(mapDbToCard)
          .slice(0, 6);
        setRelated(mapped);
      } catch {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dbProduct]);

  // Notify admin if stock is low or zero (ensure hook order is stable by placing before any conditional returns)
  useEffect(() => {
    if (!dbProduct) return;
    const s = dbProduct.stock ?? 0;
    if (s <= 2) {
      fetch('/api/admin/low-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: dbProduct._id, slug, stock: s }),
        cache: 'no-store',
      }).catch(() => {});
    }
  }, [dbProduct?._id, dbProduct?.stock, slug]);

  // While loading DB and no mock product, show a lightweight loading UI
  if (loadingDb && !dbProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Build a unified view model from DB product
  const isDb = !!dbProduct;
  const view = isDb && !loadingDb && dbProduct
    ? {
        id: dbProduct._id,
        title: dbProduct.name,
        brandLabel: dbProduct.brandId || '',
        price: dbProduct.salePrice != null && dbProduct.salePrice < dbProduct.price ? dbProduct.salePrice : dbProduct.price,
        originalPrice: dbProduct.salePrice != null && dbProduct.salePrice < dbProduct.price ? dbProduct.price : undefined,
        discount: dbProduct.salePrice != null && dbProduct.salePrice < dbProduct.price
          ? Math.round(((dbProduct.price - (dbProduct.salePrice || 0)) / (dbProduct.price || 1)) * 100)
          : undefined,
        images: (dbProduct.images || []).map(im => im.url).filter(Boolean) as string[],
        categorySlug: undefined as string | undefined,
        stock: dbProduct.stock,
        color: dbProduct.color || undefined,
      }
    : null;

  if (!loadingDb && !dbProduct) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">{locale === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</h1>
            <p className="text-gray-600 mb-6">{locale === 'ar' ? 'تعذر العثور على هذا المنتج.' : 'We could not find this product.'}</p>
            <Link href={`/${locale}`} className="text-purple-600 hover:underline">{locale === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // At this point, if we reach here we either have a product view or already handled not-found/loading.
  if (!view) {
    // Safety fallback: if for any reason the view isn't ready, render a friendly not-found UI
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">{locale === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</h1>
            <p className="text-gray-600 mb-6">{locale === 'ar' ? 'تعذر العثور على هذا المنتج.' : 'We could not find this product.'}</p>
            <Link href={`/${locale}`} className="text-purple-600 hover:underline">{locale === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = view.title;
  const brandName = view.brandLabel;
  const isUrl = (s?: string) => !!s && /^(https?:)?\//.test(s);
  const inWishlist = store.isInWishlist(view.id);
  const currency = locale === 'ar' ? 'جنية' : 'EGP';
  const categoryName = view.categorySlug || (locale === 'ar' ? 'عام' : 'All');
  const colorOptions: string[] =
    view.color ? [view.color] : [locale === 'ar' ? 'أحمر' : 'Red'];
  const isOut = (view.stock || 0) <= 0;


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Link href={`/${locale}`} className="hover:text-purple-600">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          {view.categorySlug && (
            <>
              <Link href={`/${locale}/category/${encodeURIComponent(view.categorySlug || 'all')}`} className="hover:text-purple-600">
                {categoryName}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-700">{title}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div>
              <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {/* discount badge */}
                {view.discount ? (
                  <span className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{view.discount}%</span>
                ) : null}
                {isUrl(view.images?.[selected]) ? (
                  <Image
                    src={view.images[selected]}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                  />
                ) : (
                  <span className="text-7xl">{view.images?.[selected] ?? '🧸'}</span>
                )}
              </div>
              {view.images?.length ? (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {view.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelected(idx)}
                      className={`relative aspect-square rounded-md overflow-hidden border ${selected === idx ? 'border-purple-500' : 'border-gray-200'}`}
                    >
                      {isUrl(img) ? (
                        <Image src={img} alt={`${title} ${idx + 1}`} fill sizes="25vw" className="object-contain bg-gray-50" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">{img}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {brandName && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">{brandName}</span>
                )}
                <span className={`ml-auto inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border ${isOut ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-[#2B356D] bg-white border-[#2B356D]/30'}`}>
                  {isOut ? (locale === 'ar' ? 'غير متوفر' : 'Out of stock') : (locale === 'ar' ? `في المخزون - ${view.stock} قطع` : `In Stock - ${view.stock} available`)}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

              <div className="flex items-center gap-3">
                <div className="text-[#2B356D] text-2xl font-extrabold">{view.price} {currency}</div>
                {view.originalPrice && (
                  <div className="text-gray-500 line-through">{view.originalPrice} {currency}</div>
                )}
                {view.discount ? (
                  <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-full">{locale === 'ar' ? `${view.discount}% خصم` : `${view.discount}% OFF`}</span>
                ) : null}
              </div>

              {/* Category line under price */}
              {view.categorySlug && (
                <div className="text-sm text-gray-500">{locale === 'ar' ? 'الفئة:' : 'Category:'} <span className="text-gray-700 font-medium">{categoryName}</span></div>
              )}

              {/* Color selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{locale === 'ar' ? 'اللون' : 'Color'}</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((c, i) => (
                    <button
                      key={c + i}
                      type="button"
                      onClick={() => setColorIdx(i)}
                      className={`px-3 py-1.5 text-sm rounded-md border inline-flex items-center gap-2 ${i === colorIdx ? 'bg-[#2B356D] text-white border-[#2B356D]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {i === colorIdx && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                      )}
                      {c}
                    </button>
                  ))}
                </div>
                <span className={`inline-flex items-center mt-1 text-xs px-2.5 py-1 rounded-full border ${isOut ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-[#2B356D] bg-white border-[#2B356D]/30'}`}>
                  {isOut ? (locale === 'ar' ? 'غير متوفر' : 'Out of stock') : (locale === 'ar' ? `متوفر - ${view.stock} قطع` : `In Stock - ${view.stock} available`)}
                </span>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-[#2B356D] mb-1">{locale === 'ar' ? 'الكمية' : 'Quantity'}</label>
                <div className="inline-flex items-center gap-2">
                  <button disabled={isOut} onClick={() => setQty((q) => Math.max(1, q - 1))} className={`w-8 h-8 rounded-md border ${isOut ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60' : 'border-gray-300 hover:bg-gray-50'} text-[#2B356D]`}>-</button>
                  <div className="min-w-[2.5rem] text-center font-semibold text-[#2B356D]">{qty}</div>
                  <button
                    onClick={() => setQty((q) => Math.min(view.stock, q + 1))}
                    disabled={isOut || qty >= view.stock}
                    className={`w-8 h-8 rounded-md border text-[#2B356D] ${(isOut || qty >= view.stock) ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={isOut}
                  onClick={async () => {
                    if (isOut) return;
                    // Require login before adding to cart
                    try {
                      const res = await fetch('/api/auth/me', { credentials: 'include' });
                      const data = await res.json();
                      if (!res.ok || !data?.user) {
                        showToastCustom({
                          title: locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login required',
                          description: locale === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please log in to continue',
                          variant: 'danger',
                          duration: 1500,
                        });
                        const target = pathname || `/${locale}`;
                        router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
                        return;
                      }
                    } catch {
                      showToastCustom({
                        title: locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login required',
                        description: locale === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please log in to continue',
                        variant: 'danger',
                        duration: 1500,
                      });
                      const target = pathname || `/${locale}`;
                      router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
                      return;
                    }
                    await store.addToCart(view.id, qty);
                    showToast(locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart');
                  }}
                  className={`flex-1 px-6 py-3 rounded-md shadow-sm ${isOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#2b356d] text-white hover:bg-[#222a59]'}`}
                >
                  {isOut ? (locale === 'ar' ? 'غير متوفر' : 'Out of stock') : (locale === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart')}
                </button>
                <button
                  aria-label="Wishlist"
                  disabled={isOut}
                  onClick={async () => {
                    if (isOut) return;
                    // Require login before wishlist operations
                    try {
                      const res = await fetch('/api/auth/me', { credentials: 'include' });
                      const data = await res.json();
                      if (!res.ok || !data?.user) {
                        showToastCustom({
                          title: locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login required',
                          description: locale === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please log in to continue',
                          variant: 'danger',
                          duration: 1500,
                        });
                        const target = pathname || `/${locale}`;
                        router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
                        return;
                      }
                    } catch {
                      showToastCustom({
                        title: locale === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login required',
                        description: locale === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please log in to continue',
                        variant: 'danger',
                        duration: 1500,
                      });
                      const target = pathname || `/${locale}`;
                      router.push(`/${locale}/account?redirect=${encodeURIComponent(target)}`);
                      return;
                    }
                    if (inWishlist) {
                      store.removeFromWishlist(view.id);
                      showToast(locale === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist');
                    } else {
                      store.addToWishlist(view.id);
                      showToast(locale === 'ar' ? 'أُضيف إلى المفضلة' : 'Added to wishlist');
                    }
                  }}
                  className={`w-12 h-12 rounded-md border flex items-center justify-center ${isOut ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' : 'bg-white'} ${inWishlist ? 'border-rose-300 text-rose-600' : (!isOut ? 'border-gray-300 hover:bg-gray-50 text-gray-500' : '')}`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke={inWishlist ? 'currentColor' : 'currentColor'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 mb-1">{locale === 'ar' ? 'الوصف' : 'Description'}</h2>
                <p className="text-gray-700 leading-7">
                  {locale === 'ar'
                    ? 'منتج عالي الجودة بلمسة مميزة. خامات مريحة ومتينة تناسب الاستخدام اليومي. الصور المعروضة لغرض التوضيح وقد تختلف درجات الألوان قليلًا. تجربة شراء ممتعة مع خدمة ما بعد البيع.'
                    : 'High-quality product with a distinctive touch. Comfortable and durable materials suitable for daily use. Images are for illustration and colors may slightly vary. Enjoy a smooth shopping experience with after-sales support.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related products (only render when there are items) */}
        {(isDb && !loadingRelated && related.length > 0) && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-100 text-blue-700">🏷️</span>
              <h3 className="text-xl font-bold text-gray-900">{locale === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((p) => (<BrandProductCard key={`${p.slug}-${p.id}`} product={p} />))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

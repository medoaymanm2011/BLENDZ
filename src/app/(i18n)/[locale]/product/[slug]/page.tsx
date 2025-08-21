'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { products as productsData, type Product as ProductData } from '@/data/products';
import { brands as brandsData } from '@/data/brands';
import { categories as categoriesData } from '@/data/categories';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import BrandProductCard from '@/components/BrandProductCard';

export default function ProductPage() {
  const locale = useLocale();
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const store = useStore();
  const { showToast } = useToast();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  // Legacy numeric id redirect support (e.g., /product/123 -> /product/some-slug)
  useEffect(() => {
    if (typeof slug === 'string' && /^\d+$/.test(slug)) {
      const numericId = Number(slug);
      const match = productsData.find((p) => p.id === numericId);
      const target = match ? `/${locale}/product/${match.slug}` : `/${locale}`;
      router.replace(target);
    }
  }, [slug, router, locale]);

  const product: ProductData | undefined = useMemo(
    () => (typeof slug === 'string' ? productsData.find((p) => p.slug === slug) : undefined),
    [slug]
  );

  if (!product) {
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

  const title = locale === 'ar' ? product.name.ar : product.name.en;
  const brandName = brandsData.find(b => b.slug === product.brandSlug)?.name ?? product.brandSlug;
  const isUrl = (s?: string) => !!s && /^(https?:)?\//.test(s);
  const inWishlist = store.isInWishlist(product.id);
  const currency = locale === 'ar' ? 'جنية' : 'EGP';
  const categoryObj = categoriesData.find(c => c.slug === (product.categorySlugs[0] || ''));
  const categoryName = categoryObj ? (locale === 'ar' ? categoryObj.name.ar : categoryObj.name.en) : (product.categorySlugs[0] || 'All');
  const colorOptions: string[] = (product as any).colors && Array.isArray((product as any).colors) && (product as any).colors.length > 0
    ? (product as any).colors
    : [locale === 'ar' ? 'أحمر' : 'Red'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Link href={`/${locale}`} className="hover:text-purple-600">{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <Link href={`/${locale}/category/${encodeURIComponent(product.categorySlugs[0] || 'all')}`} className="hover:text-purple-600">
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-gray-700">{title}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div>
              <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {/* discount badge */}
                {product.discount ? (
                  <span className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{product.discount}%</span>
                ) : null}
                {isUrl(product.images?.[selected]) ? (
                  <Image
                    src={product.images[selected]}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain"
                  />
                ) : (
                  <span className="text-7xl">{product.images?.[selected] ?? '🧸'}</span>
                )}
              </div>
              {product.images?.length ? (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {product.images.map((img, idx) => (
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
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">{brandName}</span>
                <span className="ml-auto inline-flex items-center gap-2 text-xs text-[#2B356D] bg-white px-2.5 py-1 rounded-full border border-[#2B356D]/30">{locale === 'ar' ? 'في المخزون - 5 قطع' : 'In Stock - 5 available'}</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

              <div className="flex items-center gap-3">
                <div className="text-[#2B356D] text-2xl font-extrabold">{product.price} {currency}</div>
                {product.originalPrice && (
                  <div className="text-gray-500 line-through">{product.originalPrice} {currency}</div>
                )}
                {product.discount ? (
                  <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-full">{locale === 'ar' ? `${product.discount}% خصم` : `${product.discount}% OFF`}</span>
                ) : null}
              </div>

              {/* Category line under price */}
              {product.categorySlugs?.[0] && (
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
                <span className="inline-flex items-center mt-1 text-xs text-[#2B356D] bg-white px-2.5 py-1 rounded-full border border-[#2B356D]/30">{locale === 'ar' ? 'متوفر - 5 قطع' : 'In Stock - 5 available'}</span>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-[#2B356D] mb-1">{locale === 'ar' ? 'الكمية' : 'Quantity'}</label>
                <div className="inline-flex items-center gap-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 text-[#2B356D]">-</button>
                  <div className="min-w-[2.5rem] text-center font-semibold text-[#2B356D]">{qty}</div>
                  <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 text-[#2B356D]">+</button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { store.addToCart(product.id, qty); showToast(locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart'); }}
                  className="flex-1 bg-[#2b356d] text-white px-6 py-3 rounded-md hover:bg-[#222a59] shadow-sm"
                >
                  {locale === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}
                </button>
                <button
                  aria-label="Wishlist"
                  onClick={() => {
                    if (inWishlist) {
                      store.removeFromWishlist(product.id);
                      showToast(locale === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist');
                    } else {
                      store.addToWishlist(product.id);
                      showToast(locale === 'ar' ? 'أُضيف إلى المفضلة' : 'Added to wishlist');
                    }
                  }}
                  className={`w-12 h-12 rounded-md border flex items-center justify-center bg-white ${inWishlist ? 'border-rose-300 text-rose-600' : 'border-gray-300 hover:bg-gray-50 text-gray-500'}`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke={inWishlist ? 'currentColor' : 'currentColor'}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 mb-1">{locale === 'ar' ? 'الوصف' : 'Description'}</h2>
                <p className="text-gray-700 leading-7">
                  {locale === 'ar'
                    ? 'منتج عالي الجودة بلمسة مميزة. خامات مريحة ومتينة تناسب الاستخدام اليومي للأطفال. الصور المعروضة لغرض التوضيح وقد تختلف درجات الألوان قليلًا. تجربة شراء ممتعة مع خدمة ما بعد البيع.'
                    : 'High-quality product with a distinctive touch. Comfortable and durable materials suitable for daily use for kids. Images are for illustration and colors may slightly vary. Enjoy a smooth shopping experience with after-sales support.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-100 text-blue-700">🏷️</span>
            <h3 className="text-xl font-bold text-gray-900">{locale === 'ar' ? 'منتجات ذات صلة' : 'Related Products'}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsData
              .filter(p => p.id !== product.id && (p.categorySlugs.some(c => product.categorySlugs.includes(c)) || p.brandSlug === product.brandSlug))
              .slice(0, 6)
              .map(p => (
                <BrandProductCard key={p.id} product={p} />
              ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

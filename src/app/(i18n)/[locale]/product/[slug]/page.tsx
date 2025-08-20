'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { products as productsData, type Product as ProductData } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { useParams, useRouter } from 'next/navigation';

export default function ProductPage() {
  const locale = useLocale();
  const [selected, setSelected] = useState(0);
  const store = useStore();
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
            <h1 className="text-2xl font-bold mb-2">المنتج غير موجود</h1>
            <p className="text-gray-600 mb-6">تعذر العثور على هذا المنتج.</p>
            <Link href={`/${locale}`} className="text-purple-600 hover:underline">العودة للصفحة الرئيسية</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = locale === 'ar' ? product.name.ar : product.name.en;
  const isUrl = (s?: string) => !!s && /^(https?:)?\//.test(s);
  const inWishlist = store.isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Link href={`/${locale}`} className="hover:text-purple-600">الرئيسية</Link>
          <span>/</span>
          <Link href={`/${locale}/category/${encodeURIComponent(product.categorySlugs[0] || 'all')}`} className="hover:text-purple-600">
            {product.categorySlugs[0] || 'All'}
          </Link>
          <span>/</span>
          <span className="text-gray-700">{title}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
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

            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <div className="text-purple-600 text-xl font-semibold">{product.price} جنية</div>
              {product.originalPrice && (
                <div className="text-gray-500 line-through">{product.originalPrice} جنية</div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => store.addToCart(product.id, 1)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
                >
                  إضافة للسلة
                </button>
                {inWishlist ? (
                  <button
                    onClick={() => store.removeFromWishlist(product.id)}
                    className="border border-gray-300 px-4 py-3 rounded-md hover:bg-gray-50"
                  >
                    إزالة من المفضلة
                  </button>
                ) : (
                  <button
                    onClick={() => store.addToWishlist(product.id)}
                    className="border border-gray-300 px-4 py-3 rounded-md hover:bg-gray-50"
                  >
                    إضافة للمفضلة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

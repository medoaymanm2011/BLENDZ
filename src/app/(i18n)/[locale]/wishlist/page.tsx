'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useMemo } from 'react';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { products as productsData } from '@/data/products';

export default function WishlistPage() {
  const locale = useLocale();
  const store = useStore();
  const isUrl = (s?: string) => !!s && /^(https?:)?\//.test(s);
  const { showToast } = useToast();

  const formatPrice = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const items = useMemo(() => {
    return store.wishlist.map((pid) => productsData.find((p) => p.id === pid)).filter(Boolean).map((p) => {
      const name = locale === 'ar' ? (p as any).name.ar : (p as any).name.en;
      return {
        id: String((p as any).id),
        slug: (p as any).slug,
        name,
        brand: (p as any).brandSlug,
        price: (p as any).price,
        image: (p as any).images?.[0] as string | undefined,
      };
    });
  }, [store.wishlist, locale]);
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
          {items.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const product = productsData.find((p) => (p as any).id === Number(item.id));
              const originalPrice = (product as any)?.originalPrice as number | undefined;
              const hasDiscount = !!originalPrice && originalPrice > item.price;
              const discount = hasDiscount ? Math.round(((originalPrice! - item.price) / originalPrice!) * 100) : 0;
              return (
                <div key={item.id} className="relative rounded-xl border bg-white text-gray-900 shadow p-4 sm:p-8">
                  {/* Image with overlays */}
                  <div className="relative w-full h-56 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {/* Remove button over the image (top-left, with slight left offset) */}
                    <button onClick={() => { store.removeFromWishlist(Number(item.id)); showToast(locale === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from Wishlist'); }} className="absolute top-3 left-4 z-10 inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 text-red-600 hover:bg-red-100 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {/* Discount badge over the image (top-right) */}
                    {hasDiscount && (
                      <span className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-xs font-semibold px-2 py-1 rounded-full">-{discount}%</span>
                    )}
                    {isUrl(item.image) ? (
                      <Image src={item.image as string} alt={item.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-contain" />
                    ) : (
                      <span className="text-5xl">{item.image ?? '🧸'}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">{item.brand}</div>
                    <Link href={`/${locale}/product/${item.slug}`} className="mt-1 block font-medium hover:text-[#2F3E77]">{item.name}</Link>
                    <div className="mt-2">
                      <div className="text-[#2F3E77] font-extrabold">{formatPrice(item.price)} {locale === 'ar' ? 'ج.م' : 'EGP'}</div>
                      {hasDiscount && (
                        <div className="text-sm text-gray-400 line-through">{formatPrice(originalPrice!)} {locale === 'ar' ? 'ج.م' : 'EGP'}</div>
                      )}
                    </div>
                    <button onClick={() => { store.addToCart(Number(item.id), 1); showToast(locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to Cart'); }} className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-[#2F3E77] text-white hover:brightness-95">
                      <ShoppingCart className="w-4 h-4" /> {locale === 'ar' ? 'إضافة للسلة' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
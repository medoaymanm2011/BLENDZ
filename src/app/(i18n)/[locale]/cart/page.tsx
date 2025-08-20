'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { products as productsData } from '@/data/products';

export default function CartPage() {
  const store = useStore();
  const locale = useLocale();

  const isUrl = (s?: string) => !!s && /^(https?:)?\//.test(s);

  const lineItems = useMemo(() => {
    return store.cart.map((ci) => {
      const product = productsData.find((p) => p.id === ci.productId);
      if (!product) return null;
      const name = locale === 'ar' ? product.name.ar : product.name.en;
      const image = product.images?.[0];
      return {
        id: String(product.id),
        slug: product.slug,
        name,
        price: product.price,
        originalPrice: product.originalPrice,
        image,
        quantity: ci.qty,
        brand: product.brandSlug
      };
    }).filter(Boolean) as Array<{
      id: string; slug: string; name: string; price: number; originalPrice?: number; image?: string; quantity: number; brand: string;
    }>;
  }, [store.cart, locale]);

  const updateQuantity = (id: string, change: number) => {
    const pid = Number(id);
    const current = store.cart.find((c) => c.productId === pid)?.qty ?? 0;
    const next = Math.max(1, current + change);
    // Implement as remove when drop to 0 or set by diff
    if (next === current) return;
    if (next < current) {
      // decrease: remove and re-add as desired qty
      store.removeFromCart(pid);
      if (next > 0) store.addToCart(pid, next);
    } else {
      // increase by delta
      store.addToCart(pid, next - current);
    }
  };

  const removeItem = (id: string) => {
    store.removeFromCart(Number(id));
  };

  const nf = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }), [locale]);
  const currency = locale === 'ar' ? 'ج.م' : 'EGP';

  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemsCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  // To match screenshot: shipping calculated at checkout (do not include in total now)
  const shippingText = locale === 'ar' ? 'يتم حسابه عند الدفع' : 'Calculated at checkout';
  const total = subtotal;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H6.4"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 13L5.4 5M7 13l-2 7m12-7l2 7M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">{locale === 'ar' ? 'سلة التسوق' : 'Cart'}</h1>
        </div>

        {lineItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">{locale === 'ar' ? 'سلة التسوق فارغة.' : 'Your cart is empty.'}</p>
            <Link href={`/${locale}`} className="text-blue-700 font-semibold hover:underline">{locale === 'ar' ? 'العودة للتسوق' : 'Continue Shopping'}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {lineItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        {isUrl(item.image) ? (
                          <Image src={item.image as string} alt={item.name} fill sizes="96px" className="object-contain" />
                        ) : (
                          <span className="text-4xl">{item.image ?? '🧸'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <Link href={`/${locale}/product/${item.slug}`} className="block font-semibold text-gray-800 hover:text-blue-800 line-clamp-2">{item.name}</Link>
                        {/* Placeholder attribute line to mimic screenshot */}
                        <div className="text-xs text-gray-500 mt-1">{locale === 'ar' ? 'اللون: أحمر' : 'Color: Red'}</div>
                        <div className="mt-2">
                          <div className="text-[#2F3E77] font-extrabold text-lg">{nf.format(item.price)} {currency}</div>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <div className="text-sm text-gray-500 line-through">{nf.format(item.originalPrice)} {currency}</div>
                          )}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center">
                        <span className="text-sm mr-3 hidden md:inline text-[#2F3E77]">{locale === 'ar' ? 'الكمية' : 'Quantity'}</span>
                        <div className="flex items-center border rounded-lg overflow-hidden border-[#2F3E77]/30">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-[#2F3E77]/5 disabled:opacity-50" disabled={item.quantity<=1}><Minus className="w-4 h-4 text-[#2F3E77]" /></button>
                          <span className="px-4 py-2 min-w-[48px] text-center text-[#2F3E77] font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-[#2F3E77]/5"><Plus className="w-4 h-4 text-[#2F3E77]" /></button>
                        </div>
                      </div>

                      {/* Remove */}
                      <button onClick={() => removeItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label={locale === 'ar' ? 'حذف' : 'Remove'}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between">
                <Link href={`/${locale}`} className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm">{locale === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}</Link>
                <button onClick={store.clearCart} className="text-red-600 hover:underline">{locale === 'ar' ? 'إفراغ السلة' : 'Clear Cart'}</button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit">
              <h2 className="text-lg font-bold mb-4 text-[#2F3E77]">{locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">{locale === 'ar' ? `العناصر (${itemsCount})` : `Items (${itemsCount})`}</span><span className="text-gray-900">{itemsCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="text-[#2F3E77] font-extrabold">{nf.format(subtotal)} {currency}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{locale === 'ar' ? 'الشحن' : 'Shipping'}</span><span className="text-gray-900 font-medium">{shippingText}</span></div>
                <div className="border-t pt-3 flex justify-between font-bold text-[#2F3E77]"><span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span><span>{nf.format(total)} {currency}</span></div>
              </div>
              <Link href={`/${locale}/checkout`} className="block w-full mt-4 bg-[#2F3E77] text-white text-center py-3 rounded-lg font-semibold hover:brightness-110">{locale === 'ar' ? 'المتابعة إلى الدفع' : 'Proceed to Checkout'}</Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
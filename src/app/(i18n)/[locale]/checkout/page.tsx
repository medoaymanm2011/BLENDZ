'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { CreditCard, Truck, Home, Phone, Mail, MapPin, ClipboardList, Tag, CheckCircle2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';

type Address = { fullName: string; phone: string; governorate: string; city: string; addressLine: string };

// Common Egypt city/area combinations for quick selection
const areaOptions: string[] = [
  'Cairo, Maadi',
  'Cairo, Nasr City',
  'Cairo, Heliopolis',
  'Cairo, Downtown',
  'Alexandria, Montazah',
  'Alexandria, Sidi Gaber',
  'Alexandria, Agami',
  'Giza, Dokki',
  'Giza, Mohandessin',
  'Giza, Sheikh Zayed',
  'Aswan, City Center',
  'Aswan, East District',
  'Luxor, City Center',
  'Luxor, East District',
  'Luxor, West District',
  'Sharm El Sheikh, City Center',
  'Sharm El Sheikh, East District',
  'Sharm El Sheikh, West District',
  'Assiut, Asyut',
  'Assiut, Aboteg',
  'Assiut, Albadary',
  'Assiut, Ghnaym',
  'Assiut, Sedfa',
  'Assiut, Sahel Selem',
  'Assiut, Manfalut',
  'Beheira, Beheira',
  'Kafr El Sheikh, Kafrelsheikh',
  'Damietta, Damietta',
  'Port Said, Port Said',
  'Ismailia, Ismailia',
  'Suez, Suez',
  'Faiyum, Faiyum',
  'Beni Suef, Beni Suef',
  'Minya, Minya',
  'Sohag, Sohag',
  'Qena, Qena',
  'North Sinai Governorate, North Sinai',
];

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  // Optional receipt uploaded during checkout when transfer selected
  const [transferReceiptUrl, setTransferReceiptUrl] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [form, setForm] = useState<Address>({ fullName: '', phone: '', governorate: '', city: '', addressLine: '' });
  const store = useStore();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const { showToast } = useToast();
  const INSTAPAY_HANDLE = (process.env.NEXT_PUBLIC_INSTAPAY_HANDLE as string) || '';
  const BANK_ACCOUNT = (process.env.NEXT_PUBLIC_BANK_ACCOUNT as string) || '';
  const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP as string) || '';

  // Use public Instapay image from /public/images.png


  // Lock body scroll when modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = (document.body.style as any).touchAction;
    if (showAddressForm) {
      document.body.style.overflow = 'hidden';
      (document.body.style as any).touchAction = 'none';
    } else {
      document.body.style.overflow = prevOverflow || '';
      (document.body.style as any).touchAction = prevTouchAction || '';
    }
    return () => {
      document.body.style.overflow = prevOverflow || '';
      (document.body.style as any).touchAction = prevTouchAction || '';
    };
  }, [showAddressForm]);

  // Fetch current prices for items in cart from backend only
  type PricedItem = { id: string; qty: number; price: number; name: string; image?: string };
  const [pricedLineItems, setPricedLineItems] = useState<PricedItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ids = store.cart.map((c) => String(c.productId)).filter(Boolean);
    if (ids.length === 0) { setPricedLineItems([]); return; }
    (async () => {
      try {
        setLoadingPrices(true);
        const res = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        const products: any[] = Array.isArray(data?.products) ? data.products : [];
        if (cancelled) return;
        const map = new Map<string, any>();
        for (const p of products) map.set(String(p._id), p);
        const items: PricedItem[] = store.cart.map((ci) => {
          const p = map.get(String(ci.productId));
          const price = p && typeof p.salePrice === 'number' && p.salePrice < p.price ? p.salePrice : p?.price;
          const firstImage = Array.isArray(p?.images) && p.images.length ? (p.images[0]?.url || p.images[0]) : undefined;
          return p && typeof price === 'number'
            ? { id: String(ci.productId), qty: Number(ci.qty || 1), price, name: String(p?.name || ''), image: firstImage }
            : null;
        }).filter(Boolean) as PricedItem[];
        setPricedLineItems(items);
      } catch {
        if (!cancelled) setPricedLineItems([]);
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    })();
    return () => { cancelled = true; };
  }, [store.cart]);

  const itemsCount = pricedLineItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = pricedLineItems.reduce((s, i) => s + i.price * i.qty, 0);

  function calcShipping(addr: Address | null): number | null {
    if (!addr) return null;
    // Flat rate shipping: 55 EGP everywhere
    return 55;
  }
  const shippingVal = calcShipping(selectedAddress != null ? addresses[selectedAddress] : null);
  const discount = coupon.trim().toLowerCase() === 'save10' ? subtotal * 0.1 : 0;
  const total = subtotal + (shippingVal ?? 0) - discount;

  const nf = useMemo(() => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 2 }), [locale]);
  const currency = locale === 'ar' ? 'ج.م' : 'EGP';

  const placeDisabled = useMemo(()=>{
    const needsReceipt = paymentMethod === 'transfer';
    return selectedAddress === null || store.cart.length === 0 || (needsReceipt && !transferReceiptUrl);
  }, [selectedAddress, store.cart.length, paymentMethod, transferReceiptUrl]);

  const handlePlaceOrder = async () => {
    if (placeDisabled) return;
    if (paymentMethod === 'cod' || paymentMethod === 'transfer') {
      // Require receipt for bank transfer to ensure admin can verify
      if (paymentMethod === 'transfer' && !transferReceiptUrl) {
        showToast(locale === 'ar' ? 'من فضلك ارفع إيصال التحويل قبل إتمام الطلب.' : 'Please upload the transfer receipt before placing the order.');
        return;
      }
      const addr = selectedAddress !== null ? addresses[selectedAddress] : null;
      const payload = {
        items: pricedLineItems.map(i => ({ productId: String(i.id), qty: Number(i.qty || 1), name: i.name, image: i.image, price: i.price })),
        shippingInfo: {
          name: addr?.fullName || '',
          phone: addr?.phone || '',
          city: addr?.city || '',
          address: addr?.addressLine || '',
          notes: (notes || '').trim() || undefined,
        },
        totals: { subtotal, shipping: shippingVal ?? 0, total, currency },
        payment: paymentMethod === 'cod'
          ? { method: 'cod' }
          : {
              method: 'bank_transfer',
              channel: INSTAPAY_HANDLE ? 'instapay' : 'bank',
              instapayHandle: INSTAPAY_HANDLE || undefined,
              bankAccount: BANK_ACCOUNT || undefined,
              receiptUrl: transferReceiptUrl || undefined,
            },
      } as any;

      try {
        // Debug: ensure receiptUrl is present when transfer
        if (paymentMethod === 'transfer') {
          console.log('[Checkout] transferReceiptUrl before create:', transferReceiptUrl);
        }
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let msg = 'Failed to place order';
          try { const e = await res.json(); if (e?.error) msg = e.error; } catch {}
          showToast(locale === 'ar' ? 'تعذر إنشاء الطلب. تحقق من تسجيل الدخول وتوفر المنتجات.' : msg);
          return;
        }
        const data = await res.json();
        const saved = data?.order;
        // Fallback: ensure receipt is attached even if it wasn't stored by POST /api/orders
        if (paymentMethod === 'transfer' && transferReceiptUrl && saved?._id) {
          try {
            await fetch(`/api/orders/${String(saved._id)}/receipt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ url: transferReceiptUrl })
            });
          } catch {}
        }
        // clear cart
        store.clearCart();
        router.push(`/${locale}/orders/${String(saved?._id || '')}`);
        if (paymentMethod === 'transfer') {
          const msg = locale === 'ar'
            ? 'تم إنشاء طلبك مع إيصال التحويل. سنقوم بالمراجعة قريبًا.'
            : 'Your order with transfer receipt was created. We will review shortly.';
          showToast(msg);
        }
      } catch {
        showToast(locale === 'ar' ? 'خطأ في الشبكة. حاول مرة أخرى.' : 'Network error. Please try again.');
      }
    }
  };

  const onSubmitAddress = () => {
    if (!form.fullName || !form.phone || !form.governorate || !form.city || !form.addressLine) return;
    const next = [...addresses, form];
    setAddresses(next);
    setSelectedAddress(next.length - 1);
    setForm({ fullName: '', phone: '', governorate: '', city: '', addressLine: '' });
    setShowAddressForm(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-3">
          <Link href={`/${locale}/cart`} className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            {locale === 'ar' ? 'العودة إلى السلة' : 'Back to Cart'}
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#2F3E77] mb-6">{locale === 'ar' ? 'الدفع' : 'Checkout'}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Address + Payment + Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add address button */}
            <div className="flex items-center justify-between">
              <button onClick={() => setShowAddressForm((v) => !v)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm">
                <span className="text-xl leading-none">+</span>
                {locale === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}
              </button>
            </div>

            {/* Shipping address card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#2F3E77] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#2F3E77]" /> {locale === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h2>
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-600">{locale === 'ar' ? 'لا توجد عناوين محفوظة. يرجى إضافة عنوان للمتابعة.' : 'You have no saved addresses. Please add an address to continue.'}</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((a, idx) => (
                    <label key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${selectedAddress===idx ? 'border-[#2F3E77]' : 'border-gray-200'} cursor-pointer`}>
                      <input type="radio" className="mt-1" checked={selectedAddress===idx} onChange={()=>setSelectedAddress(idx)} />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{a.fullName} — {a.phone}</div>
                        <div className="text-gray-600">{a.addressLine}, {a.city}, {a.governorate}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Modal is rendered below */}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#2F3E77] mb-4">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-lg border ${paymentMethod==='cod' ? 'border-[#2F3E77]' : 'border-gray-200'}`}>
                  <input type="radio" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                  <span className="flex items-center gap-2 text-[#2F3E77]">{locale === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
                </label>
                <label className={`flex items-center gap-0 p-0 rounded-lg border ${paymentMethod==='transfer' ? 'border-[#2F3E77]' : 'border-gray-200'}`}>
                  <input type="radio" checked={paymentMethod==='transfer'} onChange={()=>setPaymentMethod('transfer')} />
                  <span className="flex items-center gap-0">
                    <Image src="/images.png" alt="Instapay" width={110} height={35} className="object-contain h-auto" priority />
                    <span className="sr-only">{locale === 'ar' ? 'تحويل بنكي / إنستا باي' : 'Bank Transfer / Instapay'}</span>
                  </span>
                </label>

                {paymentMethod === 'transfer' && (
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-[#2F3E77] space-y-2">
                    <p className="font-medium">{locale === 'ar' ? 'الخطوة الحالية (حل وسط):' : 'Current interim flow:'}</p>
                    <ul className="list-disc ms-5 space-y-1">
                      <li>
                        {locale === 'ar' ? 'من فضلك حوِّل مبلغ الطلب عبر إنستا باي أو التحويل البنكي:' : 'Please transfer the order amount via Instapay or bank transfer:'}
                        <span className="ms-1 font-semibold text-gray-800">01018551242</span>
                      </li>
                      {/* Show small Instapay mark inline */}
                      <li className="flex items-center gap-2">
                        <span className="text-gray-700">{locale === 'ar' ? 'إنستا باي متاح' : 'Instapay available'}</span>
                        <span className="inline-block align-middle"><Image src="/images.png" alt="Instapay" width={140} height={50} className="object-contain h-auto" /></span>
                      </li>
                      {INSTAPAY_HANDLE ? (
                        <li>{locale === 'ar' ? `إنستا باي: ${INSTAPAY_HANDLE}` : `Instapay: ${INSTAPAY_HANDLE}`}</li>
                      ) : null}
                      {BANK_ACCOUNT ? (
                        <li>{locale === 'ar' ? `الحساب البنكي: ${BANK_ACCOUNT}` : `Bank account: ${BANK_ACCOUNT}`}</li>
                      ) : null}
                      <li>{locale === 'ar' ? 'بعد التحويل، من فضلك ارفع صورة الإيصال بالأسفل لتأكيد الطلب.' : 'After transfer, please upload the receipt screenshot below to confirm the order.'}</li>
                    </ul>
                    <p className="text-xs text-gray-600">{locale === 'ar' ? 'لاحقًا سنضيف بوابة دفع أونلاين ليصبح الدفع تلقائيًا.' : 'We will add an online payment gateway later for a fully automated flow.'}</p>
                    {/* Payment Receipt Upload (optional at checkout) */}
                    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-[#2F3E77] flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 114 0v6m-7 4h10a2 2 0 002-2V7a2 2 0 00-2-2h-3l-1-2H9L8 5H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        {locale === 'ar' ? 'إيصال الدفع' : 'Payment Receipt'}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {locale === 'ar' ? 'ارفع صورة إيصال التحويل لتسريع تأكيد الطلب (اختياري الآن).' : 'Upload a transfer receipt photo to speed up processing (optional for now).'}
                      </p>
                      <div className="mt-3">
                        <CloudinaryUploader
                          onUploaded={(url: string) => setTransferReceiptUrl(url)}
                          folder="receipts"
                          buttonText={locale === 'ar' ? 'رفع الإيصال' : 'Upload Receipt'}
                        />
                        {transferReceiptUrl ? (
                          <a href={transferReceiptUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                            <img src={transferReceiptUrl} alt="receipt" className="max-h-40 rounded border" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#2F3E77] mb-2">{locale === 'ar' ? 'ملاحظات الطلب' : 'Order Notes'}</h2>
              <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[#2F3E77] focus:outline-none focus:ring-2 focus:ring-[#2F3E77] rounded-lg placeholder-[#2F3E77]" placeholder={locale === 'ar' ? 'اكتب أي ملاحظات للطلب...' : 'Add any special instructions or notes for your order...'} />
            </div>
          </div>

          {/* Right: Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit lg:sticky lg:top-24">
            <h2 className="text-lg font-bold mb-1 text-[#2F3E77] flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#2F3E77]" /> {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
            <div className="text-sm text-[#2F3E77] mb-4">{locale === 'ar' ? `العناصر في سلتك: ${itemsCount}` : `Items in your cart: ${itemsCount}`}</div>

            <div className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
                <span className="text-[#2F3E77] leading-5 flex-none">{locale === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="text-[#2F3E77] font-extrabold leading-5 sm:flex-1 sm:min-w-0 sm:ltr:text-right sm:rtl:text-left break-words hyphens-auto">{nf.format(subtotal)} {currency}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
                <span className="text-[#2F3E77] flex items-center gap-1 leading-5 flex-none"><Truck className="w-4 h-4" /> {locale === 'ar' ? 'الشحن' : 'Shipping'}</span>
                <span className="text-gray-900 font-medium leading-5 sm:flex-1 sm:min-w-0 sm:ltr:text-right sm:rtl:text-left whitespace-normal break-words hyphens-auto">{shippingVal == null ? (locale === 'ar' ? 'يرجى اختيار عنوان الشحن' : 'Please select a shipping address') : `${nf.format(shippingVal)} ${currency}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
                  <span className="text-[#2F3E77] leading-5 flex-none">{locale === 'ar' ? 'الخصم' : 'Discount'}</span>
                  <span className="text-green-700 leading-5 sm:flex-1 sm:min-w-0 sm:ltr:text-right sm:rtl:text-left break-words hyphens-auto">- {nf.format(discount)} {currency}</span>
                </div>
              )}
              <div className="border-t pt-3 flex flex-col sm:flex-row sm:items-start sm:gap-3 font-bold text-[#2F3E77]">
                <span className="leading-5 flex-none">{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="leading-5 sm:flex-1 sm:min-w-0 sm:ltr:text-right sm:rtl:text-left break-words hyphens-auto">{nf.format(total)} {currency}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <label className="text-sm font-medium text-[#2F3E77]">{locale === 'ar' ? 'كود الخصم' : 'Coupon Code'}</label>
              {/* Unified bordered group: equal height, prevent overflow. Input 65% / Button 35% on mobile */}
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-300 flex items-stretch">
                <input
                  value={coupon}
                  onChange={(e)=>setCoupon(e.target.value)}
                  type="text"
                  placeholder={locale === 'ar' ? 'أدخل الكود' : 'Enter coupon code'}
                  className="flex-1 px-3 h-11 border-0 focus:outline-none focus:ring-0 placeholder-[#2F3E77] text-[#2F3E77] caret-[#2F3E77]"
                />
                <button
                  className="shrink-0 min-w-[92px] h-11 px-3 sm:px-4 bg-green-600 text-white sm:bg-white sm:text-green-700 sm:hover:bg-green-600 sm:hover:text-white transition-colors ltr:border-l rtl:border-r border-gray-300 flex items-center justify-center gap-2 font-semibold whitespace-nowrap"
                  onClick={() => { /* recalculated via state */ }}
                  aria-label={locale === 'ar' ? 'تطبيق الكوبون' : 'Apply coupon'}
                >
                  <Tag className="w-4 h-4" /> {locale === 'ar' ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>

            <button onClick={handlePlaceOrder} disabled={placeDisabled} className={`w-full mt-4 ${placeDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#2F3E77] hover:brightness-110'} text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2`}>
              <CheckCircle2 className="w-5 h-5" /> {locale === 'ar' ? 'إتمام الطلب' : 'Place Order'}
            </button>

            <p className="text-xs text-gray-500 mt-3">{t('checkout.terms')}</p>
          </div>
        </div>
      </div>

      {showAddressForm && (
        <div className="fixed inset-0 z-50 overscroll-contain">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressForm(false)} />
          <div className="relative z-10 flex min-h-screen items-start justify-center p-3 sm:p-4 md:p-8 pt-16 sm:pt-20 md:pt-24 overflow-y-auto">
            <div className="w-full mx-2 sm:mx-0 max-w-md sm:max-w-lg md:max-w-xl bg-white rounded-xl shadow-xl flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-6rem)]">
              <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
                <h3 className="text-base font-semibold text-[#2F3E77]">{locale === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}</h3>
                <p className="text-xs text-gray-500 mt-1">{locale === 'ar' ? 'أدخل تفاصيل العنوان أدناه لإنشاء عنوان شحن جديد.' : 'Enter your address details below to create a new shipping address.'}</p>
              </div>
              <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                  <input value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})} type="text" className="w-full mt-1 h-11 px-3 border border-gray-300 rounded-lg placeholder-[#2F3E77] text-[#2F3E77] caret-[#2F3E77] focus:outline-none focus:ring-2 focus:ring-[#2F3E77]/50" placeholder={locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'} />
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'المنطقة/المحافظة' : 'Area'}</label>
                  <select
                    value={form.governorate && form.city ? `${form.governorate}, ${form.city}` : ''}
                    onChange={(e)=>{
                      const raw = e.target.value;
                      const [gov, area] = raw.split(',').map((s)=>s?.trim() ?? '');
                      setForm({...form, governorate: gov, city: area});
                    }}
                    className="w-full mt-1 h-11 px-3 border border-gray-300 rounded-lg text-[#2F3E77] focus:outline-none focus:ring-2 focus:ring-[#2F3E77]/50"
                  >
                    <option value="">{locale === 'ar' ? 'اختر المنطقة' : 'Select area'}</option>
                    {areaOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <div className="relative mt-1">
                    <Phone className="w-4 h-4 absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} type="tel" className="w-full h-11 ltr:pr-9 rtl:pl-9 px-3 border border-gray-300 rounded-lg placeholder-[#2F3E77] text-[#2F3E77] caret-[#2F3E77] focus:outline-none focus:ring-2 focus:ring-[#2F3E77]/50" placeholder={locale === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#2F3E77]">{locale === 'ar' ? 'تفاصيل العنوان' : 'Address Details'}</label>
                  <textarea value={form.addressLine} onChange={(e)=>setForm({...form, addressLine:e.target.value})} rows={3} className="w-full mt-1 min-h-[88px] px-3 py-2 border border-gray-300 rounded-lg placeholder-[#2F3E77] text-[#2F3E77] caret-[#2F3E77] focus:outline-none focus:ring-2 focus:ring-[#2F3E77]/50" placeholder={locale === 'ar' ? 'مبنى، شارع، علامة مميزة...' : 'Building, street, landmark...'} />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 sticky bottom-0 bg-white z-10">
                <button onClick={() => setShowAddressForm(false)} className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={onSubmitAddress} className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2F3E77] text-white hover:brightness-110">{locale === 'ar' ? 'حفظ العنوان' : 'Save Address'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
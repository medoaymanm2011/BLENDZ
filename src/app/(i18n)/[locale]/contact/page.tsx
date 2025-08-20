'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4">
        {/* Hero gradient section */}
        <div className="relative overflow-hidden rounded-2xl mt-6 mb-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-gray-100">
          <div className="py-16 md:py-20 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-indigo-100">
              <span className="text-indigo-500 text-2xl">🛡️</span>
            </div>
            <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">Contact Us</h1>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
              We are committed to transparency and protecting your rights. Please read our policies carefully.
            </p>
          </div>
          {/* subtle floating dots */}
          <div className="pointer-events-none absolute -left-6 top-10 h-6 w-6 rounded-full bg-purple-200/60 blur" />
          <div className="pointer-events-none absolute -right-5 bottom-8 h-4 w-4 rounded-full bg-indigo-200/60 blur" />
        </div>

        {/* Elevated card container */}
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-purple-100 via-white to-indigo-100 blur-0" />
          <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/60 p-6 md:p-8">
            {/* Section: اتصل بنا */}
            <div className="text-right">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">اتصل بنا</h2>
              <p className="text-gray-700 leading-relaxed">
                نحن نحب أن نسمع منك! لأي استفسارات، ملاحظات أو شكاوى، يمكنك التواصل معنا مباشرة على الرقم:
                <span className="font-extrabold text-gray-900 mx-1">01149070065</span>
                (اتصال أو واتساب).
              </p>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Section: طرق التواصل */}
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">طرق التواصل</h3>
              <div className="space-y-3">
                <a
                  href="https://wa.me/201149070065"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-indigo-50 text-indigo-900 px-4 py-3"
                >
                  <span className="text-indigo-700">الهاتف / واتساب: <span className="font-bold">01149070065</span></span>
                  <span className="text-xl">📞</span>
                </a>
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 text-indigo-900 px-4 py-3">
                  <span className="text-indigo-700">الرد خلال: 24 ساعة على جميع الاستفسارات في أيام العمل</span>
                  <span className="text-xl">📌</span>
                </div>
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Section: خدمة العملاء */}
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">خدمة العملاء</h3>
              <p className="text-gray-700 mb-3">فريق خدمة العملاء جاهز لمساعدتك في:</p>
              <div className="space-y-2">
                <div className="rounded-lg bg-indigo-50 px-4 py-2 text-indigo-900">الطلبات</div>
                <div className="rounded-lg bg-indigo-50 px-4 py-2 text-indigo-900">الاسترجاع والاستبدال</div>
                <div className="rounded-lg bg-indigo-50 px-4 py-2 text-indigo-900">الاستفسارات العامة</div>
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Section: ساعات العمل */}
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ساعات العمل</h3>
              <p className="text-gray-800">
                <span className="font-bold">السبت - الخميس:</span> 11:00 صباحًا - 12:00 منتصف الليل
                <br />
                <span className="font-bold">الجمعة:</span> 2:00 ظهرًا - 12:00 منتصف الليل
              </p>
            </div>

            {/* last updated */}
            <div className="mt-8 flex items-center justify-center">
              <span className="h-1 w-24 rounded-full bg-indigo-200" />
            </div>
            <p className="mt-3 text-center text-xs text-gray-500">
              {`Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

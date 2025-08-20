"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function ReturnsPolicyPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const title = isAr ? "سياسة الإرجاع" : "Return Policy";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#2F3E77]">{title}</h1>
          <Link
            href={`/${locale}/orders`}
            className="text-sm text-[#2F3E77] hover:underline"
          >
            {isAr ? "الطلبات" : "Orders"}
          </Link>
        </div>

        <div className="bg-white border rounded-xl p-6 space-y-5">
          <section>
            <h2 className="text-xl font-semibold text-[#2F3E77]">
              {isAr ? "نافذة الإرجاع" : "Return Window"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isAr
                ? "لديك 30 يومًا من تاريخ التسليم لإرجاع المنتج واسترداد كامل المبلغ."
                : "You have 30 days from the date of delivery to return an item for a full refund."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2F3E77]">
              {isAr ? "حالة العناصر" : "Condition of Items"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isAr
                ? "يجب إرجاع العناصر في حالتها الأصلية، غير مستخدمة، وفي التغليف الأصلي."
                : "Items must be returned in their original condition, unused, and in original packaging."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2F3E77]">
              {isAr ? "عملية الإرجاع" : "Return Process"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isAr
                ? "لبدء عملية الإرجاع، يمكنك تقديم طلب إرجاع من صفحة تفاصيل الطلب أو التواصل مع خدمة العملاء مرفقًا رقم الطلب وسبب الإرجاع."
                : "To initiate a return, you can request a return from the order details page or contact customer service with your order number and reason for return."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2F3E77]">
              {isAr ? "المبالغ المستردة" : "Refunds"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isAr
                ? "ستتم معالجة المبلغ المسترد إلى طريقة الدفع الأصلية خلال 5-7 أيام عمل بعد استلامنا المرتجع."
                : "Refunds will be processed to your original payment method within 5-7 business days after we receive your return."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2F3E77]">
              {isAr ? "الاستبدال" : "Exchanges"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isAr
                ? "لا نقدم حاليًا استبدالًا مباشرًا. يُرجى إرجاع المنتج لاسترداد المبلغ ثم تقديم طلب جديد."
                : "We currently do not offer direct exchanges. Please return the item for a refund and place a new order."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2F3E77]">
              {isAr ? "العناصر غير القابلة للإرجاع" : "Non-Returnable Items"}
            </h2>
            <p className="text-gray-700 mt-2">
              {isAr
                ? "بعض العناصر مثل المنتجات المخصصة والقابلة للتلف والعناصر الشخصية لا يمكن إرجاعها."
                : "Certain items such as personalized products, perishables, and intimate items cannot be returned."}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

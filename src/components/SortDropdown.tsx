"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const OPTIONS = [
  { value: "newest", labelEn: "Newest", labelAr: "الأحدث", icon: "clock" },
  { value: "price_asc", labelEn: "Price: Low to High", labelAr: "السعر: من الأقل للأعلى", icon: "arrow" },
  { value: "price_desc", labelEn: "Price: High to Low", labelAr: "السعر: من الأعلى للأقل", icon: "arrow" },
  { value: "name_asc", labelEn: "Name: A to Z", labelAr: "الاسم: أ -> ي", icon: "az" },
  { value: "name_desc", labelEn: "Name: Z to A", labelAr: "الاسم: ي -> أ", icon: "az" },
] as const;

type SortValue = typeof OPTIONS[number]["value"];

export default function SortDropdown() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const current: SortValue = (searchParams.get("sort") as SortValue) || "newest";
  const currentLabel = useMemo(() => {
    const opt = OPTIONS.find((o) => o.value === current) || OPTIONS[0];
    return locale === "ar" ? opt.labelAr : opt.labelEn;
  }, [current, locale]);

  function setSort(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg border-2 border-blue-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <span className="text-sm text-gray-600">{locale === 'ar' ? 'الترتيب حسب:' : 'Sort by:'}</span>
        <span className="font-medium flex items-center gap-1 text-gray-800">
          {(() => {
            const opt = OPTIONS.find(o => o.value === current);
            if (opt?.icon === 'clock') {
              return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
            }
            if (opt?.icon === 'arrow') {
              return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h7M7 17h4"/></svg>;
            }
            return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10M7 17h10"/></svg>;
          })()}
          {currentLabel}
        </span>
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg py-2 z-50">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSort(opt.value)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 ${current === opt.value ? 'text-blue-700' : 'text-gray-800'}`}
            >
              <span className="flex items-center gap-2">
                {opt.icon === 'clock' && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                )}
                {opt.icon === 'arrow' && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h7M7 17h4"/></svg>
                )}
                {opt.icon === 'az' && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10M7 17h10"/></svg>
                )}
                <span>{locale === 'ar' ? opt.labelAr : opt.labelEn}</span>
              </span>
              {current === opt.value && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

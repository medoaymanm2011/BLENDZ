"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Portal from "./Portal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  // Lock body scroll while overlay is open (better mobile UX)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const placeholder = locale === "ar" ? "اكتب للبحث..." : "Type to search...";

  const goSearch = () => {
    const q = value.trim();
    const url = `/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    router.push(url);
    onClose();
  };

  const isRTL = locale === "ar";

  return (
    <Portal>
      <div className="fixed inset-0" style={{ zIndex: 2147483647 }}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden
        />

        {/* Centered panel */}
        <div className="relative h-full w-full flex items-start justify-center pt-20 sm:pt-24 px-4">
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {locale === "ar" ? "ابحث عن المنتجات" : "Search Products"}
              </h2>
              <button
                onClick={onClose}
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
                className="text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-lg">
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goSearch();
                }}
                placeholder={placeholder}
                className={`w-full h-14 rounded-2xl bg-transparent px-4 ${isRTL ? "pl-14 pr-4" : "pr-14"} text-gray-900 placeholder:text-gray-400 focus:outline-none`}
              />
              <button
                onClick={goSearch}
                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"} inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#2F3E77] text-white hover:brightness-110 shadow`}
                aria-label={locale === "ar" ? "بحث" : "Search"}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

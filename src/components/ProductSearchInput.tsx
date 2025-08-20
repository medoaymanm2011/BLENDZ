"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProductSearchInput() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = searchParams.get("q") || "";
  const [value, setValue] = useState(initial);

  // Build URL with updated q
  const buildUrl = useMemo(() => {
    return (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    };
  }, [pathname, searchParams]);

  // Debounce push
  useEffect(() => {
    const h = setTimeout(() => {
      if (value !== initial) {
        router.push(buildUrl(value));
      }
    }, 400);
    return () => clearTimeout(h);
  }, [value, initial, buildUrl, router]);

  const placeholder = locale === "ar" ? "اكتب البحث..." : "Type to search...";

  return (
    <div className="w-full max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${locale === 'ar' ? 'pr-3 pl-9' : 'pl-3 pr-9'} py-2 rounded-xl border border-blue-500 bg-white placeholder:text-gray-400 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200`}
        />
        <div className={`absolute inset-y-0 ${locale === 'ar' ? 'left-2' : 'right-2'} flex items-center pointer-events-none text-gray-500`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"/></svg>
        </div>
      </div>
    </div>
  );
}

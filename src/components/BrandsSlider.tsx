'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import LocaleLink from './LocaleLink';
import Image from 'next/image';
import { brands as fallbackBrands } from '@/data/brands';

type UiBrand = {
  id: string | number;
  name: string;
  slug: string;
  image?: string;
};

export default function BrandsSlider() {
  const t = useTranslations();
  const locale = useLocale();
  const [items, setItems] = useState<UiBrand[] | null>(null);

  const staticItems = useMemo<UiBrand[]>(
    () => fallbackBrands.map((b) => ({ id: b.id, name: b.name, slug: b.slug, image: b.image })),
    []
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/brands', { signal: ac.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const apiItems: UiBrand[] = (data?.brands ?? []).map((b: any) => ({
          id: b._id ?? b.id,
          name: b.name,
          slug: b.slug,
          image: b.image,
        }));
        setItems(apiItems.length ? apiItems : staticItems);
      } catch {
        setItems(staticItems);
      }
    })();
    return () => ac.abort();
  }, [staticItems]);

  const list = items ?? staticItems;

  return (
    <section className="bg-white py-10">
      <div className="container mx-auto px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
              {/* award/ribbon icon */}
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="9" r="3.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5L8 20l4-2 4 2-1.5-6.5" />
              </svg>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('brands.title')}</h2>
          </div>
          <LocaleLink href="/brands" className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
            {t('products.viewAll')}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </LocaleLink>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {list.map((brand) => (
            <LocaleLink
              key={brand.id}
              href={`/brands#${brand.slug}`}
              className="group relative block h-40 md:h-48 lg:h-52 rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all"
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-400" />

              {/* Logo image */}
              {brand.image ? (
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-6"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="w-full h-full rounded-md flex items-center justify-center bg-blue-700/20">
                    <span className="text-blue-900 font-semibold text-lg">{brand.name}</span>
                  </div>
                </div>
              )}

              {/* Bottom overlay for label */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

              {/* Brand name */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-white text-xs md:text-sm font-extrabold tracking-wide uppercase line-clamp-1">{brand.name}</span>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </section>
  );
}
'use client';

import LocaleLink from './LocaleLink';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { categories as categoriesData } from '@/data/categories';

export default function Categories() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="bg-white py-10">
      <div className="container mx-auto px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
              {/* layered icon */}
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 4.5L12 12 4.5 7.5 12 3z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12L12 16.5 4.5 12"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 16.5L12 21 4.5 16.5"/>
              </svg>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('categories.title')}</h2>
          </div>
          <LocaleLink href="/category" className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1">
            {t('products.viewAll')}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </LocaleLink>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {categoriesData.map((category) => (
            <LocaleLink
              key={category.id}
              href={`/search?categories[0]=${category.id}`}
              className="group relative block h-40 md:h-48 lg:h-56 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Background image */}
              {category.image ? (
                <Image
                  src={category.image}
                  alt={locale === 'ar' ? category.name.ar : category.name.en}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                  priority={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">{category.icon ?? '🧸'}</div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />

              {/* Top title */}
              <div className="absolute top-3 left-4 right-4">
                <h3 className="text-white text-xl md:text-2xl font-semibold drop-shadow text-right">
                  {locale === 'ar' ? category.name.ar : category.name.en}
                </h3>
              </div>

              {/* Bottom caption (smaller) */}
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-white/95 text-xs md:text-sm font-medium line-clamp-1">
                  {locale === 'ar' ? category.name.ar : category.name.en}
                </p>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </section>
  );
}
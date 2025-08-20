'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LocaleLink from '@/components/LocaleLink';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { brands } from '@/data/brands';

export default function BrandsPage() {
  const locale = useLocale();
  const t = useTranslations();

  const Card = ({
    name,
    image,
    slug,
  }: {
    name: string;
    image?: string;
    slug: string;
  }) => (
    <LocaleLink
      href={`/search?brand=${encodeURIComponent(slug)}`}
      className="group relative block rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="relative h-40 md:h-48 lg:h-52 bg-gradient-to-b from-gray-100 to-gray-400">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🏷️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-white font-extrabold tracking-wide uppercase drop-shadow-sm">{name}</div>
        </div>
      </div>
    </LocaleLink>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 4.5L12 12 4.5 7.5 12 3z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12L12 16.5 4.5 12"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 16.5L12 21 4.5 16.5"/>
            </svg>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">{t('brands.title')}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {brands.map((b) => (
            <Card key={b.id} name={b.name} image={b.image} slug={b.slug} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
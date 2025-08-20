import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { categories as categoriesData } from '@/data/categories';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function CategoriesIndexPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale });

  const first = categoriesData[0];
  const second = categoriesData[1];
  const third = categoriesData[2];
  const fourth = categoriesData[3];
  const rest = categoriesData.slice(4);

  const Card = ({ c, className, imgClass }: { c: (typeof categoriesData)[number]; className?: string; imgClass?: string }) => (
    <Link
      href={`/${locale}/search?categories[0]=${c.id}`}
      className={`group relative block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition ${className ?? ''}`}
    >
      {c.image ? (
        <Image
          src={c.image}
          alt={locale === 'ar' ? c.name.ar : c.name.en}
          fill
          sizes="100vw"
          className={`object-cover ${imgClass ?? ''}`}
          priority={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl">{c.icon ?? '🧸'}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />
      <div className="absolute top-3 left-4 right-4">
        <h3 className="text-white text-xl md:text-2xl font-semibold drop-shadow text-right">
          {locale === 'ar' ? c.name.ar : c.name.en}
        </h3>
      </div>
      <div className="absolute bottom-3 left-4 right-4">
        <p className="text-white/95 text-xs md:text-sm font-medium line-clamp-1">
          {locale === 'ar' ? c.name.ar : c.name.en}
        </p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-blue-800 text-white shadow-sm">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 4.5L12 12 4.5 7.5 12 3z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12L12 16.5 4.5 12"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 16.5L12 21 4.5 16.5"/>
              </svg>
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Categories</h1>
          </div>
        </div>

        {/* Top composed row: big left + two stacked right */}
        <div className="grid grid-cols-12 gap-4 md:gap-5 mb-5">
          {first && (
            <Card c={first} className="col-span-12 md:col-span-8 h-56 md:h-64 lg:h-72" />
          )}
          <div className="col-span-12 md:col-span-4 grid grid-rows-2 gap-4 md:gap-5">
            {second && <Card c={second} className="h-28 md:h-32 lg:h-36" />}
            {third && <Card c={third} className="h-28 md:h-32 lg:h-36" />}
          </div>
        </div>

        {/* Wide banner-like card */}
        {fourth && (
          <div className="mb-5">
            <Card c={fourth} className="h-56 md:h-64 lg:h-72" />
          </div>
        )}

        {/* Grid of the rest */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {rest.map((c) => (
            <Card key={c.id} c={c} className="h-44 md:h-52 lg:h-56" />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

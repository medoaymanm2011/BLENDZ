import { products as productsData, type Product as ProductData } from '@/data/products';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandProductCard from '@/components/BrandProductCard';

type SectionKey = 'featured' | 'sale' | 'new' | 'bestseller' | 'recommended';

function filterBySection(section: SectionKey): ProductData[] {
  const tag: SectionKey = section ?? 'featured';
  const items = productsData.filter(p => p.tags?.includes(tag));
  return items.length ? items : productsData;
}

export default async function SectionPage({ params }: { params: Promise<{ locale: string; section: SectionKey }> }) {
  const { section, locale } = await params;
  const t = await getTranslations({ locale });

  const items = filterBySection(section);

  const titleMap: Record<SectionKey, string> = {
    featured: t('products.tabs.featured'),
    sale: t('products.tabs.sale'),
    new: t('products.tabs.new'),
    bestseller: t('products.tabs.bestseller'),
    recommended: t('products.tabs.recommended'),
  };
  const title = section === 'featured'
    ? 'Featured Products'
    : section === 'sale'
    ? 'Product On Sale'
    : titleMap[section];

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
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">{title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map((product) => (
            <BrandProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

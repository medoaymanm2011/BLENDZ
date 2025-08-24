import { type Product as ProductData } from '@/data/products';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandProductCard from '@/components/BrandProductCard';
import { connectToDB } from '@/lib/db';
import { listProducts } from '@/server/controllers/productsController';

type SectionKey = 'featured' | 'sale' | 'new' | 'bestseller' | 'recommended';

function mapDbProductToCardData(db: any): ProductData {
  const hasSale = typeof db?.salePrice === 'number' && db.salePrice >= 0 && db.salePrice < db.price;
  const price = hasSale ? db.salePrice : db.price;
  const originalPrice = hasSale ? db.price : undefined;
  const firstImage = Array.isArray(db?.images) && db.images.length ? db.images[0]?.url : undefined;
  const discount = hasSale && originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
  // Ensure all fields are plain serializable values (no ObjectId instances)
  const idStr = db?._id ? String(db._id) : (db?.slug ? String(db.slug) : String(Math.random()));
  return {
    id: idStr,
    slug: db?.slug ? String(db.slug) : String(db?._id || ''),
    name: { ar: db?.name || '', en: db?.name || '' },
    brandSlug: 'brand',
    categorySlugs: [],
    price,
    originalPrice,
    images: firstImage ? [firstImage] : [],
    isNew: false,
    discount: discount && discount > 0 ? discount : undefined,
    tags: (Array.isArray(db?.sectionTypes) ? db.sectionTypes : undefined) as any,
    // extra: stock for OOS rendering
    stock: typeof db?.stock === 'number' ? db.stock : undefined,
  } as any;
}

export default async function SectionPage({ params }: { params: Promise<{ locale: string; section: SectionKey }> }) {
  const { section, locale } = await params;
  const t = await getTranslations({ locale });

  await connectToDB();
  const result = await listProducts({ sectionTypes: [section] });
  const dbItems = Array.isArray((result as any)?.items) ? (result as any).items : [];
  const items: ProductData[] = dbItems.map(mapDbProductToCardData) as ProductData[];

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

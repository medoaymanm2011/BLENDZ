import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Product as ProductData } from '@/data/products';
import BrandProductCard from '@/components/BrandProductCard';
import BrandFiltersDrawer from '@/components/BrandFiltersDrawer';
import SortDropdown from '@/components/SortDropdown';
import ProductSearchInput from '@/components/ProductSearchInput';

export default async function BrandPage({ params, searchParams }: { params: Promise<{ locale: string; brand: string }>; searchParams: Promise<Record<string, string | string[]>> }) {
  const { locale, brand } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale });

  // Load brands to resolve brandId from slug and to render page title
  let brands: Array<{ _id: string; name: string; slug?: string }> = [];
  try {
    const bRes = await fetch(`/api/brands`, { cache: 'no-store' });
    if (bRes.ok) {
      const bJson = await bRes.json();
      brands = Array.isArray(bJson?.brands) ? bJson.brands : [];
    }
  } catch {}

  const currentBrand = brands.find((b) => (b.slug || '') === brand);
  const title = currentBrand?.name ?? brand.replace(/-/g, ' ');

  // Build query to backend products API based on incoming search params
  const qs = new URLSearchParams();
  for (const [key, valRaw] of Object.entries(sp)) {
    if (Array.isArray(valRaw)) {
      // Only take first per original implementation
      const v = valRaw[0];
      if (v != null) qs.set(key, String(v));
    } else if (valRaw != null) {
      qs.set(key, String(valRaw));
    }
  }
  // If no brands[] provided in URL, constrain to current brand page by backend brandId
  let hasBrandFilter = false;
  for (const k of qs.keys()) { if (k.startsWith('brands[')) { hasBrandFilter = true; break; } }
  if (!hasBrandFilter && currentBrand?._id) { qs.set('brands[0]', currentBrand._id); }

  // Request products from backend honoring filters, search, and sort
  let items: ProductData[] = [];
  try {
    const url = `/api/products?${qs.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const list: any[] = Array.isArray(data?.products) ? data.products : [];
      items = list.map(mapDbProductToCardData);
    }
  } catch {}

  const noResultsText = locale === 'ar' ? 'لا توجد منتجات لهذا البراند' : 'No products found for this brand';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Title - mimic Search Results */}
        <div className="mb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">{title}</h1>
        </div>

        {/* Search */}
        <div className="mb-3 flex justify-end">
          <ProductSearchInput />
        </div>

        {/* Toolbar: Filters + Sort (UI; Filters opens drawer) */}
        <div className="flex items-center justify-between mb-6">
          <BrandFiltersDrawer />
          <SortDropdown />
        </div>

        {items.length === 0 ? (
          <p className="text-gray-600">{noResultsText}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((product) => (
              <BrandProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Map DB product to local ProductData shape used by cards
function mapDbProductToCardData(db: any): ProductData {
  const hasSale = typeof db?.salePrice === 'number' && db.salePrice >= 0 && db.salePrice < db.price;
  const price = hasSale ? db.salePrice : db.price;
  const originalPrice = hasSale ? db.price : undefined;
  const firstImage = Array.isArray(db?.images) && db.images.length ? db.images[0]?.url : undefined;
  const discount = hasSale && originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
  return {
    id: db?._id || db?.slug || Math.random(),
    slug: db?.slug || String(db?._id || ''),
    name: { ar: db?.name || '', en: db?.name || '' },
    brandSlug: db?.brand?.slug || db?.brandSlug || 'brand',
    categorySlugs: [],
    price,
    originalPrice,
    images: firstImage ? [firstImage] : [],
    isNew: false,
    discount: discount && discount > 0 ? discount : undefined,
    tags: (Array.isArray(db?.sectionTypes) ? db.sectionTypes : undefined) as any,
    // allow card to infer out-of-stock
    stock: typeof db?.stock === 'number' ? db.stock : undefined,
  } as any;
}


import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { brands as brandsData } from '@/data/brands';
import { products as productsData, type Product as ProductData } from '@/data/products';
import BrandProductCard from '@/components/BrandProductCard';
import BrandFiltersDrawer from '@/components/BrandFiltersDrawer';
import SortDropdown from '@/components/SortDropdown';
import ProductSearchInput from '@/components/ProductSearchInput';

export default async function BrandPage({ params, searchParams }: { params: Promise<{ locale: string; brand: string }>; searchParams: Promise<Record<string, string | string[]>> }) {
  const { locale, brand } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale });

  const brandInfo = brandsData.find((b) => b.slug === brand);
  const title = brandInfo?.name ?? brand.replace(/-/g, ' ');

  // Build maps for id<->slug
  const brandSlugById = Object.fromEntries(brandsData.map((b) => [String(b.id), b.slug]));
  const categorySlugById = Object.fromEntries((await import('@/data/categories')).categories.map((c) => [String(c.id), c.slug]));

  // Parse brands[] and categories[] from query like brands[0]=1
  const selectedBrandSlugs: string[] = [];
  const selectedCategorySlugs: string[] = [];
  for (const key in sp) {
    const val = Array.isArray(sp[key]) ? (sp[key] as string[])[0] : (sp[key] as string);
    if (key.startsWith('brands[') && val) {
      const slug = brandSlugById[val];
      if (slug) selectedBrandSlugs.push(slug);
    }
    if (key.startsWith('categories[') && val) {
      const cslug = categorySlugById[val];
      if (cslug) selectedCategorySlugs.push(cslug);
    }
  }

  const minPrice = Number((sp.minPrice as string) ?? '');
  const maxPrice = Number((sp.maxPrice as string) ?? '');

  // Base set: if brands[] present use all products, else stick to current brand page
  let base: ProductData[] = selectedBrandSlugs.length > 0 ? productsData : productsData.filter((p) => p.brandSlug === brand);

  // Apply filters
  if (selectedBrandSlugs.length > 0) {
    base = base.filter((p) => selectedBrandSlugs.includes(p.brandSlug));
  }
  if (selectedCategorySlugs.length > 0) {
    base = base.filter((p) => p.categorySlugs.some((s) => selectedCategorySlugs.includes(s)));
  }
  if (!Number.isNaN(minPrice) && minPrice > 0) {
    base = base.filter((p) => p.price >= minPrice);
  }
  if (!Number.isNaN(maxPrice) && maxPrice > 0) {
    base = base.filter((p) => p.price <= maxPrice);
  }

  // Search (q)
  const q = (sp.q as string) || '';
  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    base = base.filter((p) => {
      const en = (p.name.en || '').toLowerCase();
      const ar = (p.name.ar || '').toLowerCase();
      return en.includes(needle) || ar.includes(needle);
    });
  }

  // Sort
  const sort = (sp.sort as string) || 'newest';
  let items: ProductData[] = [...base];
  if (sort === 'price_asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') items.sort((a, b) => b.price - a.price);
  else if (sort === 'name_asc') items.sort((a, b) => (a.name.en || '').localeCompare(b.name.en || ''));
  else if (sort === 'name_desc') items.sort((a, b) => (b.name.en || '').localeCompare(a.name.en || ''));

  const noResultsText = locale === 'ar' ? 'لا توجد منتجات لهذا البراند' : 'No products found for this brand';

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Title - mimic Search Results */}
        <div className="mb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
            {locale === 'ar' ? 'نتائج البحث' : 'Search Results'}
          </h1>
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

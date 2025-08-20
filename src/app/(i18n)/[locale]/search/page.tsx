'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import BrandProductCard from '@/components/BrandProductCard';
import BrandFiltersDrawer from '@/components/BrandFiltersDrawer';
import SortDropdown from '@/components/SortDropdown';
import ProductSearchInput from '@/components/ProductSearchInput';
import { products as productsData, type Product as ProductData } from '@/data/products';
import { brands as brandsData } from '@/data/brands';
import { categories as categoriesData } from '@/data/categories';

// No local mock data. Use shared products data so images/info match homepage.

export default function SearchPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Build maps for id<->slug similar to brand page
  const brandSlugById = useMemo(() => Object.fromEntries(brandsData.map((b) => [String(b.id), b.slug])), []);
  const categorySlugById = useMemo(() => Object.fromEntries(categoriesData.map((c) => [String(c.id), c.slug])), []);

  // Parse filters from URL
  const selectedBrandSlugs: string[] = [];
  const selectedCategorySlugs: string[] = [];
  for (const [key, val] of (searchParams as any).entries()) {
    const v = Array.isArray(val) ? val[0] : (val as string);
    if (key.startsWith('brands[') && v) {
      const slug = brandSlugById[v];
      if (slug) selectedBrandSlugs.push(slug);
    }
    if (key.startsWith('categories[') && v) {
      const cslug = categorySlugById[v];
      if (cslug) selectedCategorySlugs.push(cslug);
    }
  }

  const minPrice = Number(searchParams.get('minPrice') || '');
  const maxPrice = Number(searchParams.get('maxPrice') || '');
  const q = (searchParams.get('q') as string) || '';
  const sort = (searchParams.get('sort') as string) || 'newest';

  // Base set: when brands[] present, use all products; otherwise still use all (search context)
  let base: ProductData[] = productsData;

  // Apply filters like brand page
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

  // Search by q across ar/en names
  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    base = base.filter((p) => (p.name.en || '').toLowerCase().includes(needle) || (p.name.ar || '').toLowerCase().includes(needle));
  }

  // Sort
  let items: ProductData[] = [...base];
  if (sort === 'price_asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') items.sort((a, b) => b.price - a.price);
  else if (sort === 'name_asc') items.sort((a, b) => (a.name.en || '').localeCompare(b.name.en || ''));
  else if (sort === 'name_desc') items.sort((a, b) => (b.name.en || '').localeCompare(a.name.en || ''));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Title & search input like brand page */}
        <div className="mb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">{locale === 'ar' ? 'نتائج البحث' : 'Search Results'}</h1>
        </div>
        <div className="mb-3 flex justify-end">
          <ProductSearchInput />
        </div>

        {/* Toolbar: Filters + Sort */}
        <div className="flex items-center justify-between mb-6">
          <BrandFiltersDrawer />
          <SortDropdown />
        </div>

        {/* Grid results using BrandProductCard */}
        {items.length === 0 ? (
          <p className="text-gray-600">{locale === 'ar' ? 'لا توجد نتائج بحث' : 'No results found'}</p>
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
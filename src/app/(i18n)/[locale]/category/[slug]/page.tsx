'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();

  type ApiBrand = { _id: string; name: string; slug?: string };
  type ApiCategory = { _id: string; name: string; slug: string; nameAr?: string; nameEn?: string; nameObj?: { ar?: string; en?: string } };
  type ApiProduct = {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number | null;
    images?: { url: string }[];
    brandId?: string | null;
    categoryId?: string | null;
  };

  type CardProduct = {
    id: string;
    slug: string;
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    images: string[];
    brandName?: string;
  };

  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const categorySlug = decodeURIComponent(typeof slug === 'string' ? slug : 'all');
  const currentCategory = useMemo(() => categories.find(c => c.slug === categorySlug), [categories, categorySlug]);
  const categoryName = currentCategory
    ? (() => {
        const ar = (currentCategory as any)?.nameObj?.ar || (currentCategory as any)?.nameAr;
        const en = (currentCategory as any)?.nameObj?.en || (currentCategory as any)?.nameEn;
        const fallback = (currentCategory as any)?.name;
        return locale === 'ar' ? (ar || fallback || currentCategory.slug) : (en || fallback || currentCategory.slug);
      })()
    : (categorySlug === 'all' ? (locale === 'ar' ? 'جميع المنتجات' : 'All Products') : categorySlug);

  // Load brands and categories
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingMeta(true);
        setMetaError(null);
        const [bRes, cRes] = await Promise.all([
          fetch('/api/brands', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);
        if (!active) return;
        if (!bRes.ok || !cRes.ok) throw new Error('Failed to load metadata');
        const bJson = await bRes.json();
        const cJson = await cRes.json();
        setBrands(Array.isArray(bJson?.brands) ? bJson.brands : []);
        setCategories(Array.isArray(cJson?.categories) ? cJson.categories : []);
      } catch (e: any) {
        if (active) setMetaError(e?.message || 'Error loading metadata');
      } finally {
        if (active) setLoadingMeta(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        const url = new URL('/api/products', window.location.origin);
        // Category filter
        if (currentCategory?._id) {
          url.searchParams.set('categories[0]', currentCategory._id);
        }
        // Brand filters (ids)
        selectedBrandIds.forEach((id, idx) => url.searchParams.set(`brands[${idx}]`, id));
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!active) return;
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        const items: ApiProduct[] = Array.isArray(data?.products) ? data.products : [];
        const mapped: CardProduct[] = items.map((p) => {
          const hasSale = typeof p.salePrice === 'number' && (p.salePrice ?? 0) >= 0 && (p.salePrice as number) < p.price;
          const price = hasSale ? (p.salePrice as number) : p.price;
          const originalPrice = hasSale ? p.price : undefined;
          const discount = hasSale && originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined;
          const brandName = brands.find(b => b._id === p.brandId)?.name;
          return {
            id: p._id,
            slug: p.slug,
            title: p.name,
            price,
            originalPrice,
            discount: discount && discount > 0 ? discount : undefined,
            images: (p.images || []).map(im => im.url).filter(Boolean) as string[],
            brandName,
          };
        });
        setProducts(mapped);
      } catch (e: any) {
        if (active) setProductsError(e?.message || 'Error loading products');
      } finally {
        if (active) setLoadingProducts(false);
      }
    })();
    return () => { active = false; };
  }, [categorySlug, currentCategory?._id, JSON.stringify(selectedBrandIds)]);

  // Apply price filter and sorting client-side
  const filteredProducts = useMemo(() => {
    const withinPrice = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    const copy = [...withinPrice];
    switch (sortBy) {
      case 'price-low':
        copy.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        copy.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // No createdAt in card model; keep default or could sort by id as fallback
        break;
      default:
        break;
    }
    return copy;
  }, [products, sortBy, priceRange]);

  const toggleBrand = (brandId: string) => {
    setSelectedBrandIds(prev => prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]);
  };

  const ProductCard = ({ product }: { product: CardProduct }) => (
    <Link href={`/${locale}/product/${product.slug}`} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          {product.images?.[0] ? (
            <div className="relative w-full h-48">
              <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain" />
            </div>
          ) : (
            <div className="text-6xl">🧸</div>
          )}
        </div>
        {product.discount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{product.discount}%
          </div>
        )}
        <button className="absolute top-2 left-2 bg-white/80 hover:bg-white rounded-full p-2">
          <svg className="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-xs text-purple-600 mb-1">{product.brandName || ''}</div>
        <h3 className="font-semibold text-gray-800 mb-2 text-right line-clamp-2">{product.title}</h3>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-purple-600">{product.price} جنية</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">{product.originalPrice} جنية</span>
            )}
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
            أضف للسلة
          </button>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <Link href={`/${locale}`} className="hover:text-purple-600">الرئيسية</Link>
          <span className="mx-2">←</span>
          <span>{categorySlug === 'all' ? (locale === 'ar' ? 'جميع المنتجات' : 'All Products') : categoryName}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            {categorySlug === 'all' ? (locale === 'ar' ? 'جميع المنتجات' : 'All Products') : categoryName}
          </h1>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-gray-600">{loadingProducts ? (locale === 'ar' ? 'جار التحميل...' : 'Loading...') : `عرض ${filteredProducts.length} منتج`}</span>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="default">ترتيب افتراضي</option>
              <option value="price-low">السعر: من الأقل للأعلى</option>
              <option value="price-high">السعر: من الأعلى للأقل</option>
              <option value="newest">الأحدث</option>
            </select>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden bg-purple-600 text-white px-4 py-2 rounded-md"
            >
              فلترة
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`w-full md:w-1/4 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">فلترة النتائج</h3>
              
              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">نطاق السعر</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0 جنية</span>
                    <span>{priceRange[1]} جنية</span>
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">العلامات التجارية</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {loadingMeta && <div className="text-sm text-gray-500">{locale === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>}
                  {!loadingMeta && brands.length === 0 && <div className="text-sm text-gray-400">{locale === 'ar' ? 'لا توجد علامات' : 'No brands'}</div>}
                  {!loadingMeta && brands.map(brand => (
                    <label key={brand._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBrandIds.includes(brand._id)}
                        onChange={() => toggleBrand(brand._id)}
                        className="ml-2"
                      />
                      <span className="text-sm">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <button 
                onClick={() => {
                  setSelectedBrandIds([]);
                  setPriceRange([0, 10000]);
                  setSortBy('default');
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
              >
                مسح الفلاتر
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full md:w-3/4">
            {loadingProducts ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-gray-600">{locale === 'ar' ? 'جار تحميل المنتجات...' : 'Loading products...'}</div>
            ) : productsError ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-red-600">{productsError}</div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />)
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500">لم نعثر على منتجات تطابق معايير البحث المحددة</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
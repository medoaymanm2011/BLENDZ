'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { products as productsData, type Product as ProductData } from '@/data/products';
import { categories as categoriesData } from '@/data/categories';
import { brands as brandsData } from '@/data/brands';
import { useParams } from 'next/navigation';

export default function CategoryPage() {
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const locale = useLocale();
  const { slug } = useParams<{ slug: string }>();

  const categorySlug = decodeURIComponent(typeof slug === 'string' ? slug : 'all');
  const currentCategory = categoriesData.find(c => c.slug === categorySlug);
  const categoryName = currentCategory ? (locale === 'ar' ? currentCategory.name.ar : currentCategory.name.en) : (categorySlug === 'all' ? (locale === 'ar' ? 'جميع المنتجات' : 'All Products') : categorySlug);

  const filteredProducts = useMemo(() => {
    let filtered = productsData.filter(product => {
      const inCategory = categorySlug === 'all' || product.categorySlugs.includes(categorySlug);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const brandName = brandsData.find(b => b.slug === product.brandSlug)?.name || product.brandSlug;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(brandName);
      return inCategory && matchesPrice && matchesBrand;
    });

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [categoryName, sortBy, priceRange, selectedBrands]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const ProductCard = ({ product }: { product: ProductData }) => (
    <Link href={`/${locale}/product/${product.slug}`} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          {product.images?.[0] ? (
            <div className="relative w-full h-48">
              <Image src={product.images[0]} alt={locale === 'ar' ? product.name.ar : product.name.en} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain" />
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
        {product.isNew && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            جديد
          </div>
        )}
        <button className="absolute top-2 left-2 bg-white/80 hover:bg-white rounded-full p-2">
          <svg className="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-xs text-purple-600 mb-1">{brandsData.find(b => b.slug === product.brandSlug)?.name || product.brandSlug}</div>
        <h3 className="font-semibold text-gray-800 mb-2 text-right line-clamp-2">{locale === 'ar' ? product.name.ar : product.name.en}</h3>
        
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
            <span className="text-gray-600">عرض {filteredProducts.length} منتج</span>
            
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
                  {brandsData.map(brand => (
                    <label key={brand.slug} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.name)}
                        onChange={() => toggleBrand(brand.name)}
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
                  setSelectedBrands([]);
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
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
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
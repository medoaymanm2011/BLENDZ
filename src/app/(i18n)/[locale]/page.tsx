import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import BrandsSlider from '@/components/BrandsSlider';
import Categories from '@/components/Categories';
import ProductSections from '@/components/ProductSections';

export default function LocaleHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="container mx-auto px-4">
          <HeroBanner />
          <div className="mt-10">
            <BrandsSlider />
          </div>
          <div className="mt-10">
            <Categories />
          </div>
        </div>
        <div id="home-products" className="mt-10 scroll-mt-24">
          <ProductSections />
        </div>
      </main>
      <Footer />
    </div>
  );
}

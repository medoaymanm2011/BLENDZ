import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import BrandsSlider from '@/components/BrandsSlider';
import Categories from '@/components/Categories';
import ProductSections from '@/components/ProductSections';
import AdminRedirectGuard from '@/components/AdminRedirectGuard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, type JwtPayload } from '@/lib/jwt';

export default async function LocaleHomePage({ params }: { params: { locale: string } }) {
  // Server-side redirect: if admin, go to dashboard immediately (no flicker)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const payload = verifyToken<JwtPayload>(token);
      if (payload && payload.role === 'admin') {
        redirect(`/${params.locale}/admin`);
      }
    }
  } catch {}
  return (
    <div className="min-h-screen bg-white">
      <AdminRedirectGuard />
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

'use client';

import { useState, useEffect, useRef } from 'react';
import SearchOverlay from '@/components/SearchOverlay';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { brands as brandsData } from '@/data/brands';
import { categories as categoriesData } from '@/data/categories';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const { showToast, showToastCustom } = useToast();

  const prefetch = (path: string) => {
    try { router.prefetch(path); } catch {}
  };

  // Use live categories data for dropdown to match site exactly
  const dropdownCategories = categoriesData;
  const categoryOrder = [
    'tghthy-ordaaah',
    'aadadat-skatat-hlmat',
    'shfatat-althd',
    'alaanay-baltfl',
    'adoat-alakl-oalshrb',
    'baby-stroller',
    'baby-Cosmetics',
    'booty training',
    'Baby Toys ',
    'شنط وشيالات',
  ];
  const orderedCategories = [...dropdownCategories].sort((a, b) => {
    const ia = categoryOrder.indexOf(a.slug);
    const ib = categoryOrder.indexOf(b.slug);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  useEffect(() => {
    // Load user from localStorage
    try {
      const stored = localStorage.getItem('vk_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem('vk_user');
        setUser(stored ? JSON.parse(stored) : null);
      } catch {}
    };
    window.addEventListener('storage', syncUser);
    window.addEventListener('vk_user_updated', syncUser as EventListener);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('vk_user_updated', syncUser as EventListener);
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isUserMenuOpen) return;
      const el = userMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isUserMenuOpen]);

  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const cartCount = store.cart.reduce((sum, item) => sum + item.qty, 0);
  const goToLogin = (opts?: { title?: string; description?: string }) => {
    if (opts?.title || opts?.description) {
      showToastCustom({
        title: opts.title,
        description: opts.description,
        variant: 'danger',
        duration: 1500,
      });
    }
    router.push(`/${locale}/account`);
  };
  const switchHref = (() => {
    try {
      const parts = (pathname || '/').split('/');
      if (parts.length > 1 && (parts[1] === 'ar' || parts[1] === 'en')) {
        parts[1] = otherLocale;
        return parts.join('/') || `/${otherLocale}`;
      }
      return `/${otherLocale}`;
    } catch {
      return `/${otherLocale}`;
    }
  })();

  return (
    <header className="w-full sticky top-0 z-50 backdrop-blur bg-white/70 supports-[backdrop-filter]:bg-white/60 border-b">
      {/* Main Header */}
      <div className="bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href={`/${locale}`} className="flex items-center" aria-label="Home">
                <Image
                  src="/blendz-logo.svg"
                  alt="BLENDZ"
                  width={160}
                  height={40}
                  priority
                />
                <span className="sr-only">{t('brand.name')}</span>
              </Link>
            </div>

            {/* Desktop Nav (center) */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                prefetch
                href={`/${locale}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white text-gray-700 hover:text-blue-700 shadow-sm"
                onMouseEnter={() => prefetch(`/${locale}`)}
              >
                {t('nav.home')}
              </Link>
              {/* Brands hover dropdown */}
              <div className="relative group">
                <Link
                  prefetch
                  href={`/${locale}/brands`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white text-gray-700 hover:text-blue-700 shadow-sm"
                  onMouseEnter={() => prefetch(`/${locale}/brands`)}
                >
                  <span>{t('nav.brands')}</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </Link>
                <div className="absolute left-0 mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-3 min-w-[460px]">
                    {brandsData.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/${locale}/brands/${encodeURIComponent(b.slug)}`}
                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-gray-50"
                      >
                        <span className="inline-flex w-9 h-9 items-center justify-center rounded-full ring-1 ring-gray-200 bg-white overflow-hidden">
                          {b.image ? (
                            <Image src={b.image} alt={b.name} width={28} height={28} sizes="28px" loading="lazy" className="object-contain" />
                          ) : (
                            <span className="w-6 h-6 bg-gray-200 rounded" />
                          )}
                        </span>
                        <span className="text-gray-700 capitalize">{b.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories hover dropdown trigger (also toggles on mobile) */}
              <div className="relative group">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white text-gray-700 hover:text-blue-700 shadow-sm"
                >
                  <span>{t('nav.shopByCategory')}</span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {/* Desktop hover panel */}
                <div className="absolute left-0 mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                  <div className="grid grid-cols-2 gap-x-16 gap-y-3 min-w-[520px]">
                    {orderedCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${locale}/search?categories[0]=${cat.id}`}
                        className="text-gray-700 hover:text-blue-700 py-1"
                      >
                        {locale === 'ar' ? cat.name.ar : cat.name.en}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                prefetch
                href={`/${locale}/sections/bestseller`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white text-gray-700 hover:text-blue-700 shadow-sm"
                onMouseEnter={() => prefetch(`/${locale}/sections/bestseller`)}
              >
                {t('nav.bestSellers')}
              </Link>
              <Link
                prefetch
                href={`/${locale}/contact`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 hover:bg-white text-gray-700 hover:text-blue-700 shadow-sm"
                onMouseEnter={() => prefetch(`/${locale}/contact`)}
              >
                {t('nav.contact')}
              </Link>
            </div>

            {/* Spacer to keep layout balanced */}
            <div className="flex-1" />

            {/* Action Icons + Language */}
            <div className="flex items-center gap-3">
              {/* Search icon */}
              <button onClick={() => setIsSearchOpen(true)} className="text-gray-700 hover:text-blue-700 inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-transparent hover:bg-gray-100 shadow-sm" aria-label="Open Search">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <Link prefetch href={`/${locale}/wishlist`} onMouseEnter={() => prefetch(`/${locale}/wishlist`)}
                onClick={(e) => { if (!user) { e.preventDefault(); goToLogin({ title: 'Login Required', description: 'Please login to view your wishlist' }); } }}
                className="text-gray-700 hover:text-blue-700 inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-transparent hover:bg-gray-100 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              <div
                ref={userMenuRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => { if (!user) { goToLogin({ title: 'Login Required', description: 'Please login to access your account' }); return; } setIsUserMenuOpen((v) => !v); }}
                  className="text-gray-700 hover:text-blue-700 relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-transparent hover:bg-gray-100 shadow-sm"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  {user ? (
                    <span
                      aria-label="Account"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200"
                    >
                      {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>
                {user && isUserMenuOpen && (
                  <div
                    role="menu"
                    className={`absolute ${locale === 'ar' ? 'left-0' : 'right-0'} mt-2 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-2 z-[60]`}
                  >
                    <Link href={`/${locale}/account`} className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                      Profile
                    </Link>
                    <Link href={`/${locale}/orders`} className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100" onClick={() => setIsUserMenuOpen(false)}>
                      My Orders
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        try {
                          localStorage.removeItem('vk_user');
                          window.dispatchEvent(new Event('vk_user_updated'));
                        } catch {}
                        setIsUserMenuOpen(false);
                        router.push(`/${locale}`);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <Link prefetch href={`/${locale}/cart`} onMouseEnter={() => prefetch(`/${locale}/cart`)}
                onClick={(e) => { if (!user) { e.preventDefault(); goToLogin({ title: 'Login Required', description: 'Please login to add items to cart' }); } }}
                className="text-gray-700 hover:text-blue-700 relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-transparent hover:bg-gray-100 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8V7a3 3 0 0 1 6 0v1" />
                </svg>
                {cartCount > 0 && (
                  <span className={`absolute -top-1 ${locale === 'ar' ? '-left-1' : '-right-1'} min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[11px] leading-[18px] text-center shadow`}
                    aria-label={`Cart items: ${cartCount}`}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {user?.role === 'admin' && (
                <Link href={`/${locale}/admin`} className="flex flex-col items-center text-gray-600 hover:text-blue-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="sr-only">{t('header.admin')}</span>
                </Link>
              )}

              {/* Language Switcher */}
              <Link href={switchHref} className="text-sm font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 opacity-80 hover:opacity-100 hover:bg-gray-50 hover:border-blue-600 hover:text-blue-700 flex items-center gap-1 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 0c2.5 2.5 2.5 15.5 0 18m0-18c-2.5 2.5-2.5 15.5 0 18M3 12h18"/></svg>
                {otherLocale === 'ar' ? 'AR' : 'EN'}
              </Link>
            </div>
          </div>

          {/* Mobile nav toggle row */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-t border-gray-200">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-700 py-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>{t('nav.shopByCategory')}</span>
            </button>
            <div className="flex items-center gap-6">
              <Link href={`/${locale}/sections/bestseller`} className="text-gray-700 hover:text-blue-700">{t('nav.bestSellers')}</Link>
              <Link href={`/${locale}/search?categories[0]=${dropdownCategories[0]?.id ?? 1}`} className="text-gray-700 hover:text-blue-700">{t('nav.offers')}</Link>
              <Link href={`/${locale}/search?categories[0]=${dropdownCategories[1]?.id ?? 2}`} className="text-gray-700 hover:text-blue-700">{t('nav.new')}</Link>
            </div>
          </div>

        </div>
      </div>

      {/* Categories Dropdown (mobile or when toggled) */}
      {isMenuOpen && (
        <div className="bg-white shadow-lg border-t">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {dropdownCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/search?categories[0]=${cat.id}`}
                  className="text-gray-700 hover:text-blue-700 py-2"
                >
                  {locale === 'ar' ? cat.name.ar : cat.name.en}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Search Overlay */}
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
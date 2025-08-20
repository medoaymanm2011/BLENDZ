'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const locale = useLocale();

  return (
    <footer className="bg-gray-50 text-gray-700 mt-12 border-t border-gray-200">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                VILAIN
              </div>
              <div className="text-lg font-semibold text-gray-900">Vilain</div>
            </div>
            <p className="text-sm text-gray-500 mb-3">Your trusted online shopping destination</p>
            <a href="mailto:contact@vilain.com" className="text-sm text-blue-700 hover:text-blue-800">contact@vilain.com</a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-gray-900" href={`/${locale}/category/all`}>Categories</Link></li>
              <li><Link className="hover:text-gray-900" href={`/${locale}/brands`}>Brands</Link></li>
              <li><Link className="hover:text-gray-900" href={`/${locale}/account/orders`}>My Orders</Link></li>
              <li><Link className="hover:text-gray-900" href={`/${locale}/wishlist`}>Wishlist</Link></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Follow Us</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.5 9.9v-7H7.9V12h2.6V9.7c0-2.6 1.6-4 3.9-4 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/></svg>
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-gray-900">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6-1a1 1 0 100 2 1 1 0 000-2zm-6 3.2A3.8 3.8 0 1112 17.8 3.8 3.8 0 0112 9.2z"/></svg>
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} All rights reserved</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <Link className="hover:text-gray-700" href={`/${locale}/policy/privacy`}>Privacy Policy</Link>
            <Link className="hover:text-gray-700" href={`/${locale}/policy/returns`}>Return Policy</Link>
            <Link className="hover:text-gray-700" href={`/${locale}/policy/terms`}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
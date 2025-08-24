'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

type NavItem =
  | { type: 'link'; href: string; label: string }
  | { type: 'divider' };

export default function AdminSidebarNav({ base }: { base: string }) {
  const pathname = usePathname() || '';
  const locale = useLocale();
  const isAR = locale === 'ar';
  const items: NavItem[] = [
    { type: 'link', href: `${base}`, label: isAR ? 'السلايدر' : 'Slides' },
    { type: 'link', href: `${base}/orders`, label: isAR ? 'الطلبات' : 'Orders' },
    { type: 'link', href: `${base}/returns`, label: isAR ? 'مرتجعات' : 'Returns' },
    { type: 'link', href: `${base}/products`, label: isAR ? 'المنتجات' : 'Products' },
    { type: 'link', href: `${base}/low-stock`, label: isAR ? 'تنبيهات المخزون' : 'Low Stock' },
    { type: 'link', href: `${base}/home-sections`, label: isAR ? 'أقسام الصفحة الرئيسية' : 'Home Sections' },
    { type: 'link', href: `${base}/brands`, label: isAR ? 'الماركات' : 'Brands' },
    { type: 'link', href: `${base}/categories`, label: isAR ? 'التصنيفات' : 'Categories' },
    { type: 'divider' },
    { type: 'link', href: `${base}/users`, label: isAR ? 'المستخدمون' : 'Users' },
    { type: 'link', href: `${base}/settings`, label: isAR ? 'الإعدادات' : 'Settings' },
  ];

  return (
    <nav className={`space-y-1 ${isAR ? 'text-right' : ''}`}>
      {items.map((it, idx) => {
        if (it.type === 'divider') return <div key={`d-${idx}`} className="h-px bg-gray-200 mx-3 my-2" />;
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`block px-3 py-2 rounded text-sm transition-colors ${active ? 'bg-[#2F3E77] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

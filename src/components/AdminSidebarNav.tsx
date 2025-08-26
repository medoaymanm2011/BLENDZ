'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

type NavItem =
  | { type: 'link'; href: string; label: string }
  | { type: 'divider' };

export default function AdminSidebarNav({ base }: { base: string }) {
  const pathname = usePathname() || '';
  const locale = useLocale();
  const isAR = locale === 'ar';
  const [unseen, setUnseen] = useState<number>(0);
  const ordersHref = `${base}/orders`;
  // Poll unseen orders count every 20s
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/orders/unseen-count', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnseen(Number(data?.count || 0));
      } catch {}
    }
    load();
    const t = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);
  const items: NavItem[] = [
    { type: 'link', href: `${base}`, label: isAR ? 'السلايدر' : 'Slides' },
    { type: 'link', href: ordersHref, label: isAR ? 'الطلبات' : 'Orders' },
    { type: 'link', href: `${base}/revenue`, label: isAR ? 'الإيرادات' : 'Revenue' },
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
            className={`relative block px-3 py-2 rounded text-sm transition-colors ${active ? 'bg-[#2F3E77] text-white' : 'text-gray-800 hover:bg-gray-100'}`}
          >
            {it.label}
            {it.href === ordersHref && unseen > 0 && (
              <span
                className={`absolute ${isAR ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 text-[11px] leading-none px-1.5 py-0.5 rounded-full bg-red-600 text-white`}
                aria-label={isAR ? 'طلبات غير مقروءة' : 'Unseen orders'}
              >
                {unseen}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

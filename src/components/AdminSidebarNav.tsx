'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem =
  | { type: 'link'; href: string; label: string }
  | { type: 'divider' };

export default function AdminSidebarNav({ base }: { base: string }) {
  const pathname = usePathname() || '';
  const items: NavItem[] = [
    { type: 'link', href: `${base}`, label: 'Slides' },
    { type: 'link', href: `${base}/orders`, label: 'Orders' },
    { type: 'link', href: `${base}/products`, label: 'Products' },
    { type: 'link', href: `${base}/home-sections`, label: 'Home Sections' },
    { type: 'link', href: `${base}/brands`, label: 'Brands' },
    { type: 'link', href: `${base}/categories`, label: 'Categories' },
    { type: 'divider' },
    { type: 'link', href: `${base}/users`, label: 'Users' },
    { type: 'link', href: `${base}/settings`, label: 'Settings' },
  ];

  return (
    <nav className="space-y-1">
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

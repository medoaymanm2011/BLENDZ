'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminRedirectGuard() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Only guard the exact locale root (home page)
        if (!pathname || pathname.split('?')[0] !== `/${locale}`) return;
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.user?.role === 'admin') {
          router.replace(`/${locale}/admin`);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [router, locale, pathname]);

  return null;
}

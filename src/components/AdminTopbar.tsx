'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function AdminTopbar({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const isAR = locale === 'ar';

  const targetLocale = isAR ? 'en' : 'ar';
  const langLabel = isAR ? 'English' : 'العربية';
  const logoutLabel = isAR ? 'تسجيل الخروج' : 'Logout';
  const loggingOutLabel = isAR ? 'جارٍ تسجيل الخروج...' : 'Logging out...';

  const targetPath = useMemo(() => {
    try {
      const parts = (pathname || '/').split('/').filter(Boolean);
      if (parts.length === 0) return `/${targetLocale}`;
      // replace first segment (locale)
      parts[0] = targetLocale;
      return '/' + parts.join('/');
    } catch {
      return `/${targetLocale}/admin`;
    }
  }, [pathname, targetLocale]);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    finally {
      setLoading(false);
      router.push(`/${locale}`);
    }
  }

  function switchLanguage() {
    router.push(targetPath);
  }

  return (
    <div className="w-full sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b shadow-sm" dir={isAR ? 'rtl' : 'ltr'}>
      <div className={`container mx-auto px-4 h-14 flex items-center justify-between ${isAR ? 'text-right' : ''}`}>
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#2F3E77] text-white flex items-center justify-center font-bold tracking-tight">B3</div>
          <div className="font-semibold tracking-wide">BLENDZ</div>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={switchLanguage} className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100">
            {langLabel}
          </button>
          <button onClick={logout} disabled={loading} className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50">
            {loading ? loggingOutLabel : logoutLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

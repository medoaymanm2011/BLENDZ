'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminTopbar({ locale }: { locale: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#2F3E77] text-white flex items-center justify-center font-bold tracking-tight">B3</div>
          <div className="font-semibold tracking-wide">BLENDZ</div>
        </Link>
        <button onClick={logout} disabled={loading} className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50">
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyPage() {
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [alert, setAlert] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = search.get('email') || '';
    setEmail(e);
  }, [search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!email || !code) { setAlert({ text: locale === 'ar' ? 'يرجى إدخال البريد والرمز' : 'Please enter email and code', type: 'error' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setAlert({ text: data?.error || (locale === 'ar' ? 'رمز تحقق غير صالح' : 'Invalid code'), type: 'error' }); return; }
      setAlert({ text: locale === 'ar' ? 'تم التحقق بنجاح. يمكنك تسجيل الدخول الآن.' : 'Email verified. You can login now.', type: 'success' });
      // Redirect to login page in account
      setTimeout(() => router.push(`/${locale}/account`), 800);
    } catch (err: any) {
      setAlert({ text: err?.message || (locale === 'ar' ? 'حدث خطأ' : 'Something went wrong'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setAlert(null);
    if (!email) { setAlert({ text: locale === 'ar' ? 'أدخل بريدك لإعادة الإرسال' : 'Enter your email to resend', type: 'error' }); return; }
    try {
      const res = await fetch('/api/auth/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setAlert({ text: data?.error || (locale === 'ar' ? 'تعذر الإرسال' : 'Failed to resend'), type: 'error' }); return; }
      setAlert({ text: locale === 'ar' ? 'تم إرسال رمز تحقق جديد' : 'Verification code resent', type: 'success' });
    } catch (err: any) {
      setAlert({ text: err?.message || (locale === 'ar' ? 'حدث خطأ' : 'Something went wrong'), type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md bg-white rounded-2xl ring-1 ring-gray-200 p-6">
          <h1 className="text-2xl font-bold text-center text-[#2F3E77] mb-2">{locale === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Email'}</h1>
          <p className="text-center text-sm text-gray-600 mb-6">
            {locale === 'ar' ? 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني' : 'Enter the verification code sent to your email'}
          </p>
          {alert && (
            <div className={`mb-4 rounded px-3 py-2 text-sm ${alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {alert.text}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'رمز التحقق' : 'Verification Code'}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-gray-400 text-center tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <button disabled={loading} type="submit" className="flex-1 bg-[#2F3E77] hover:brightness-95 text-white py-3 rounded-md disabled:opacity-60">
                {locale === 'ar' ? 'تحقق' : 'Verify'}
              </button>
              <button type="button" onClick={resend} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-md">
                {locale === 'ar' ? 'إعادة الإرسال' : 'Resend'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

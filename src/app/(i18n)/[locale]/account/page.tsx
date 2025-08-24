'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';
import Portal from '@/components/Portal';
import { useToast } from '@/context/ToastContext';


export default function AccountPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const { showToastCustom } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // All inline alerts/messages are replaced by toasts
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Password strength helpers
  const passwordChecks = (pwd: string) => ({
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    symbol: /[^A-Za-z0-9]/.test(pwd),
  });
  const passwordStrength = (pwd: string) => {
    const c = passwordChecks(pwd);
    return (c.length ? 1 : 0) + (c.upper ? 1 : 0) + (c.lower ? 1 : 0) + (c.number ? 1 : 0) + (c.symbol ? 1 : 0);
  };

  useEffect(() => {
    // Load session from backend
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data?.user) {
          setUser({ name: data.user.name, email: data.user.email, role: data.user.role });
          // If admin, send to admin dashboard directly
          if (data.user.role === 'admin') {
            try {
              setRedirecting(true);
              router.replace(`/${locale}/admin`);
              return;
            } catch {}
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Removed demo/local seeding. Rely solely on backend.

  // (optional) password strength checker was removed as unused

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // using toasts instead of inline message/alert
    setLoginErrors({});

    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) { showToastCustom({ message: locale === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password', variant: 'danger' }); return; }
    if (!validateEmail(email)) { showToastCustom({ message: locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', variant: 'danger' }); return; }
    if (password.length < 6) { showToastCustom({ message: locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', variant: 'danger' }); return; }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      // Handle structured validation errors
      if (res.status === 400 && data?.error?.code === 'VALIDATION_FAILED') {
        const fe = data.error.fieldErrors || {};
        const err: { email?: string; password?: string; general?: string } = {};
        if (Array.isArray(fe.email) && fe.email[0]) err.email = String(fe.email[0]);
        if (Array.isArray(fe.password) && fe.password[0]) err.password = String(fe.password[0]);
        setLoginErrors(err);
        return;
      }
      if (res.status === 403) {
        showToastCustom({ message: locale === 'ar' ? 'البريد الإلكتروني غير مُفعل. يرجى تأكيد البريد أولاً.' : 'Email not verified. Please verify your email first.', variant: 'danger' });
        // take user to verify page with prefilled email
        router.push(`/${locale}/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      if (!res.ok) {
        const code = data?.error?.code;
        const msgMap: Record<string, string> = {
          INVALID_CREDENTIALS: locale === 'ar' ? 'بيانات تسجيل الدخول غير صحيحة' : 'Invalid login credentials',
          EMAIL_NOT_VERIFIED: locale === 'ar' ? 'البريد الإلكتروني غير مُفعل' : 'Email not verified',
          SESSION_ERROR: locale === 'ar' ? 'تعذر إنشاء الجلسة' : 'Failed to establish session',
        };
        const friendly = (code && msgMap[code]) || data?.error?.message || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
        showToastCustom({ message: friendly, variant: 'danger' });
        return;
      }
      const me = data;
      if (me?.user) {
        try {
          // Notify app to refresh user from server
          window.dispatchEvent(new Event('auth_changed'));
          // Store last login password temporarily for prefilling Current Password (masked)
          sessionStorage.setItem('last_login_password', password);
        } catch {}
        showToastCustom({ message: locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully', variant: 'success' });
        setRedirecting(true);
        setLoading(true);
        // If admin, always go directly to admin dashboard (no flicker)
        if (me.user.role === 'admin') {
          router.replace(`/${locale}/admin`);
          return;
        }
        // Otherwise, prefer stored redirect if present
        try {
          const stored = sessionStorage.getItem('post_login_redirect');
          if (stored) {
            sessionStorage.removeItem('post_login_redirect');
            router.replace(stored);
            return;
          }
        } catch {}
        {
          router.replace(`/${locale}`);
        }
      }
    } catch (err: any) {
      showToastCustom({ message: err?.message || (locale === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login error'), variant: 'danger' });
    } finally {
      setLoginEmail('');
      setLoginPassword('');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // toasts instead of inline
    setRegisterErrors({});
    
    if (!firstName || !registerEmail || !registerPassword || !confirmPassword) { showToastCustom({ message: locale === 'ar' ? 'يرجى إكمال جميع الحقول' : 'Please complete all fields', variant: 'danger' }); return; }
    if (!validateEmail(registerEmail)) { showToastCustom({ message: locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', variant: 'danger' }); return; }
    if (registerPassword.length < 8) { showToastCustom({ message: locale === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters', variant: 'danger' }); return; }
    // Enforce complexity: upper, lower, number, symbol
    const checks = passwordChecks(registerPassword);
    if (!(checks.upper && checks.lower && checks.number && checks.symbol)) {
      const msg = locale === 'ar'
        ? 'يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز'
        : 'Password must include uppercase, lowercase, number, and symbol';
      showToastCustom({ message: msg, variant: 'danger' });
      return;
    }
    if (registerPassword !== confirmPassword) { showToastCustom({ message: locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', variant: 'danger' }); return; }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firstName.trim(), email: registerEmail.trim(), password: registerPassword })
      });
      const data = await res.json();
      if (res.status === 400 && data?.error?.code === 'VALIDATION_FAILED') {
        const fe = data.error.fieldErrors || {};
        const err: { name?: string; email?: string; password?: string; general?: string } = {};
        if (Array.isArray(fe.name) && fe.name[0]) err.name = String(fe.name[0]);
        if (Array.isArray(fe.email) && fe.email[0]) err.email = String(fe.email[0]);
        if (Array.isArray(fe.password) && fe.password[0]) err.password = String(fe.password[0]);
        setRegisterErrors(err);
        return;
      }
      if (res.status === 409) {
        const friendly = locale === 'ar' ? 'هذا البريد مسجّل بالفعل. يرجى تسجيل الدخول.' : 'This email is already registered. Please log in.';
        showToastCustom({ message: friendly, variant: 'danger' });
        setIsLogin(true);
        setLoginEmail(registerEmail.trim());
        return;
      }
      if (!res.ok) {
        const code = data?.error?.code;
        const msgMap: Record<string, string> = {
          EMAIL_EXISTS: locale === 'ar' ? 'هذا البريد مسجّل بالفعل' : 'Email already registered',
          SESSION_ERROR: locale === 'ar' ? 'تعذر إنشاء الجلسة' : 'Failed to establish session',
        };
        const friendly = (code && msgMap[code]) || data?.error?.message || (locale === 'ar' ? 'تعذر إنشاء الحساب' : 'Failed to create account');
        showToastCustom({ message: friendly, variant: 'danger' });
        return;
      }
      // Redirect to verify page to confirm email before login
      router.push(`/${locale}/verify?email=${encodeURIComponent(registerEmail.trim())}`);
      setFirstName(''); setRegisterEmail(''); setRegisterPassword(''); setConfirmPassword('');
    } catch (err: any) {
      showToastCustom({ message: err?.message || (locale === 'ar' ? 'خطأ أثناء إنشاء الحساب' : 'An error occurred while creating the account'), variant: 'danger' });
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // toasts
    if (!verifyEmail || !verifyCode) {
      showToastCustom({ message: locale === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code', variant: 'danger' });
      return;
    }
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastCustom({ message: data?.error || (locale === 'ar' ? 'رمز تحقق غير صحيح' : 'Invalid verification code'), variant: 'danger' });
        return;
      }
      showToastCustom({ message: locale === 'ar' ? 'تم التحقق من البريد بنجاح. يمكنك تسجيل الدخول الآن.' : 'Email verified successfully. You can log in now.', variant: 'success' });
      setShowVerify(false);
      setIsLogin(true);
      setLoginEmail(verifyEmail);
      setVerifyCode('');
    } catch (e: any) {
      showToastCustom({ message: e?.message || (locale === 'ar' ? 'تعذر تأكيد البريد الآن' : 'Failed to verify email'), variant: 'danger' });
    }
  };

  const resendVerification = async () => {
    if (!verifyEmail) return;
    try {
      const res = await fetch('/api/auth/verify/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastCustom({ message: data?.error || (locale === 'ar' ? 'تعذر إرسال رمز جديد' : 'Failed to resend verification code'), variant: 'danger' });
        return;
      }
      showToastCustom({ message: locale === 'ar' ? 'تم إرسال رمز تحقق جديد إلى بريدك.' : 'A new verification code has been sent to your email.', variant: 'success' });
    } catch (e: any) {
      showToastCustom({ message: e?.message || (locale === 'ar' ? 'تعذر إرسال رمز جديد' : 'Failed to resend verification code'), variant: 'danger' });
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !validateEmail(resetEmail)) {
      showToastCustom({ message: locale === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email', variant: 'danger' });
      return;
    }
    showToastCustom({ message: locale === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' : 'Password reset link has been sent to your email', variant: 'success' });
    setShowPasswordReset(false);
    setResetEmail('');
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Logout failed');
      setUser(null);
      try {
        sessionStorage.removeItem('last_login_password');
        window.dispatchEvent(new Event('auth_changed'));
      } catch {}
      showToastCustom({ message: locale === 'ar' ? 'تم تسجيل الخروج' : 'Logged out successfully', variant: 'success' });
      router.replace(`/${locale}`);
    } catch (e: any) {
      showToastCustom({ message: e?.message || (locale === 'ar' ? 'تعذر تسجيل الخروج' : 'Logout failed'), variant: 'danger' });
    }
  };

  // Trigger header re-render when user state changes
  useEffect(() => {
    window.dispatchEvent(new Event('storage'));
  }, [user]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:px-6 lg:px-8">
          {user ? (
            <div className="space-y-6">
              {/* Page Title */}
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[#2F3E77]">
                  <circle cx="18" cy="15" r="3" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M10 15H6a4 4 0 0 0-4 4v2" />
                  <path d="m21.7 16.4-.9-.3" />
                  <path d="m15.2 13.9-.9-.3" />
                  <path d="m16.6 18.7.3-.9" />
                  <path d="m19.1 12.2.3-.9" />
                  <path d="m19.6 18.7-.4-1" />
                  <path d="m16.8 12.3-.4-1" />
                  <path d="m14.3 16.6 1-.4" />
                  <path d="m20.7 13.8 1-.4" />
                </svg>
                <h1 className="text-3xl font-bold tracking-tight text-[#2F3E77]">{locale === 'ar' ? 'الملف الشخصي' : 'Profile'}</h1>
              </div>

              <div className="ltr:pl-6 rtl:pr-6 lg:ltr:pl-8 lg:rtl:pr-8">
                {/* Inline message banner removed in favor of toasts */}

                {/* Profile Information */}
                <ProfileInfoCard user={user} onSave={(updated) => {
                  const merged = { ...user!, ...updated };
                  setUser(merged);
                  showToastCustom({ message: locale === 'ar' ? 'تم حفظ الملف الشخصي' : 'Profile saved', variant: 'success' });
                }} />

                {/* Update Password */}
                <PasswordCard
                  currentPassword={''}
                  onSaved={() => showToastCustom({ message: locale === 'ar' ? 'تم تحديث كلمة المرور' : 'Password updated', variant: 'success' })}
                />

                {/* Language Preferences */}
                <LanguageCard locale={locale} onChange={(target) => {
                  try {
                    const parts = (window.location.pathname || '/').split('/');
                    if (parts.length > 1 && (parts[1] === 'ar' || parts[1] === 'en')) {
                      parts[1] = target;
                      router.push(parts.join('/') || `/${target}`);
                    } else {
                      router.push(`/${target}/account`);
                    }
                  } catch {}
                }} />

                {/* Delete Account */}
                <DeleteCard onDelete={async () => {
                  // Just clear session (no backend delete endpoint yet)
                  await handleLogout();
                  router.push(`/${locale}`);
                }} />
              </div>
            </div>
          ) : loading ? (
            <div className="mx-auto max-w-md w-full min-h-[80vh] grid place-items-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <div className="mx-auto max-w-md w-full min-h-[80vh] grid place-items-center">
              <div className="w-full mx-auto">
                {/* Removed segmented toggle buttons for cleaner layout */}

                {/* Inline alerts removed; using toasts */}

                {showVerify ? (
                  <form className="space-y-4" onSubmit={handleVerifySubmit}>
                    <h3 className="text-lg font-medium text-center">تأكيد البريد الإلكتروني</h3>
                    <p className="text-sm text-gray-600 text-center">أدخل رمز التحقق المرسل إلى: <span className="font-semibold">{verifyEmail}</span></p>
                    <div>
                      <label className="text-sm font-medium">رمز التحقق</label>
                      <input
                        value={verifyCode}
                        onChange={(e)=>setVerifyCode(e.target.value)}
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-black placeholder:text-transparent text-center tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" className="flex-1 bg-[#2F3E77] hover:brightness-95 text-white py-3 rounded-lg">تحقق</button>
                      <button type="button" onClick={resendVerification} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg">إعادة الإرسال</button>
                    </div>
                    <div className="text-center text-sm">
                      <button type="button" onClick={()=>{ setShowVerify(false); setIsLogin(true); }} className="text-[#2F3E77] hover:brightness-95">العودة لتسجيل الدخول</button>
                    </div>
                  </form>
                ) : showPasswordReset ? (
                  <form className="space-y-4" onSubmit={handlePasswordReset}>
                    <h3 className="text-lg font-medium text-center">إعادة تعيين كلمة المرور</h3>
                    <div>
                      <label className="text-sm font-medium">البريد الإلكتروني</label>
                      <input 
                        value={resetEmail} 
                        onChange={(e) => setResetEmail(e.target.value)} 
                        type="email" 
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-black placeholder:text-transparent text-right focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors">إرسال الرابط</button>
                      <button type="button" onClick={() => setShowPasswordReset(false)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg transition-colors">إلغاء</button>
                    </div>
                  </form>
                ) : isLogin ? (
                  <form className="space-y-5" onSubmit={handleLoginSubmit}>
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#2F3E77]">{locale === 'ar' ? 'تسجيل الدخول' : 'Log in'}</h2>
                      <p className="text-sm text-gray-600">{locale === 'ar' ? 'أدخل بياناتك للوصول إلى حسابك' : 'Enter your information to access your account'}</p>
                    </div>


                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                      <input 
                        value={loginEmail} 
                        onChange={(e) => setLoginEmail(e.target.value)} 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      {loginErrors.email && (<div className="text-red-600 text-sm mt-1">{loginErrors.email}</div>)}
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                      <div className="relative">
                        <input 
                          value={loginPassword} 
                          onChange={(e) => setLoginPassword(e.target.value)} 
                          type={showLoginPassword ? 'text' : 'password'} 
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 rtl:pl-10 rtl:pr-3"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(v => !v)}
                          className="absolute inset-y-0 ltr:right-2 rtl:left-2 flex items-center text-gray-500 hover:text-gray-700"
                          aria-label={locale === 'ar' ? (showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showLoginPassword ? 'Hide password' : 'Show password')}
                          title={locale === 'ar' ? (showLoginPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showLoginPassword ? 'Hide password' : 'Show password')}
                        >
                          {showLoginPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.07 1.1-2.05 1.88-2.9M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M6.1 6.1 1 1m22 22-5.1-5.1M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8- .29.67-.65 1.3-1.08 1.88"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                      {loginErrors.password && (<div className="text-red-600 text-sm mt-1">{loginErrors.password}</div>)}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} />
                        {locale === 'ar' ? 'تذكرني' : 'Remember me'}
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowPasswordReset(true)} 
                        className="text-sm text-[#2F3E77] hover:brightness-95"
                      >
                        {locale === 'ar' ? 'هل نسيت كلمة المرور؟' : 'Forgot your password?'}
                      </button>
                    </div>

                    <button type="submit" className="w-full bg-[#2F3E77] hover:brightness-95 text-white py-3 rounded-md shadow-md transition-colors">{locale === 'ar' ? 'تسجيل الدخول' : 'Log in'}</button>

                    <div className="text-center text-sm text-gray-600">
                      {locale === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                      <button type="button" onClick={()=>setIsLogin(false)} className="text-[#2F3E77] hover:brightness-95 font-semibold">
                        {locale === 'ar' ? 'سجّل الآن' : 'Register'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-bold text-[#2F3E77]">{locale === 'ar' ? 'إنشاء حساب' : 'Create an account'}</h2>
                      <p className="text-sm text-gray-600">{locale === 'ar' ? 'أدخل بياناتك لإنشاء حساب' : 'Enter your information to create an account'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'الاسم' : 'Name'}</label>
                      <input 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      {registerErrors.name && (<div className="text-red-600 text-sm mt-1">{registerErrors.name}</div>)}
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                      <input 
                        value={registerEmail} 
                        onChange={(e) => setRegisterEmail(e.target.value)} 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      {registerErrors.email && (<div className="text-red-600 text-sm mt-1">{registerErrors.email}</div>)}
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                      <div className="relative">
                        <input 
                          value={registerPassword} 
                          onChange={(e) => setRegisterPassword(e.target.value)} 
                          type={showRegisterPassword ? 'text' : 'password'} 
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 rtl:pl-10 rtl:pr-3" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(v => !v)}
                          className="absolute inset-y-0 ltr:right-2 rtl:left-2 flex items-center text-gray-500 hover:text-gray-700"
                          aria-label={locale === 'ar' ? (showRegisterPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showRegisterPassword ? 'Hide password' : 'Show password')}
                          title={locale === 'ar' ? (showRegisterPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showRegisterPassword ? 'Hide password' : 'Show password')}
                        >
                          {showRegisterPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.07 1.1-2.05 1.88-2.9M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M6.1 6.1 1 1m22 22-5.1-5.1M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8- .29.67-.65 1.3-1.08 1.88"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                      {registerErrors.password && (<div className="text-red-600 text-sm mt-1">{registerErrors.password}</div>)}
                      {/* Strength meter */}
                      {registerPassword && (
                        <div className="mt-2 space-y-2">
                          <div className="h-2 bg-gray-200 rounded">
                            {(() => {
                              const s = passwordStrength(registerPassword);
                              const width = `${(s / 5) * 100}%`;
                              const color = s <= 2 ? 'bg-red-500' : s === 3 ? 'bg-yellow-500' : s === 4 ? 'bg-blue-500' : 'bg-green-600';
                              return <div className={`h-2 ${color} rounded transition-all`} style={{ width }} />;
                            })()}
                          </div>
                          <ul className="text-xs text-gray-700 grid grid-cols-2 gap-x-4 gap-y-1">
                            {(() => {
                              const c = passwordChecks(registerPassword);
                              const Item = ({ ok, label }: { ok: boolean; label: string }) => (
                                <li className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-gray-600'}`}>
                                  <svg className={`h-4 w-4 ${ok ? 'text-green-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {ok ? <path d="M20 6L9 17l-5-5"/> : <circle cx="12" cy="12" r="1"/>}
                                  </svg>
                                  {label}
                                </li>
                              );
                              return (
                                <>
                                  <Item ok={c.length} label={locale === 'ar' ? '٨ أحرف على الأقل' : 'At least 8 chars'} />
                                  <Item ok={c.upper} label={locale === 'ar' ? 'حرف كبير' : 'Uppercase letter'} />
                                  <Item ok={c.lower} label={locale === 'ar' ? 'حرف صغير' : 'Lowercase letter'} />
                                  <Item ok={c.number} label={locale === 'ar' ? 'رقم' : 'Number'} />
                                  <Item ok={c.symbol} label={locale === 'ar' ? 'رمز' : 'Symbol'} />
                                </>
                              );
                            })()}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                      <div className="relative">
                        <input 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 rtl:pl-10 rtl:pr-3" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute inset-y-0 ltr:right-2 rtl:left-2 flex items-center text-gray-500 hover:text-gray-700"
                          aria-label={locale === 'ar' ? (showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showConfirmPassword ? 'Hide password' : 'Show password')}
                          title={locale === 'ar' ? (showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showConfirmPassword ? 'Hide password' : 'Show password')}
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.46-1.07 1.1-2.05 1.88-2.9M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M6.1 6.1 1 1m22 22-5.1-5.1M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8- .29.67-.65 1.3-1.08 1.88"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                      {confirmPassword && registerPassword !== confirmPassword && (
                        <div className="text-red-600 text-sm mt-1">{locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}</div>
                      )}
                    </div>

                    <button type="submit" className="w-full bg-[#2F3E77] hover:brightness-95 text-white py-3 rounded-md shadow-md transition-colors">{locale === 'ar' ? 'تسجيل' : 'Register'}</button>


                    <div className="text-center text-sm text-gray-600">
                      {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already registered?'}{' '}
                      <button type="button" onClick={()=>setIsLogin(true)} className="text-[#2F3E77] hover:brightness-95 font-semibold">
                        {locale === 'ar' ? 'تسجيل الدخول' : 'Log in'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Profile Info Card
function ProfileInfoCard({ user, onSave }: { user: { name: string; email: string }; onSave: (u: { name: string; email: string }) => void }) {
  const locale = useLocale();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !validateEmail(email)) return;
    setSaving(true);
    setTimeout(() => {
      onSave({ name: name.trim(), email: email.trim() });
      setSaving(false);
    }, 300);
  };

  return (
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 p-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{locale === 'ar' ? 'معلومات الملف الشخصي' : 'Profile Information'}</h2>
        <p className="text-sm text-gray-600">{locale === 'ar' ? 'حدّث اسمك وبريدك الإلكتروني' : 'Update your account’s profile information and email address.'}</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'الاسم' : 'Name'}</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <button disabled={saving} type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#2F3E77] text-white hover:brightness-95 disabled:opacity-60">
          {locale === 'ar' ? 'حفظ' : 'Save'}
        </button>
      </form>
    </section>
  );
}

// Password Card (mock client validation)
function PasswordCard({ onSaved, currentPassword = '' }: { onSaved: () => void; currentPassword?: string }) {
  const locale = useLocale();
  const [current, setCurrent] = useState(currentPassword);
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // On mount, if sessionStorage has last login password, use it once then clear it
  useEffect(() => {
    try {
      const tmp = sessionStorage.getItem('last_login_password');
      if (tmp) {
        setCurrent(tmp);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep sessionStorage in sync with current field during the session
  useEffect(() => {
    try {
      if (current) {
        sessionStorage.setItem('last_login_password', current);
      } else {
        sessionStorage.removeItem('last_login_password');
      }
    } catch {}
  }, [current]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!current || !next || !confirm) { setError(locale === 'ar' ? 'يرجى إكمال الحقول' : 'Please fill all fields'); return; }
    if (next.length < 8) { setError(locale === 'ar' ? 'كلمة مرورة لا تقل عن 8 أحرف' : 'Password must be at least 8 characters'); return; }
    if (next !== confirm) { setError(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    onSaved();
    try { sessionStorage.removeItem('last_login_password'); } catch {}
    setCurrent(''); setNext(''); setConfirm('');
  };

  return (
    <section className="rounded-xl border bg-white text-gray-900 shadow p-4 sm:p-8">
      <div className="mb-4 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900">{locale === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}</h2>
        <p className="text-sm text-gray-600">{locale === 'ar' ? 'احرص على استخدام كلمة مرور قوية' : 'Ensure your account is using a long, random password to stay secure.'}</p>
      </div>
      {error && <div className="mb-3 rounded px-3 py-2 bg-red-100 text-red-800 text-sm">{error}</div>}
      <div className="max-w-xl">
      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
          <input
            type="password"
            value={current}
            onChange={(e)=>setCurrent(e.target.value)}
            placeholder={locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
          <input
            type="password"
            value={next}
            onChange={(e)=>setNext(e.target.value)}
            placeholder={locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
          <input
            type="password"
            value={confirm}
            onChange={(e)=>setConfirm(e.target.value)}
            placeholder={locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-4">
        <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-[#2F3E77] text-white shadow hover:brightness-95 h-9 px-4 py-2">
          {locale === 'ar' ? 'حفظ' : 'Save'}
        </button>
        </div>
      </form>
      </div>
    </section>
  );
}

// Language Preferences
function LanguageCard({ locale, onChange }: { locale: string; onChange: (target: 'ar' | 'en') => void }) {
  return (
    <section className="rounded-xl border bg-white text-gray-900 shadow p-4 sm:p-8">
      <div className="mb-4 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900">{locale === 'ar' ? 'تفضيلات اللغة' : 'Language Preferences'}</h2>
        <p className="text-sm text-gray-600">{locale === 'ar' ? 'اختر اللغة المفضلة للواجهة' : 'Choose your preferred language for the interface.'}</p>
      </div>
      <div className="max-w-xl flex items-center gap-4">
        <button onClick={()=>onChange('ar')} className={`px-3 py-1.5 rounded-full border ${locale==='ar' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-200'} shadow-sm`}>AR</button>
        <button onClick={()=>onChange('en')} className={`px-3 py-1.5 rounded-full border ${locale==='en' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-200'} shadow-sm`}>EN</button>
      </div>
    </section>
  );
}

// Delete Account
function DeleteCard({ onDelete }: { onDelete: () => void }) {
  const locale = useLocale();
  const { confirm } = useConfirmDialog();
  return (
    <section className="rounded-xl border bg-white text-gray-900 shadow p-4 sm:p-8">
      <div className="mb-4 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900">{locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}</h2>
        <p className="text-sm text-gray-600">{locale === 'ar' ? 'عند حذف الحساب ستحذف جميع البيانات بشكل دائم.' : 'Once your account is deleted, all of its resources and data will be permanently deleted.'}</p>
      </div>
      <div className="max-w-xl space-y-6">
        <button
          onClick={async () => {
            const ok = await confirm({
              variant: 'danger',
              title: locale === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?',
              message: locale === 'ar' ? 'سيتم حذف حسابك وجميع بياناته بشكل دائم ولا يمكن التراجع.' : 'This action will permanently delete your account and all data.',
              confirmText: locale === 'ar' ? 'نعم، احذف' : 'Yes, delete',
              cancelText: locale === 'ar' ? 'إلغاء' : 'Cancel',
            });
            if (ok) onDelete();
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-red-600 text-white shadow-sm hover:bg-red-700 h-9 px-4 py-2"
        >
          {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
        </button>
      </div>
    </section>
  );
}
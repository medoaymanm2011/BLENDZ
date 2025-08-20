'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/context/ConfirmDialogContext';

// Admin emails for demo purposes
const ADMIN_EMAILS = ['admin@blendz.com', 'manager@blendz.com'];
type StoredUser = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  verified?: boolean;
  verificationCode?: string | null;
};
const USERS_KEY = 'vk_users';
const loadUsers = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveUsers = (users: StoredUser[]) => {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
};

export default function AccountPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const locale = useLocale();
  const router = useRouter();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  useEffect(() => {
    // Load user from localStorage if present
    try {
      const stored = localStorage.getItem('vk_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Seed a demo credential if none exist
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) {
        const seed: StoredUser[] = [
          { name: 'Demo', email: 'demo@blendz.com', password: '12345678', role: 'user' }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      }
    } catch {}
  }, []);

  // (optional) password strength checker was removed as unused

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!loginEmail || !loginPassword) {
      setMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    if (!validateEmail(loginEmail)) {
      setMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    
    if (loginPassword.length < 6) {
      setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    // Validate against saved users array
    const users = loadUsers();
    const found = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword);
    if (!found) {
      setMessage('بيانات تسجيل الدخول غير صحيحة');
      return;
    }
    // Block login until email verified
    if (!found.verified) {
      // Ensure a code exists
      let code = found.verificationCode;
      if (!code) {
        code = genCode();
        found.verificationCode = code;
        saveUsers(users);
      }
      try { console.log('Verification code (login):', code, 'for', found.email); } catch {}
      setMessage('يرجى تفعيل بريدك الإلكتروني أولاً. أدخل رمز التحقق المرسل إلى بريدك.');
      setShowVerify(true);
      setVerifyEmail(found.email);
      return;
    }
    const isAdmin = ADMIN_EMAILS.includes(found.email.toLowerCase());
    const role = isAdmin ? 'admin' : (found.role || 'user');
    const sessionUser = { name: found.name || (found.email.split('@')[0] || 'المستخدم'), email: found.email, role };
    localStorage.setItem('vk_user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    setMessage(`تم تسجيل الدخول بنجاح${isAdmin ? ' - مرحباً بك في لوحة الإدارة' : ''}`);
    
    // Clear form
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!firstName || !registerEmail || !registerPassword || !confirmPassword) {
      setMessage('يرجى إكمال جميع الحقول');
      return;
    }
    
    if (!validateEmail(registerEmail)) {
      setMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    
    if (registerPassword.length < 8) {
      setMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      return;
    }

    // Check duplicates and save into users array
    const users = loadUsers();
    if (users.some(u => u.email.toLowerCase() === registerEmail.toLowerCase())) {
      setMessage('هذا البريد مسجل بالفعل');
      return;
    }
    const isAdmin = ADMIN_EMAILS.includes(registerEmail.toLowerCase());
    const role = isAdmin ? 'admin' : 'user';
    const code = genCode();
    const newStored: StoredUser = { name: `${firstName}`.trim(), email: registerEmail, password: registerPassword, role, verified: false, verificationCode: code };
    users.push(newStored);
    saveUsers(users);
    try { console.log('Verification code (register):', code, 'for', registerEmail); } catch {}

    // Show verify step, do NOT log the user in yet
    setShowVerify(true);
    setVerifyEmail(registerEmail);
    setIsLogin(true);
    setMessage('تم إنشاء الحساب. تحقق من بريدك الإلكتروني وأدخل رمز التحقق للمتابعة.');
    
    // Clear form
    setFirstName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyEmail || !verifyCode) {
      setMessage('يرجى إدخال رمز التحقق');
      return;
    }
    const users = loadUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === verifyEmail.toLowerCase());
    if (idx === -1) { setMessage('البريد غير موجود'); return; }
    if (users[idx].verificationCode !== verifyCode) {
      setMessage('رمز غير صحيح');
      return;
    }
    users[idx].verified = true;
    users[idx].verificationCode = null;
    saveUsers(users);
    setMessage('تم التحقق من البريد بنجاح. يمكنك تسجيل الدخول الآن.');
    setShowVerify(false);
    setIsLogin(true);
    setLoginEmail(verifyEmail);
    setVerifyCode('');
  };

  const resendVerification = () => {
    if (!verifyEmail) return;
    const users = loadUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === verifyEmail.toLowerCase());
    if (idx === -1) { setMessage('البريد غير موجود'); return; }
    const code = genCode();
    users[idx].verificationCode = code;
    saveUsers(users);
    try { console.log('Verification code (resend):', code, 'for', verifyEmail); } catch {}
    setMessage('تم إرسال رمز تحقق جديد إلى بريدك.');
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !validateEmail(resetEmail)) {
      setMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    setShowPasswordReset(false);
    setResetEmail('');
  };

  const handleLogout = () => {
    localStorage.removeItem('vk_user');
    setUser(null);
    setMessage('تم تسجيل الخروج');
  };

  // Trigger header re-render when user state changes
  useEffect(() => {
    window.dispatchEvent(new Event('storage'));
  }, [user]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-0 space-y-6 sm:px-6 lg:px-8">
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
                {message && (
                  <div className={`mb-2 px-4 py-2 rounded ${message.includes('يرجى') || message.includes('خطأ') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message}</div>
                )}

                {/* Profile Information */}
                <ProfileInfoCard user={user} onSave={(updated) => {
                  const merged = { ...user!, ...updated };
                  try {
                    localStorage.setItem('vk_user', JSON.stringify(merged));
                    window.dispatchEvent(new Event('vk_user_updated'));
                  } catch {}
                  setUser(merged);
                  setMessage(locale === 'ar' ? 'تم حفظ الملف الشخصي' : 'Profile saved');
                }} />

                {/* Update Password */}
                <PasswordCard
                  currentPassword={(() => {
                    try {
                      const users = loadUsers();
                      const found = users.find(u => u.email.toLowerCase() === (user?.email || '').toLowerCase());
                      return found?.password || '';
                    } catch { return ''; }
                  })()}
                  onSaved={() => setMessage(locale === 'ar' ? 'تم تحديث كلمة المرور' : 'Password updated')}
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
                <DeleteCard onDelete={() => {
                  try {
                    localStorage.removeItem('vk_user');
                    window.dispatchEvent(new Event('vk_user_updated'));
                  } catch {}
                  setUser(null);
                  router.push(`/${locale}`);
                }} />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md w-full min-h-[80vh] grid place-items-center">
              <div className="w-full mx-auto">
                {/* Removed segmented toggle buttons for cleaner layout */}

                {message && (
                  <div className={`mb-4 px-4 py-2 rounded ${message.includes('يرجى') || message.includes('خطأ') || message.includes('ضعيف') || message.includes('غير متطابقة') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {message}
                  </div>
                )}

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

                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" className="inline-flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#1877F2] text-white hover:opacity-95 shadow-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.3V12h2.3V9.7c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .1 2 .1v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12z"/></svg>
                        {locale === 'ar' ? 'فيسبوك' : 'Facebook'}
                      </button>
                      <button type="button" className="inline-flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#EA4335] text-white hover:opacity-95 shadow-sm">
                        <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.202,6.053,28.791,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.004,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.202,6.053,28.791,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.191-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.274-7.956l-6.49,5.004C8.57,39.556,15.737,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.237-2.231,4.215-4.097,5.744l-6.191-5.238 C35.137,35.256,44,28,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                        Google
                      </button>
                    </div>

                    <div className="relative text-center">
                      <span className="px-2 text-xs text-gray-500 bg-white relative z-10">{locale === 'ar' ? 'أو المتابعة عبر البريد' : 'OR CONTINUE WITH'}</span>
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200" />
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                      <input 
                        value={loginEmail} 
                        onChange={(e) => setLoginEmail(e.target.value)} 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                      <input 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
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
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                      <input 
                        value={registerEmail} 
                        onChange={(e) => setRegisterEmail(e.target.value)} 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                      <input 
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)} 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1 text-gray-800">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                      <input 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-black placeholder:text-transparent shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                      />
                      {confirmPassword && registerPassword !== confirmPassword && (
                        <div className="text-red-600 text-sm mt-1">{locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}</div>
                      )}
                    </div>

                    <button type="submit" className="w-full bg-[#2F3E77] hover:brightness-95 text-white py-3 rounded-md shadow-md transition-colors">{locale === 'ar' ? 'تسجيل' : 'Register'}</button>

                    <div className="relative text-center">
                      <span className="px-2 text-xs text-gray-500 bg-white relative z-10">{locale === 'ar' ? 'أو المتابعة عبر' : 'OR CONTINUE WITH'}</span>
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" className="inline-flex items-center justify-center gap-2 py-2.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.3V12h2.3V9.7c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .1 2 .1v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12z"/></svg>
                        Facebook
                      </button>
                      <button type="button" className="inline-flex items-center justify-center gap-2 py-2.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">
                        <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.202,6.053,28.791,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.004,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.202,6.053,28.791,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.191-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.274-7.956l-6.49,5.004C8.57,39.556,15.737,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.793,2.237-2.231,4.215-4.097,5.744l-6.191-5.238 C35.137,35.256,44,28,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                        Google
                      </button>
                    </div>

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!current || !next || !confirm) { setError(locale === 'ar' ? 'يرجى إكمال الحقول' : 'Please fill all fields'); return; }
    if (next.length < 8) { setError(locale === 'ar' ? 'كلمة مرورة لا تقل عن 8 أحرف' : 'Password must be at least 8 characters'); return; }
    if (next !== confirm) { setError(locale === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'); return; }
    onSaved();
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
          <input type="password" value={current} onChange={(e)=>setCurrent(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
          <input type="password" value={next} onChange={(e)=>setNext(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">{locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
          <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 text-black placeholder:text-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
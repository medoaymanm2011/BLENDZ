'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

export type Toast = {
  id: string;
  message?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'danger' | 'success' | 'info';
  duration?: number; // ms
};

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, duration?: number) => void; // backwards compatible simple API
  showToastCustom: (opts: { title?: string; description?: string; message?: string; variant?: 'default' | 'danger' | 'success' | 'info'; duration?: number }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, duration = 2000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant: 'default', duration }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
  }, [dismissToast]);

  const showToastCustom = useCallback((opts: { title?: string; description?: string; message?: string; variant?: 'default' | 'danger' | 'success' | 'info'; duration?: number }) => {
    const id = Math.random().toString(36).slice(2);
    const { title, description, message, variant = 'default', duration = 2500 } = opts || {} as any;
    setToasts((t) => [...t, { id, title, description, message, variant, duration }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
  }, [dismissToast]);

  const value = useMemo(() => ({ toasts, showToast, showToastCustom, dismissToast }), [toasts, showToast, showToastCustom, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toasts container */}
      <div className="pointer-events-none fixed top-5 ltr:right-5 rtl:left-5 z-[1000] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `pointer-events-auto w-[340px] rounded-xl select-none shadow-lg shadow-black/5 overflow-hidden ` +
              (t.variant === 'danger'
                ? 'bg-[#EF4444] text-white'
                : 'border border-gray-200 bg-white')
            }
            role="status"
            aria-live="polite"
          >
            {t.variant === 'danger' ? (
              <div className="px-4 py-3">
                {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                {t.description && <div className="text-xs opacity-95 mt-0.5">{t.description}</div>}
                {!t.title && !t.description && t.message && (
                  <div className="text-sm font-semibold">{t.message}</div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-sm font-semibold text-[#2F3E77]">{t.title || t.message}</div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

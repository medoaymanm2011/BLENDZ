import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import getI18nConfig, { locales } from '@/i18n/config';
import { StoreProvider } from '@/context/StoreContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmDialogProvider } from '@/context/ConfirmDialogContext';

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalized = decodeURIComponent(String(locale)).trim();
  if (!locales.includes(normalized as any)) {
    // Fallback to default instead of 404 to avoid dev 404s caused by whitespace/encoding
    // You can re-enable notFound() if needed.
    // notFound();
  }

  const i18n = await getI18nConfig({ locale: normalized } as any);

  const isRTL = normalized === 'ar';

  // Convert flat dot-notation messages (e.g., "a.b.c") to nested objects expected by next-intl v4
  function nestMessages(input: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(input || {})) {
      const parts = key.split('.');
      let cur = out;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]!;
        if (i === parts.length - 1) {
          cur[p] = value;
        } else {
          cur[p] = cur[p] ?? {};
          cur = cur[p];
        }
      }
    }
    return out;
  }
  const nestedMessages = nestMessages(i18n.messages as any);

  return (
    <NextIntlClientProvider messages={nestedMessages as any} timeZone={i18n.timeZone} locale={normalized}>
      <StoreProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <div lang={normalized} dir={isRTL ? 'rtl' : 'ltr'} className={`${isRTL ? 'font-cairo' : 'font-inter'} antialiased`}>
              {children}
            </div>
          </ConfirmDialogProvider>
        </ToastProvider>
      </StoreProvider>
    </NextIntlClientProvider>
  );
}
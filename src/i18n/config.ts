import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['ar', 'en'] as const;

export default getRequestConfig(async ({ locale }) => {
  // Sanitize and tolerate invalid locales in dev: fallback to 'ar' instead of 404
  const raw = (locale ?? '').toString();
  const normalized = decodeURIComponent(raw).trim();
  const currentLocale = (locales.includes(normalized as any) ? normalized : 'ar') as string;

  // Convert flat dot-notation messages to nested structure before returning
  function nestMessages(input: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(input || {})) {
      const parts = key.split('.');
      let cur = out as Record<string, any>;
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

  const flat = (await import(`./messages/${currentLocale}.json`)).default as Record<string, any>;
  const messages = nestMessages(flat);

  return {
    locale: currentLocale,
    messages,
    timeZone: 'Asia/Riyadh'
  };
});
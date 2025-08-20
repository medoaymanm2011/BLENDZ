export const isRTL = (locale: string) => locale === 'ar';

export const textStart = (locale: string) => (isRTL(locale) ? 'text-right' : 'text-left');
export const textEnd = (locale: string) => (isRTL(locale) ? 'text-left' : 'text-right');
export const justifyItemsStart = (locale: string) => (isRTL(locale) ? 'justify-items-end' : 'justify-items-start');
export const justifyStart = (locale: string) => (isRTL(locale) ? 'justify-end' : 'justify-start');
export const floatStart = (locale: string) => (isRTL(locale) ? 'float-right' : 'float-left');
export const floatEnd = (locale: string) => (isRTL(locale) ? 'float-left' : 'float-right');

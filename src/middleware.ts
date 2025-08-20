import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales: Array.from(locales),

  // Used when no locale matches
  defaultLocale: 'ar'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
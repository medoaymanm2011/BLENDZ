import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vilainkids.com',
      },
      {
        protocol: 'https',
        hostname: 'vilainkids.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
    // Avoid server-side fetching of remote images in development to bypass DNS/network issues
    unoptimized: process.env.NODE_ENV === 'development'
  }
};

export default withNextIntl(nextConfig);

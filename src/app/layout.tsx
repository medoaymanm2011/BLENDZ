import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: {
    default: "BLENDZ",
    template: "%s | BLENDZ"
  },
  description:
    "متجرك المتكامل للمنتجات عالية الجودة في أسيوط. نوفر تشكيلة واسعة من المنتجات والملابس من أشهر الماركات العالمية مثل شيكو, بابلز, وسفاري.",
  icons: {
    icon: [
      { url: "/blendz-icon.svg?v=3", type: "image/svg+xml" }
    ],
    shortcut: [
      { url: "/blendz-icon.svg?v=3", type: "image/svg+xml" }
    ],
    other: [
      // Safari pinned tab
      { rel: "mask-icon", url: "/blendz-icon.svg?v=3", color: "#1d4ed8" }
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The i18n-aware layout at (i18n)/[locale]/layout.tsx sets lang/dir and wraps NextIntlClientProvider
  return (
    <html>
      <body className={`${inter.variable} ${cairo.variable}`}>
        {/* Facebook Pixel (optional) */}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
                s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
              }(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
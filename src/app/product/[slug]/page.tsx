import { redirect } from 'next/navigation';
import nextIntlConfig from '@/../next-intl.config';

export default async function ProductNoLocaleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (nextIntlConfig as any).defaultLocale || 'ar';
  redirect(`/${locale}/product/${encodeURIComponent(slug)}`);
}

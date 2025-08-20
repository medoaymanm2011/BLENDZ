"use client";

import Link, { LinkProps } from "next/link";
import { useLocale } from "next-intl";
import React from "react";

function isExternal(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

function withLocalePrefix(href: string, locale: string) {
  if (isExternal(href)) return href;
  // Normalize
  if (!href.startsWith("/")) href = "/" + href;

  // Already has a locale segment?
  const seg = href.split("/")[1];
  if (seg === "ar" || seg === "en") return href; // trust explicit locale

  return `/${locale}${href}`;
}

export type LocaleLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<LinkProps, "href"> & {
    href: string;
  };

export default function LocaleLink({ href, prefetch, ...rest }: LocaleLinkProps) {
  const locale = useLocale();
  const finalHref = withLocalePrefix(href, locale);
  return <Link href={finalHref} prefetch={prefetch} {...rest} />;
}

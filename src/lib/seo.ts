// ============================================================================
// Source: src/lib/seo.ts
// Version: 0.9.7 — 2026-09-08
// Why: Per-page metadata in one shape. Next inherits a parent's `openGraph`
//      wholesale, so a page that set only `title` kept the home page's og:title
//      — every secondary page shared it, and sharing /help showed the wrong
//      name. This builds both at once so they cannot diverge again.
// Env / Deps: lib/routes for the origin. Structured data is emitted by the
//      helpers here and rendered as a <script type="application/ld+json">.
// ============================================================================

import type { Metadata } from 'next';
import { SITE_ORIGIN } from './routes';

export const SITE_NAME = 'تقویم';
const PREVIEW = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'تقویم — روزها را بهتر ببین. تقویم ایرانی برای وب، با تاریخ شمسی، میلادی و قمری کنار هم.',
};

// `path` is the route this page lives at, and becomes both the canonical and
// the og:url. A canonical must be absolute and must point at the page itself.
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [PREVIEW],
    },
    twitter: { card: 'summary_large_image', title, description, images: [PREVIEW] },
  };
}

// Claimed on the home page. Deliberately no SearchAction: the site has no
// search, and describing one that does not exist is a lie to a crawler.
export function siteStructuredData(description: string): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: `${SITE_ORIGIN}/`,
        name: SITE_NAME,
        description,
        inLanguage: 'fa-IR',
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_ORIGIN}/#app`,
        url: `${SITE_ORIGIN}/`,
        name: SITE_NAME,
        description,
        inLanguage: 'fa-IR',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript.',
        // True and worth stating: no account, no payment, no advertising.
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'IRR' },
      },
    ],
  };
}

// Two levels only: this site has no nesting deeper than one page off the home.
export function breadcrumbStructuredData(name: string, path: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name, item: `${SITE_ORIGIN}${path}` },
    ],
  };
}

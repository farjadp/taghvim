// ============================================================================
// Source: src/lib/seo.test.ts
// Version: 0.9.7 — 2026-09-08
// Why: The og tags and the canonical are read by machines and nobody notices
//      when they are wrong. Every secondary page shared the home page's
//      og:title until 0.9.7, which is the failure these lock down.
// Env / Deps: Vitest.
// ============================================================================

import { describe, expect, it } from 'vitest';
import { ROUTES, SITE_ORIGIN } from './routes';
import { SITE_NAME, breadcrumbStructuredData, pageMetadata, siteStructuredData } from './seo';

const sample = { title: 'راهنما | تقویم', description: 'چطور از تقویم استفاده کنی.', path: '/help' };

describe('pageMetadata', () => {
  it('makes the canonical point at the page itself', () => {
    expect(pageMetadata(sample).alternates?.canonical).toBe('/help');
    expect(pageMetadata({ ...sample, path: '/' }).alternates?.canonical).toBe('/');
  });

  // The bug this file exists for: a page that set only `title` inherited the
  // parent's whole openGraph block, so every page shared one og:title.
  it('keeps og:title, twitter:title and the page title identical', () => {
    const meta = pageMetadata(sample);
    expect(meta.title).toBe(sample.title);
    expect(meta.openGraph?.title).toBe(sample.title);
    expect(meta.twitter?.title).toBe(sample.title);
    expect(meta.openGraph?.description).toBe(sample.description);
    expect(meta.twitter?.description).toBe(sample.description);
  });

  it('points og:url at the same path as the canonical', () => {
    const meta = pageMetadata(sample);
    expect((meta.openGraph as { url?: string }).url).toBe(sample.path);
  });

  it('carries the preview image at the size the tags claim', () => {
    const [image] = (pageMetadata(sample).openGraph as { images: { url: string; width: number; height: number; alt: string }[] }).images;
    expect(image.url).toBe('/og.png');
    expect(image.width).toBe(1200);
    expect(image.height).toBe(630);
    expect(image.alt.length).toBeGreaterThan(20);
  });

  it('builds for every public route without throwing', () => {
    for (const route of ROUTES) {
      expect(pageMetadata({ title: 't', description: 'd', path: route.path }).alternates?.canonical).toBe(route.path);
    }
  });
});

describe('structured data', () => {
  const site = siteStructuredData('توضیح') as { '@graph': { '@type': string; url: string }[] };

  it('describes the site and the app, both on the real origin', () => {
    expect(site['@graph'].map((node) => node['@type'])).toEqual(['WebSite', 'WebApplication']);
    for (const node of site['@graph']) expect(node.url).toBe(`${SITE_ORIGIN}/`);
  });

  // Claiming a SearchAction would tell Google about a search box that does not
  // exist. Keep it absent until there is one.
  it('claims no site search, because there is none', () => {
    expect(JSON.stringify(site)).not.toContain('SearchAction');
  });

  it('is serialisable, since it is inlined into the document', () => {
    expect(() => JSON.parse(JSON.stringify(site))).not.toThrow();
    expect(JSON.stringify(site)).not.toContain('</script>');
  });

  it('builds a two-level breadcrumb with absolute items', () => {
    const crumb = breadcrumbStructuredData('راهنما', '/help') as {
      itemListElement: { position: number; name: string; item: string }[];
    };
    expect(crumb.itemListElement).toHaveLength(2);
    expect(crumb.itemListElement[0]).toMatchObject({ position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` });
    expect(crumb.itemListElement[1]).toMatchObject({ position: 2, name: 'راهنما', item: `${SITE_ORIGIN}/help` });
  });
});

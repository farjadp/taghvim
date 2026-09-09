// ============================================================================
// Source: src/lib/routes.ts
// Version: 0.9.16 — 2026-09-09
// Why: The site's public routes in one place, so the sitemap cannot drift from
//      what actually ships. A unit test walks src/app and fails when a page
//      exists that this list does not name.
// Env / Deps: None. `SITE_ORIGIN` must match metadataBase in app/layout.tsx.
// ============================================================================

export const SITE_ORIGIN = 'https://taghv.im';

// `changeFrequency` is a hint, not a promise: the home page changes every day
// because the date does, the rest only when they are edited.
export const ROUTES = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/download', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/bridges', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/help', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/changelog', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.3 },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}>;

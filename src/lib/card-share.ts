// ============================================================================
// Source: src/lib/card-share.ts
// Version: 0.1.0 — 2026-11-20
// Why: Decides how the day card leaves the page and what the page may say about it.
//      Kept apart from the canvas so the branches can be tested with fakes. The rule:
//      never claim «saved» unless the browser download really ran. In the Android
//      app's WebView there is no navigator.share and a blob link is dropped, so the
//      only real route is the native share sheet; if that is missing the answer is
//      «unavailable», not a download that did nothing.
// Env / Deps: None. The caller supplies the four routes.
// ============================================================================

export type CardShareResult = 'shared' | 'opened' | 'saved' | 'cancelled' | 'unavailable';

export type CardRoutes = {
  canWebShare: boolean;
  webShare: () => Promise<void>;
  native: () => Promise<'shared' | 'unavailable'>;
  isNative: boolean;
  download: () => void;
};

// Order: the browser's own share sheet where it exists (site, iOS Safari), then the app's
// native sheet, then the blob download — which is skipped inside the app, where it is dead.
// A native failure rejects, so the caller shows an error rather than a false success.
export async function deliverCard(routes: CardRoutes): Promise<CardShareResult> {
  if (routes.canWebShare) {
    try {
      await routes.webShare();
      return 'shared';
    } catch (thrown) {
      // Dismissing the sheet is not a failure and must not be reported as one.
      if ((thrown as { name?: unknown } | null)?.name === 'AbortError') return 'cancelled';
      // Anything else falls through rather than leaving them with nothing.
    }
  }
  if ((await routes.native()) === 'shared') return 'opened';
  if (routes.isNative) return 'unavailable';
  routes.download();
  return 'saved';
}

// What the hero says afterwards. «opened» and «cancelled» say nothing: the sheet itself is the
// feedback, and we cannot know whether the person sent anything.
export function cardNote(result: CardShareResult): string {
  switch (result) {
    case 'saved': return 'تصویر ذخیره شد.';
    case 'shared': return 'تصویر فرستاده شد.';
    case 'unavailable': return 'فرستادن تصویر در این نسخهٔ برنامه ممکن نشد.';
    default: return '';
  }
}

export const CARD_FAILED_NOTE = 'تصویر ساخته یا فرستاده نشد.';

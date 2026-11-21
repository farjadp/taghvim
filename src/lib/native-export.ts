// ============================================================================
// Source: src/lib/native-export.ts
// Version: 0.1.0 — 2026-11-20
// Why: Hands a small text file (the .ics of «تاریخ‌های من») to the Android app's
//      native share sheet. The app is a WebView, and a WebView drops a blob: URL
//      clicked as `<a download>` without a word — so the export button did
//      nothing there. Inside the app the native side registers the FileExport
//      plugin; everywhere else (the site, the Chrome and Firefox extensions)
//      there is no Capacitor global and this answers 'unavailable', so the
//      caller keeps its blob download byte for byte. iOS has no native
//      implementation yet: its call rejects with code UNIMPLEMENTED, which is
//      also 'unavailable', so the iPhone app behaves as before.
//      A real native failure is NOT swallowed into the dead blob path: it
//      throws, and the caller shows a short Persian error.
//      Contract: FileExport.share({ fileName, mimeType, content }) resolves
//      { shared: boolean }; content is the UTF-8 text of the file.
//      Reads the global rather than importing @capacitor/core, like
//      widget-sync, so neither bundle grows.
// Env / Deps: None. The native bridge, when present.
// ============================================================================

export type NativeFile = { fileName: string; mimeType: string; content: string };

type FileExport = { share(file: NativeFile): Promise<{ shared: boolean }> };
type Bridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { FileExport?: FileExport };
  registerPlugin?: (name: string) => FileExport;
};

// 'shared' = the native sheet took over (even if the person then cancelled it).
// 'unavailable' = no native path here; use the browser download.
export async function exportFileNatively(file: NativeFile, host: unknown = globalThis): Promise<'shared' | 'unavailable'> {
  const capacitor = (host as { Capacitor?: Bridge }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return 'unavailable';
  const plugin = capacitor.Plugins?.FileExport ?? capacitor.registerPlugin?.('FileExport');
  if (!plugin) return 'unavailable';
  try {
    await plugin.share(file);
    return 'shared';
  } catch (thrown) {
    if ((thrown as { code?: unknown } | null)?.code === 'UNIMPLEMENTED') return 'unavailable';
    throw thrown;
  }
}

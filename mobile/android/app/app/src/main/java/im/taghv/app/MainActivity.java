// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/MainActivity.java
// Version: 0.4.0 — 2026-11-20
// Why: Capacitor's activity, plus three things. WidgetSyncPlugin is registered,
//      so the page can hand the widgets its groups and month names.
//      FileExportPlugin is registered, so the .ics of «تاریخ‌های من» reaches
//      the share sheet instead of a blob: link the WebView drops. And the
//      WebView's background before the page paints is the splash colour —
//      light paper, or dark paper in night mode — from res/values*/
//      splash_colors.xml; Capacitor's own backgroundColor is one fixed colour
//      and would flash a light frame before a dark calendar in night mode.
//      Once per process, cacheDir/exports/ is emptied, so the last .ics of
//      «تاریخ‌های من» — people's names — does not linger after the dates are
//      deleted. Cold start only, never onResume/onPause: the app picked in the
//      share sheet (a mail app, say) reads the file lazily after the chooser
//      returns, and a rotation recreates this activity in the same process.
// Env / Deps: Capacitor 8 BridgeActivity.
// ============================================================================

package im.taghv.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import im.taghv.app.export.ExportFiles;
import im.taghv.app.export.FileExportPlugin;
import im.taghv.app.widget.WidgetSyncPlugin;

public class MainActivity extends BridgeActivity {
    // Static, so it survives activity recreation and resets only with the process.
    private static boolean exportsCleared = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins must be registered before the bridge is created in super.onCreate.
        registerPlugin(WidgetSyncPlugin.class);
        registerPlugin(FileExportPlugin.class);
        super.onCreate(savedInstanceState);
        if (!exportsCleared) {
            exportsCleared = true;
            // On the main thread on purpose: the folder holds one small file at
            // most, so this is a listing and a delete, and doing it inline means it
            // cannot race a share the person starts right after launch.
            ExportFiles.INSTANCE.clear(getCacheDir());
        }
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(getColor(R.color.splash_background));
        }
    }
}

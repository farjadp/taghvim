// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/MainActivity.java
// Version: 0.2.0 — 2026-09-10
// Why: Capacitor's activity, plus two things. WidgetSyncPlugin is registered,
//      so the page can hand the widgets its groups and month names. And the
//      WebView's background before the page paints is the splash colour —
//      light paper, or dark paper in night mode — from res/values*/
//      splash_colors.xml; Capacitor's own backgroundColor is one fixed colour
//      and would flash a light frame before a dark calendar in night mode.
// Env / Deps: Capacitor 8 BridgeActivity.
// ============================================================================

package im.taghv.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import im.taghv.app.widget.WidgetSyncPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins must be registered before the bridge is created in super.onCreate.
        registerPlugin(WidgetSyncPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(getColor(R.color.splash_background));
        }
    }
}

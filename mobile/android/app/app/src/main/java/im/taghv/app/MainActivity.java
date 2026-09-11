// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/MainActivity.java
// Version: 0.1.0 — 2026-09-10
// Why: Capacitor's activity, plus one thing: the WebView's background before
//      the page paints is the splash colour — light paper, or dark paper in
//      night mode — read from res/values*/splash_colors.xml. Capacitor's own
//      backgroundColor setting is one fixed colour, which would flash a light
//      frame before a dark calendar on a phone in night mode.
// Env / Deps: Capacitor 8 BridgeActivity.
// ============================================================================

package im.taghv.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(getColor(R.color.splash_background));
        }
    }
}

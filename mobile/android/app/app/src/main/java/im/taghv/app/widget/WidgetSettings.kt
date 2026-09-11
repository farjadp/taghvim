// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/WidgetSettings.kt
// Version: 0.1.0 — 2026-09-10
// Why: The visitor's choices the widgets must follow — the three event groups
//      and the older month names — kept where a widget can read them. The page
//      keeps its own copy in the WebView's localStorage, which native code
//      cannot read, so the page sends them here through WidgetSyncPlugin every
//      time they change and once at start. Until it has, the widgets use the
//      site's defaults, «پیش‌فرض ایران عزیز»: religious and state off, world on.
// Env / Deps: SharedPreferences file «taghvim-widget», private to the app.
// ============================================================================

package im.taghv.app.widget

import android.content.Context
import im.taghv.core.EventGroups

data class WidgetSettings(val groups: EventGroups, val older: Boolean) {
    companion object {
        private const val FILE = "taghvim-widget"
        val DEFAULT = WidgetSettings(EventGroups.DEFAULT, older = false)

        fun read(context: Context): WidgetSettings {
            val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
            val d = DEFAULT.groups
            return WidgetSettings(
                EventGroups(
                    religious = prefs.getBoolean("religious", d.religious),
                    state = prefs.getBoolean("state", d.state),
                    world = prefs.getBoolean("world", d.world),
                ),
                older = prefs.getBoolean("avestan", DEFAULT.older),
            )
        }

        fun write(context: Context, settings: WidgetSettings) {
            context.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit()
                .putBoolean("religious", settings.groups.religious)
                .putBoolean("state", settings.groups.state)
                .putBoolean("world", settings.groups.world)
                .putBoolean("avestan", settings.older)
                .apply()
        }
    }
}

// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/WidgetSyncPlugin.kt
// Version: 0.1.0 — 2026-09-10
// Why: The one door from the page to the widgets. The page calls
//      WidgetSync.setView({religious, state, world, avestan}) — src/lib/
//      widget-sync.ts — and the widgets redraw with the same groups and month
//      names the calendar on screen uses. Nothing else crosses: not the
//      memorial switch, not personal dates. A missing field keeps the default.
// Env / Deps: Capacitor 8 plugin API; registered in MainActivity.
// ============================================================================

package im.taghv.app.widget

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import im.taghv.core.EventGroups

@CapacitorPlugin(name = "WidgetSync")
class WidgetSyncPlugin : Plugin() {
    @PluginMethod
    fun setView(call: PluginCall) {
        val d = WidgetSettings.DEFAULT
        val settings = WidgetSettings(
            EventGroups(
                religious = call.getBoolean("religious", d.groups.religious) ?: d.groups.religious,
                state = call.getBoolean("state", d.groups.state) ?: d.groups.state,
                world = call.getBoolean("world", d.groups.world) ?: d.groups.world,
            ),
            older = call.getBoolean("avestan", d.older) ?: d.older,
        )
        WidgetSettings.write(context, settings)
        TaghvimWidget.refreshAll(context)
        call.resolve()
    }
}

// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/Widgets.kt
// Version: 0.1.0 — 2026-09-10
// Why: The two widget providers and the receiver that turns their day.
//      Midnight: Android has no «the date changed» broadcast a manifest
//      receiver can rely on (DATE_CHANGED is not exempt), so each update
//      schedules an alarm one second past the next Tehran midnight with
//      setAndAllowWhileIdle — allowed in Doze, needing no exact-alarm
//      permission, which Play reserves for alarm clocks and calendars that send
//      event notifications. The price: under deep Doze it may fire late, and
//      the hourly updatePeriodMillis is the backstop. How late, on a real
//      phone, is Phase 2's open measurement.
// Env / Deps: AlarmManager; im.taghv.core.Today for the Tehran midnight.
// ============================================================================

package im.taghv.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import im.taghv.core.Today
import java.time.Instant

abstract class TaghvimWidget : AppWidgetProvider() {
    protected abstract fun render(context: Context, day: WidgetDay, options: Bundle?): RemoteViews

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        val day = WidgetDays.at(Instant.now(), WidgetDataStore.get(context))
        for (id in ids) manager.updateAppWidget(id, render(context, day, manager.getAppWidgetOptions(id)))
        DayTurnReceiver.schedule(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
        val day = WidgetDays.at(Instant.now(), WidgetDataStore.get(context))
        manager.updateAppWidget(id, render(context, day, options))
    }

    override fun onEnabled(context: Context) = DayTurnReceiver.schedule(context)

    companion object {
        private val PROVIDERS = listOf(SmallWidget::class.java to { SmallWidget() }, WideWidget::class.java to { WideWidget() })

        /** Redraws every placed widget of both kinds. */
        fun refreshAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            for ((type, make) in PROVIDERS) {
                val ids = manager.getAppWidgetIds(ComponentName(context, type))
                if (ids.isNotEmpty()) make().onUpdate(context, manager, ids)
            }
        }
    }
}

class SmallWidget : TaghvimWidget() {
    override fun render(context: Context, day: WidgetDay, options: Bundle?) = WidgetViews.small(context, day, options)
}

class WideWidget : TaghvimWidget() {
    override fun render(context: Context, day: WidgetDay, options: Bundle?) = WidgetViews.wide(context, day, options)
}

class DayTurnReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Midnight, a clock or zone change, a reboot, an app update: all mean «redraw and re-arm».
        TaghvimWidget.refreshAll(context)
        schedule(context)
    }

    companion object {
        private const val ACTION_DAY_TURN = "im.taghv.app.action.DAY_TURN"

        fun schedule(context: Context) {
            val alarms = context.getSystemService(AlarmManager::class.java) ?: return
            val intent = Intent(context, DayTurnReceiver::class.java).setAction(ACTION_DAY_TURN)
            val pending = PendingIntent.getBroadcast(
                context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
            // One second past midnight, so the Tehran clock is unambiguously on the new day.
            val at = Today.nextMidnight(Instant.now()).toEpochMilli() + 1_000
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending)
        }
    }
}

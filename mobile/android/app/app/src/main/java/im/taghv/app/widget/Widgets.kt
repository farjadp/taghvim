// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/Widgets.kt
// Version: 0.2.0 — 2026-10-10
// Why: The three widget providers (small, wide, and the month since 10 Oct)
//      and the receiver that turns their day.
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
    /** Lays out the widget for this instant; each kind reads only what it prints. */
    protected abstract fun render(context: Context, now: Instant, settings: WidgetSettings, options: Bundle?): RemoteViews

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        val settings = WidgetSettings.read(context)
        val now = Instant.now()
        for (id in ids) manager.updateAppWidget(id, render(context, now, settings, manager.getAppWidgetOptions(id)))
        DayTurnReceiver.schedule(context)
    }

    override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
        manager.updateAppWidget(id, render(context, Instant.now(), WidgetSettings.read(context), options))
    }

    override fun onEnabled(context: Context) = DayTurnReceiver.schedule(context)

    companion object {
        private val PROVIDERS = listOf(
            SmallWidget::class.java to { SmallWidget() },
            WideWidget::class.java to { WideWidget() },
            MonthWidget::class.java to { MonthWidget() },
        )

        /** Redraws every placed widget of every kind. */
        fun refreshAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            for ((type, make) in PROVIDERS) {
                val ids = manager.getAppWidgetIds(ComponentName(context, type))
                if (ids.isNotEmpty()) make().onUpdate(context, manager, ids)
            }
        }
    }
}

private fun day(context: Context, now: Instant, s: WidgetSettings) =
    WidgetDays.at(now, WidgetDataStore.get(context), s.groups, s.older)

class SmallWidget : TaghvimWidget() {
    override fun render(context: Context, now: Instant, settings: WidgetSettings, options: Bundle?) =
        WidgetViews.small(context, day(context, now, settings), options)
}

class WideWidget : TaghvimWidget() {
    override fun render(context: Context, now: Instant, settings: WidgetSettings, options: Bundle?) =
        WidgetViews.wide(context, day(context, now, settings), options)
}

class MonthWidget : TaghvimWidget() {
    override fun render(context: Context, now: Instant, settings: WidgetSettings, options: Bundle?) =
        WidgetViews.month(context, WidgetMonths.at(now, WidgetDataStore.get(context), settings.groups, settings.older), options)
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

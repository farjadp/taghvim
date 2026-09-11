// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/WidgetDay.kt
// Version: 0.1.0 — 2026-09-10
// Why: Everything a widget prints for one instant, decided in one place and
//      tested on the JVM, so the RemoteViews code only lays it out. The day is
//      the Tehran day. A day is «off» on Friday or when a visible row is a
//      holiday — the same rule that paints the site's grid in clay. A computed
//      lunar holiday is marked «(احتمالی)», because it may land a day off.
//      Outside the data file's years the date is still right (it is computed)
//      and no occasion is claimed.
// Env / Deps: im.taghv.core; widget-data.json from the app's assets.
// ============================================================================

package im.taghv.app.widget

import android.content.Context
import im.taghv.core.EventGroups
import im.taghv.core.Today
import im.taghv.core.WidgetData
import java.time.Instant

data class WidgetDay(
    val weekday: String,
    val day: Int,
    val month: String,
    val year: Int,
    val gregorian: String,
    val off: Boolean,
    val occasion: String?,
    val occasionIsHoliday: Boolean,
)

object WidgetDays {
    private val GREGORIAN_MONTHS = listOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    )

    fun at(instant: Instant, data: WidgetData, groups: EventGroups = EventGroups.DEFAULT): WidgetDay {
        val persian = Today.persian(instant)
        val gregorian = Today.gregorian(instant)
        val weekday = Today.weekdayIndex(instant)
        val events = if (data.covers(persian)) data.events(persian, groups) else emptyList()
        val first = events.firstOrNull()
        return WidgetDay(
            weekday = data.weekdays[weekday],
            day = persian.day,
            month = data.months[persian.month - 1],
            year = persian.year,
            gregorian = "${gregorian.day} ${GREGORIAN_MONTHS[gregorian.month - 1]} ${gregorian.year}",
            off = weekday == 6 || events.any { it.holiday },
            occasion = first?.let { if (it.uncertain) "${it.title} (احتمالی)" else it.title },
            occasionIsHoliday = first?.holiday == true,
        )
    }
}

/** Persian digits for display; the numbers themselves stay Latin everywhere else. */
fun fa(value: Int): String = value.toString().map { if (it in '0'..'9') '۰' + (it - '0') else it }.joinToString("")

/** The file is bundled with the app, so it is read once per process. */
object WidgetDataStore {
    @Volatile private var cached: WidgetData? = null

    fun get(context: Context): WidgetData =
        cached ?: synchronized(this) {
            cached ?: context.assets.open("widget-data.json").bufferedReader().use { WidgetData.parse(it.readText()) }
                .also { cached = it }
        }
}

// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/WidgetMonth.kt
// Version: 0.1.0 — 2026-10-10
// Why: Everything the month widget prints, decided here and tested on the JVM,
//      so the RemoteViews code only lays it out — the same split as WidgetDay.
//      The grid is the site's monthGrid: Saturday first, padded with the
//      neighbouring months to whole weeks, never fewer than five rows. A day is
//      «off» on Friday or when a visible row is a holiday, as on the grid.
//      Picked by Farjad on 10 Oct from a sandbox of three: A (the grid alone,
//      4×2) that becomes C (the grid and the month's next occasions) when the
//      widget is made one row taller.
// Env / Deps: im.taghv.core; java.time.
// ============================================================================

package im.taghv.app.widget

import im.taghv.core.EventGroups
import im.taghv.core.GregorianDate
import im.taghv.core.Jalali
import im.taghv.core.PersianDate
import im.taghv.core.Today
import im.taghv.core.WidgetData
import java.time.Instant
import java.time.LocalDate

data class MonthCell(
    val day: Int,
    val inMonth: Boolean,
    val today: Boolean,
    val off: Boolean,
    val occasion: Boolean,
)

data class MonthOccasion(val day: Int, val title: String, val holiday: Boolean)

data class WidgetMonth(
    val month: String,
    val year: Int,
    val weekday: String,
    val cells: List<MonthCell>,
    /** The month's occasions from today on, at most [WidgetMonths.UPCOMING]. */
    val upcoming: List<MonthOccasion>,
    /** The one sentence TalkBack reads: the month, then today as the small widget says it. */
    val spoken: String,
) {
    val rows: Int get() = cells.size / 7
}

object WidgetMonths {
    const val UPCOMING = 3

    fun at(instant: Instant, data: WidgetData, groups: EventGroups = EventGroups.DEFAULT, older: Boolean = false): WidgetMonth {
        val today = Today.persian(instant)
        val names = if (older) data.monthsOlder else data.months
        val first = PersianDate(today.year, today.month, 1)
        val length = Jalali.monthLength(today.year, today.month)
        val firstDay = Jalali.gregorian(first).let { LocalDate.of(it.year, it.month, it.day) }
        // java.time counts Monday 1 … Sunday 7; % 7 makes Sunday 0 as in JS, and + 1
        // shifts it to the Saturday-first week the site's monthGrid uses.
        val offset = (firstDay.dayOfWeek.value % 7 + 1) % 7
        val count = maxOf(35, (offset + length + 6) / 7 * 7)
        val cells = (0 until count).map { index ->
            val g = firstDay.plusDays((index - offset).toLong())
            val persian = Jalali.persian(GregorianDate(g.year, g.monthValue, g.dayOfMonth))
            val inMonth = persian.year == today.year && persian.month == today.month
            val events = if (inMonth && data.covers(persian)) data.events(persian, groups) else emptyList()
            MonthCell(
                day = persian.day,
                inMonth = inMonth,
                today = persian == today,
                off = inMonth && (index % 7 == 6 || events.any { it.holiday }),
                occasion = events.isNotEmpty(),
            )
        }
        val upcoming = (today.day..length).flatMap { day ->
            val date = PersianDate(today.year, today.month, day)
            if (!data.covers(date)) emptyList()
            else data.events(date, groups).map { MonthOccasion(day, if (it.uncertain) "${it.title} (احتمالی)" else it.title, it.holiday) }
        }.take(UPCOMING)
        val day = WidgetDays.at(instant, data, groups, older)
        return WidgetMonth(
            month = names[today.month - 1],
            year = today.year,
            weekday = day.weekday,
            cells = cells,
            upcoming = upcoming,
            spoken = "${names[today.month - 1]} ${fa(today.year)}؛ امروز ${day.spoken}",
        )
    }
}

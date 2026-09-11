// ============================================================================
// Source: mobile/android/core/src/main/kotlin/im/taghv/core/WidgetData.kt
// Version: 0.1.0 — 2026-09-10
// Why: Reads mobile/shared/widget-data.json and answers «what does this day
//      carry, for these groups». The filter is the one src/lib/widget-data.ts
//      names as the reference: `iran` always, the rest by their switch, and a
//      day is a holiday only when a visible row says so. Friday is off by
//      being Friday, as on the site; it is not in the file.
// Env / Deps: org.json — part of the Android framework; the JVM tests pull the
//      same API from the org.json artifact.
// ============================================================================

package im.taghv.core

import org.json.JSONArray
import org.json.JSONObject

enum class EventCategory { IRAN, STATE, RELIGIOUS, WORLD }

data class WidgetEvent(
    val title: String,
    val category: EventCategory,
    val holiday: Boolean,
    /** A computed lunar holiday that may land a day off the official one. */
    val uncertain: Boolean,
)

data class EventGroups(val religious: Boolean, val state: Boolean, val world: Boolean) {
    fun shows(category: EventCategory): Boolean = when (category) {
        EventCategory.IRAN -> true
        EventCategory.STATE -> state
        EventCategory.RELIGIOUS -> religious
        EventCategory.WORLD -> world
    }

    companion object {
        /** The site's default, «پیش‌فرض ایران عزیز»: religious and state off, world on. */
        val DEFAULT = EventGroups(religious = false, state = false, world = true)
    }
}

class UnsupportedWidgetDataException(version: Int) : Exception("widget-data.json version $version is not supported")

class WidgetData private constructor(
    val years: IntRange,
    val months: List<String>,
    val monthsOlder: List<String>,
    val weekdays: List<String>,
    val notice: String,
    private val days: Map<String, List<WidgetEvent>>,
) {
    /** Whether the file knows this year at all. Outside it, print the date only. */
    fun covers(date: PersianDate): Boolean = date.year in years

    fun events(on: PersianDate, groups: EventGroups): List<WidgetEvent> =
        days[on.key].orEmpty().filter { groups.shows(it.category) }

    fun isHoliday(on: PersianDate, groups: EventGroups): Boolean = events(on, groups).any { it.holiday }

    companion object {
        const val SUPPORTED_VERSION = 1

        fun parse(json: String): WidgetData {
            val root = JSONObject(json)
            val version = root.getInt("version")
            if (version != SUPPORTED_VERSION) throw UnsupportedWidgetDataException(version)
            val years = root.getJSONObject("years")
            val source = root.getJSONObject("days")
            val days = source.keys().asSequence().associateWith { key ->
                val rows = source.getJSONArray(key)
                // Each row is [title, category, holiday, uncertain].
                (0 until rows.length()).map { index ->
                    val row = rows.getJSONArray(index)
                    WidgetEvent(
                        title = row.getString(0),
                        category = EventCategory.valueOf(row.getString(1).uppercase()),
                        holiday = row.getInt(2) == 1,
                        uncertain = row.getInt(3) == 1,
                    )
                }
            }
            return WidgetData(
                years = years.getInt("from")..years.getInt("to"),
                months = root.getJSONArray("months").strings(),
                monthsOlder = root.getJSONArray("monthsOlder").strings(),
                weekdays = root.getJSONArray("weekdays").strings(),
                notice = root.getString("notice"),
                days = days,
            )
        }

        private fun JSONArray.strings(): List<String> = (0 until length()).map { getString(it) }
    }
}

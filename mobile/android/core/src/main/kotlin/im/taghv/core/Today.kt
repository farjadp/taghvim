// ============================================================================
// Source: mobile/android/core/src/main/kotlin/im/taghv/core/Today.kt
// Version: 0.1.0 — 2026-09-10
// Why: Which day it is, and when the next one starts — both on the Tehran clock,
//      never the phone's own zone, the rule calendar.ts keeps. The widget prints
//      the Iranian date, so it turns the page at midnight in Tehran wherever the
//      phone is. `nextMidnight` is what the widget schedules its update for.
// Env / Deps: java.time (API 26+, or desugaring). Zone rules come from the
//      device's tz data, which has carried Iran's end of DST since 2022b.
// ============================================================================

package im.taghv.core

import java.time.Instant
import java.time.ZoneId

object Today {
    val TEHRAN: ZoneId = ZoneId.of("Asia/Tehran")

    fun gregorian(at: Instant): GregorianDate {
        val local = at.atZone(TEHRAN).toLocalDate()
        return GregorianDate(local.year, local.monthValue, local.dayOfMonth)
    }

    fun persian(at: Instant): PersianDate = Jalali.persian(gregorian(at))

    /** Saturday-first, as the site's weekdayIndex: 0 is شنبه, 6 is جمعه. */
    fun weekdayIndex(at: Instant): Int {
        // java.time counts Monday as 1 and Sunday as 7; Saturday (6) must become 0.
        return (at.atZone(TEHRAN).dayOfWeek.value + 1) % 7
    }

    /** The first instant of the next Tehran day. */
    fun nextMidnight(after: Instant): Instant =
        after.atZone(TEHRAN).toLocalDate().plusDays(1).atStartOfDay(TEHRAN).toInstant()
}

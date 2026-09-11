// ============================================================================
// Source: mobile/android/core/src/test/kotlin/im/taghv/core/CoreTest.kt
// Version: 0.1.0 — 2026-09-10
// Why: Holds the Kotlin port to the site's own answers — the same vectors and
//      data file the Swift tests read, written by the web code. A pass here
//      means the Android widget and taghv.im name the same day.
// Env / Deps: JUnit 5, org.json. Reads ../../shared/*.json (the Gradle working
//      directory is the module, mobile/android/core).
// ============================================================================

package im.taghv.core

import java.io.File
import java.time.Instant
import java.time.LocalDate
import org.json.JSONObject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

private val shared = File("../../shared")

private fun gregorian(iso: String): GregorianDate {
    val date = LocalDate.parse(iso)
    return GregorianDate(date.year, date.monthValue, date.dayOfMonth)
}

class JalaliTest {
    private val vectors = JSONObject(File(shared, "jalali-vectors.json").readText())

    @Test
    fun everyConsecutiveDayMatchesTheSite() {
        val days = vectors.getJSONArray("days")
        var date = LocalDate.parse(vectors.getString("start"))
        for (index in 0 until days.length()) {
            val expected = days.getJSONArray(index)
            val g = GregorianDate(date.year, date.monthValue, date.dayOfMonth)
            val persian = Jalali.persian(g)
            assertEquals(PersianDate(expected.getInt(0), expected.getInt(1), expected.getInt(2)), persian, "$g")
            assertEquals(g, Jalali.gregorian(persian))
            date = date.plusDays(1)
        }
        assertTrue(days.length() > 9000)
    }

    @Test
    fun nowruzOfEverySupportedYearMatchesTheSite() {
        val nowruz = vectors.getJSONObject("nowruz")
        assertEquals(Jalali.SUPPORTED_YEARS.count(), nowruz.length())
        for (year in nowruz.keys()) {
            val date = PersianDate(year.toInt(), 1, 1)
            val iso = nowruz.getString(year)
            assertEquals(gregorian(iso), Jalali.gregorian(date), year)
            assertEquals(date, Jalali.persian(gregorian(iso)), year)
        }
    }

    @Test
    fun esfandLengthFollowsLeapYears() {
        // 1403 and 1408 are leap, 1404–1407 are not (checked against jalaali-js).
        assertEquals(30, Jalali.monthLength(1403, 12))
        assertEquals(29, Jalali.monthLength(1405, 12))
        assertEquals(30, Jalali.monthLength(1408, 12))
    }
}

class TodayTest {
    @Test
    fun theDayTurnsAtTehranMidnightNotTheDevicesOwn() {
        // Tehran is UTC+3:30 all year since 2022: 20:30 UTC is 00:00 in Tehran.
        val before = Instant.parse("2026-09-10T20:29:59Z")
        val after = Instant.parse("2026-09-10T20:30:00Z")
        assertEquals(Jalali.persian(GregorianDate(2026, 9, 10)), Today.persian(before))
        assertEquals(Jalali.persian(GregorianDate(2026, 9, 11)), Today.persian(after))
        assertEquals(after, Today.nextMidnight(before))
    }

    @Test
    fun weekdaysAreSaturdayFirst() {
        // 1 Farvardin 1406 is 21 March 2027, a Sunday — the site's example widget says یکشنبه.
        assertEquals(1, Today.weekdayIndex(Instant.parse("2027-03-21T08:00:00Z")))
        // 10 Sep 2026 is a Thursday.
        assertEquals(5, Today.weekdayIndex(Instant.parse("2026-09-10T08:00:00Z")))
    }
}

class WidgetDataTest {
    private val file = WidgetData.parse(File(shared, "widget-data.json").readText())

    @Test
    fun nowruzIsANationalHolidayUnderEveryGroupSetting() {
        val nowruz = PersianDate(1406, 1, 1)
        val none = EventGroups(religious = false, state = false, world = false)
        assertTrue(file.isHoliday(nowruz, none))
        assertTrue(file.events(nowruz, none).all { it.category == EventCategory.IRAN })
    }

    @Test
    fun hiddenGroupsContributeNoRowsAndNoHoliday() {
        // 1405-6-8 carries a religious holiday pinned to the official calendar.
        val day = PersianDate(1405, 6, 8)
        val on = EventGroups(religious = true, state = false, world = false)
        assertTrue(file.events(day, on).any { it.category == EventCategory.RELIGIOUS && !it.uncertain })
        assertFalse(file.events(day, EventGroups.DEFAULT).any { it.category == EventCategory.RELIGIOUS })
    }

    @Test
    fun theFileNamesItsWindow() {
        assertTrue(file.covers(PersianDate(1405, 6, 19)))
        assertFalse(file.covers(PersianDate(1410, 1, 1)))
        assertEquals("شنبه", file.weekdays.first())
    }
}

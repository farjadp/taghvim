// ============================================================================
// Source: mobile/android/app/app/src/test/java/im/taghv/app/widget/WidgetDaysTest.kt
// Version: 0.1.0 — 2026-09-10
// Why: What the widgets print, checked on the JVM against the same data file
//      the site's tests hold equal to eventsForDate: Nowruz is a day off with
//      its own title, a plain Friday is off with no occasion, a Thursday is not
//      off, and a year beyond the file still gets its date and no invented
//      «no occasion».
// Env / Deps: JUnit 4, org.json; reads ../../../shared/widget-data.json from
//      the module directory.
// ============================================================================

package im.taghv.app.widget

import im.taghv.core.EventCategory
import im.taghv.core.EventGroups
import im.taghv.core.PersianDate
import im.taghv.core.WidgetData
import java.io.File
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetDaysTest {
    private val data = WidgetData.parse(File("../../../shared/widget-data.json").readText())

    @Test
    fun nowruzIsADayOffWithItsOwnTitle() {
        // 1 Farvardin 1406 = 21 March 2027; 08:00 UTC is 11:30 in Tehran.
        val day = WidgetDays.at(Instant.parse("2027-03-21T08:00:00Z"), data)
        val expected = data.events(PersianDate(1406, 1, 1), EventGroups.DEFAULT).first { it.category == EventCategory.IRAN }
        assertEquals(1, day.day)
        assertEquals("فروردین", day.month)
        assertEquals("یکشنبه", day.weekday)
        assertTrue(day.off)
        assertEquals(expected.title, day.occasion)
        assertTrue(day.occasionIsHoliday)
    }

    @Test
    fun aPlainFridayIsOffWithNoOccasion() {
        // 3 Mehr 1405 = 25 Sep 2026, a Friday the file has no row for.
        val day = WidgetDays.at(Instant.parse("2026-09-25T08:00:00Z"), data)
        assertEquals("جمعه", day.weekday)
        assertTrue(day.off)
        assertNull(day.occasion)
        assertEquals("25 September 2026", day.gregorian)
    }

    @Test
    fun aThursdayIsNotOff() {
        val day = WidgetDays.at(Instant.parse("2026-09-10T08:00:00Z"), data)
        assertEquals("پنجشنبه", day.weekday)
        assertFalse(day.off)
    }

    @Test
    fun beyondTheFileTheDateIsStillRightAndNoOccasionIsClaimed() {
        // 1 Farvardin 1410 = 21 March 2031; Nowruz, but the file stops at 1407.
        val day = WidgetDays.at(Instant.parse("2031-03-21T08:00:00Z"), data)
        assertEquals(1410, day.year)
        assertEquals(1, day.day)
        assertNull(day.occasion)
    }

    @Test
    fun theVisitorsGroupsDecideWhatShowsAndWhatIsOff() {
        // 8 Shahrivar 1405 = 30 Aug 2026, a Sunday, with a religious holiday pinned to the official calendar.
        val instant = Instant.parse("2026-08-30T08:00:00Z")
        val hidden = WidgetDays.at(instant, data, EventGroups.DEFAULT)
        val shown = WidgetDays.at(instant, data, EventGroups(religious = true, state = false, world = true))
        assertFalse(hidden.off)
        assertTrue(shown.off)
        val religious = data.events(PersianDate(1405, 6, 8), EventGroups(religious = true, state = false, world = false))
            .first { it.category == EventCategory.RELIGIOUS }
        assertTrue(listOfNotNull(shown.occasion).isNotEmpty())
        assertFalse(hidden.occasion == religious.title)
    }

    @Test
    fun olderMonthNamesAreUsedWhenChosen() {
        // 10 Mordad 1405 = 1 Aug 2026.
        val instant = Instant.parse("2026-08-01T08:00:00Z")
        assertEquals("مرداد", WidgetDays.at(instant, data).month)
        assertEquals("امرداد", WidgetDays.at(instant, data, older = true).month)
    }

    @Test
    fun digitsArePersian() {
        assertEquals("۱۴۰۶", fa(1406))
        assertEquals("۲۰", fa(20))
    }
}

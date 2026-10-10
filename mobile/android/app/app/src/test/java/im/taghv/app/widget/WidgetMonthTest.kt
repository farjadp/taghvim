// ============================================================================
// Source: mobile/android/app/app/src/test/java/im/taghv/app/widget/WidgetMonthTest.kt
// Version: 0.1.0 — 2026-10-10
// Why: The month widget's grid, checked on the JVM against the site's own rules:
//      Saturday first, padded to whole weeks, six rows only when the month needs
//      them, Friday and holidays off, today marked once, and the occasion list
//      starting today and never longer than three.
// Env / Deps: JUnit 4, org.json; reads ../../../shared/widget-data.json.
// ============================================================================

package im.taghv.app.widget

import im.taghv.core.EventGroups
import im.taghv.core.WidgetData
import java.io.File
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetMonthTest {
    private val data = WidgetData.parse(File("../../../shared/widget-data.json").readText())

    @Test
    fun nowruzMonthStartsOnSundayWithFiveRows() {
        // 1 Farvardin 1406 is Sunday 21 March 2027: one padding day, 31 days, 35 cells.
        val month = WidgetMonths.at(Instant.parse("2027-03-21T08:00:00Z"), data)
        assertEquals(5, month.rows)
        assertEquals("فروردین", month.month)
        assertEquals(29, month.cells[0].day) // 29 Esfand 1405, the year's last day
        assertFalse(month.cells[0].inMonth)
        assertEquals(1, month.cells[1].day)
        assertTrue(month.cells[1].today)
        assertEquals(1, month.cells.count { it.today })
        // Nowruz days 1–4 and 13 are off; so is every Friday column.
        assertTrue((1..4).all { d -> month.cells.first { it.inMonth && it.day == d }.off })
        assertTrue(month.cells.first { it.inMonth && it.day == 13 }.off)
        assertTrue(month.cells.chunked(7).all { week -> week[6].off || !week[6].inMonth })
        assertFalse(month.cells.first { it.inMonth && it.day == 5 }.off) // Thursday, not a holiday
    }

    @Test
    fun abanNeedsSixRows() {
        // 1 Aban 1405 is a Friday: six padding days, 30 days, 42 cells.
        val month = WidgetMonths.at(Instant.parse("2026-10-23T08:00:00Z"), data)
        assertEquals("آبان", month.month)
        assertEquals(6, month.rows)
        assertEquals(1, month.cells[6].day)
        assertTrue(month.cells[6].inMonth)
    }

    @Test
    fun upcomingStartsTodayAndKeepsToThree() {
        // 10 Mehr 1405 carries Mehrgan; the list starts there, not on the 1st.
        val month = WidgetMonths.at(Instant.parse("2026-10-02T08:00:00Z"), data)
        assertTrue(month.upcoming.size <= WidgetMonths.UPCOMING)
        assertTrue(month.upcoming.all { it.day >= 10 })
        assertEquals("جشن مهرگان", month.upcoming.first().title)
        // With festivals switched off it is gone from the list and from the dots.
        val off = WidgetMonths.at(Instant.parse("2026-10-02T08:00:00Z"), data, EventGroups.DEFAULT.copy(festival = false))
        assertFalse(off.upcoming.any { it.title == "جشن مهرگان" })
    }

    @Test
    fun theOlderNamesAndTheSpokenSentence() {
        val month = WidgetMonths.at(Instant.parse("2026-08-01T08:00:00Z"), data, older = true)
        assertEquals("امرداد", month.month)
        assertTrue(month.spoken.startsWith("امرداد ۱۴۰۵؛ امروز "))
    }
}

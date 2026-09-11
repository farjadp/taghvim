// ============================================================================
// Source: mobile/android/core/src/main/kotlin/im/taghv/core/Jalali.kt
// Version: 0.1.0 — 2026-09-10
// Why: Gregorian ↔ Jalali, ported line for line from jalaali-js 2.0.1 — the
//      library the site uses — so the widget and the site agree on the day.
//      Kotlin's `/` and `%` on Int truncate toward zero exactly like
//      jalaali-js's `~~`-based div and mod, which is why they are used bare.
//      The Swift twin is mobile/ios/TaghvimCore/Sources/TaghvimCore/Jalali.swift;
//      both are tested against mobile/shared/jalali-vectors.json.
// Env / Deps: None.
// ============================================================================

package im.taghv.core

data class PersianDate(val year: Int, val month: Int, val day: Int) {
    /** The key widget-data.json uses: «year-month-day», no padding. */
    val key: String get() = "$year-$month-$day"
}

data class GregorianDate(val year: Int, val month: Int, val day: Int)

object Jalali {
    private val BREAKS = intArrayOf(
        -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
        1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
    )

    /** Same window the site enforces (calendar.ts). */
    val SUPPORTED_YEARS = 1200..1600

    fun persian(date: GregorianDate): PersianDate = d2j(g2d(date.year, date.month, date.day))

    fun gregorian(date: PersianDate): GregorianDate = d2g(j2d(date.year, date.month, date.day))

    fun isLeap(year: Int): Boolean = leap(year) == 0

    fun monthLength(year: Int, month: Int): Int = when {
        month <= 6 -> 31
        month <= 11 -> 30
        isLeap(year) -> 30
        else -> 29
    }

    // jalaali-js, ported

    private class Core(val gy: Int, val march: Int, val jump: Int, val n: Int)

    private fun core(jy: Int): Core {
        val gy = jy + 621
        var leapJ = -14
        var jp = BREAKS[0]
        var jump = 0
        for (index in 1 until BREAKS.size) {
            val jm = BREAKS[index]
            jump = jm - jp
            if (jy < jm) break
            leapJ += jump / 33 * 8 + (jump % 33) / 4
            jp = jm
        }
        val n = jy - jp
        leapJ += n / 33 * 8 + (n % 33 + 3) / 4
        if (jump % 33 == 4 && jump - n == 4) leapJ += 1
        val leapG = gy / 4 - (gy / 100 + 1) * 3 / 4 - 150
        return Core(gy, 20 + leapJ - leapG, jump, n)
    }

    private fun leapFromCycle(jump: Int, n: Int): Int {
        var adjusted = n
        if (jump - n < 6) adjusted = n - jump + (jump + 4) / 33 * 33
        var value = ((adjusted + 1) % 33 - 1) % 4
        if (value == -1) value = 4
        return value
    }

    private fun leap(jy: Int): Int {
        val c = core(jy)
        return leapFromCycle(c.jump, c.n)
    }

    private fun j2d(jy: Int, jm: Int, jd: Int): Int {
        val c = core(jy)
        return g2d(c.gy, 3, c.march) + (jm - 1) * 31 - jm / 7 * (jm - 7) + jd - 1
    }

    private fun d2j(jdn: Int): PersianDate {
        var jy = d2g(jdn).year - 621
        val c = core(jy)
        val leapYear = leapFromCycle(c.jump, c.n)
        var k = jdn - g2d(c.gy, 3, c.march)
        if (k >= 0) {
            if (k <= 185) return PersianDate(jy, 1 + k / 31, k % 31 + 1)
            k -= 186
        } else {
            jy -= 1
            k += 179
            if (leapYear == 1) k += 1
        }
        return PersianDate(jy, 7 + k / 30, k % 30 + 1)
    }

    private fun g2d(gy: Int, gm: Int, gd: Int): Int {
        var d = (gy + (gm - 8) / 6 + 100100) * 1461 / 4 + (153 * ((gm + 9) % 12) + 2) / 5 + gd - 34840408
        d = d - (gy + 100100 + (gm - 8) / 6) / 100 * 3 / 4 + 752
        return d
    }

    private fun d2g(jdn: Int): GregorianDate {
        var j = 4 * jdn + 139361631
        j = j + (4 * jdn + 183187720) / 146097 * 3 / 4 * 4 - 3908
        val i = (j % 1461) / 4 * 5 + 308
        val gd = (i % 153) / 5 + 1
        val gm = (i / 153) % 12 + 1
        val gy = j / 1461 - 100100 + (8 - gm) / 6
        return GregorianDate(gy, gm, gd)
    }
}

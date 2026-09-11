// ============================================================================
// Source: mobile/ios/TaghvimCore/Sources/TaghvimCore/Jalali.swift
// Version: 0.1.0 — 2026-09-10
// Why: Gregorian ↔ Jalali, ported line for line from jalaali-js 2.0.1 — the
//      library the site uses — so the widget and the site agree on the day.
//      Swift's `/` and `%` truncate toward zero exactly like jalaali-js's `~~`
//      based div and mod, which is why they are used bare here.
//      Tested against mobile/shared/jalali-vectors.json, written by the site's
//      own code; a disagreement fails `swift test`.
// Env / Deps: None.
// ============================================================================

public struct PersianDate: Equatable, Hashable, Sendable {
    public let year: Int
    public let month: Int
    public let day: Int

    public init(year: Int, month: Int, day: Int) {
        self.year = year
        self.month = month
        self.day = day
    }

    /// The key widget-data.json uses: «year-month-day», no padding.
    public var key: String { "\(year)-\(month)-\(day)" }
}

public struct GregorianDate: Equatable, Sendable {
    public let year: Int
    public let month: Int
    public let day: Int

    public init(year: Int, month: Int, day: Int) {
        self.year = year
        self.month = month
        self.day = day
    }
}

public enum Jalali {
    private static let breaks = [
        -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
        1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
    ]
    /// Same window the site enforces (calendar.ts): beyond it the answer is refused, not guessed.
    public static let supportedYears = 1200...1600

    public static func persian(from date: GregorianDate) -> PersianDate {
        d2j(g2d(date.year, date.month, date.day))
    }

    public static func gregorian(from date: PersianDate) -> GregorianDate {
        d2g(j2d(date.year, date.month, date.day))
    }

    public static func isLeap(_ year: Int) -> Bool { leap(year) == 0 }

    public static func monthLength(year: Int, month: Int) -> Int {
        if month <= 6 { return 31 }
        if month <= 11 { return 30 }
        return isLeap(year) ? 30 : 29
    }

    // MARK: jalaali-js, ported

    private static func core(_ jy: Int) -> (gy: Int, march: Int, jump: Int, n: Int) {
        let gy = jy + 621
        var leapJ = -14
        var jp = breaks[0]
        var jump = 0
        for index in 1..<breaks.count {
            let jm = breaks[index]
            jump = jm - jp
            if jy < jm { break }
            leapJ += jump / 33 * 8 + (jump % 33) / 4
            jp = jm
        }
        let n = jy - jp
        leapJ += n / 33 * 8 + (n % 33 + 3) / 4
        if jump % 33 == 4 && jump - n == 4 { leapJ += 1 }
        let leapG = gy / 4 - (gy / 100 + 1) * 3 / 4 - 150
        return (gy, 20 + leapJ - leapG, jump, n)
    }

    private static func leapFromCycle(jump: Int, n: Int) -> Int {
        var adjusted = n
        if jump - n < 6 { adjusted = n - jump + (jump + 4) / 33 * 33 }
        var value = ((adjusted + 1) % 33 - 1) % 4
        if value == -1 { value = 4 }
        return value
    }

    private static func leap(_ jy: Int) -> Int {
        let c = core(jy)
        return leapFromCycle(jump: c.jump, n: c.n)
    }

    private static func j2d(_ jy: Int, _ jm: Int, _ jd: Int) -> Int {
        let c = core(jy)
        return g2d(c.gy, 3, c.march) + (jm - 1) * 31 - jm / 7 * (jm - 7) + jd - 1
    }

    private static func d2j(_ jdn: Int) -> PersianDate {
        let gy = d2g(jdn).year
        var jy = gy - 621
        let c = core(jy)
        let isLeapYear = leapFromCycle(jump: c.jump, n: c.n)
        var k = jdn - g2d(c.gy, 3, c.march)
        if k >= 0 {
            if k <= 185 { return PersianDate(year: jy, month: 1 + k / 31, day: k % 31 + 1) }
            k -= 186
        } else {
            jy -= 1
            k += 179
            if isLeapYear == 1 { k += 1 }
        }
        return PersianDate(year: jy, month: 7 + k / 30, day: k % 30 + 1)
    }

    private static func g2d(_ gy: Int, _ gm: Int, _ gd: Int) -> Int {
        var d = (gy + (gm - 8) / 6 + 100100) * 1461 / 4 + (153 * ((gm + 9) % 12) + 2) / 5 + gd - 34840408
        d = d - (gy + 100100 + (gm - 8) / 6) / 100 * 3 / 4 + 752
        return d
    }

    private static func d2g(_ jdn: Int) -> GregorianDate {
        var j = 4 * jdn + 139361631
        j = j + (4 * jdn + 183187720) / 146097 * 3 / 4 * 4 - 3908
        let i = (j % 1461) / 4 * 5 + 308
        let gd = (i % 153) / 5 + 1
        let gm = (i / 153) % 12 + 1
        let gy = j / 1461 - 100100 + (8 - gm) / 6
        return GregorianDate(year: gy, month: gm, day: gd)
    }
}

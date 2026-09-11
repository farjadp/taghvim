// ============================================================================
// Source: mobile/ios/TaghvimCore/Sources/TaghvimCore/Today.swift
// Version: 0.1.0 — 2026-09-10
// Why: Which day it is, and when the next one starts — both on the Tehran clock,
//      never the phone's own zone, the same rule calendar.ts keeps. A widget in
//      Toronto still turns the page at midnight in Tehran, because the date it
//      prints is the Iranian date. `nextMidnight` is what the widget timeline is
//      built from: one entry per Tehran midnight.
// Env / Deps: Foundation. The zone comes from the system tz database, which has
//      carried Iran's end of daylight saving (2022) since tzdata 2022b.
// ============================================================================

import Foundation

public enum Today {
    public static let tehran = TimeZone(identifier: "Asia/Tehran")!

    private static var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = tehran
        return calendar
    }

    public static func persian(at instant: Date) -> PersianDate {
        let parts = calendar.dateComponents([.year, .month, .day], from: instant)
        return Jalali.persian(from: GregorianDate(year: parts.year!, month: parts.month!, day: parts.day!))
    }

    public static func gregorian(at instant: Date) -> GregorianDate {
        let parts = calendar.dateComponents([.year, .month, .day], from: instant)
        return GregorianDate(year: parts.year!, month: parts.month!, day: parts.day!)
    }

    /// Saturday-first, as the site's weekdayIndex: 0 is شنبه, 6 is جمعه.
    public static func weekdayIndex(at instant: Date) -> Int {
        // Foundation counts Sunday as 1 and Saturday as 7.
        calendar.component(.weekday, from: instant) % 7
    }

    /// The first instant of the next Tehran day.
    public static func nextMidnight(after instant: Date) -> Date {
        let start = calendar.startOfDay(for: instant)
        return calendar.date(byAdding: .day, value: 1, to: start)!
    }
}

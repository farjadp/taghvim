// ============================================================================
// Source: mobile/ios/TaghvimCore/Sources/TaghvimCore/WidgetDay.swift
// Version: 0.1.0 — 2026-09-11
// Why: Everything an iPhone widget prints for one instant, decided in one place
//      and tested on the Mac — the twin of the Android app's WidgetDays. The day
//      is the Tehran day. A day is «off» on Friday or when a visible row is a
//      holiday, the rule that paints the site's grid in clay. A computed lunar
//      holiday is marked «(احتمالی)». Beyond the data file's years the date is
//      still right (it is computed) and no occasion is claimed.
// Env / Deps: Jalali, Today, WidgetData in this package.
// ============================================================================

import Foundation

public struct WidgetDay: Equatable, Sendable {
    public let weekday: String
    public let day: Int
    public let month: String
    public let year: Int
    public let gregorian: String
    public let off: Bool
    public let occasion: String?
    public let occasionIsHoliday: Bool

    private static let gregorianMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

    /// `older` swaps in the older month names (امرداد، سپندارمذ) when the visitor chose them.
    public static func at(_ instant: Date, data: WidgetData, groups: EventGroups = .default, older: Bool = false) -> WidgetDay {
        let persian = Today.persian(at: instant)
        let gregorian = Today.gregorian(at: instant)
        let weekday = Today.weekdayIndex(at: instant)
        let events = data.covers(persian) ? data.events(on: persian, groups: groups) : []
        let first = events.first
        let months = older ? data.monthsOlder : data.months
        return WidgetDay(
            weekday: data.weekdays[weekday],
            day: persian.day,
            month: months[persian.month - 1],
            year: persian.year,
            gregorian: "\(gregorian.day) \(gregorianMonths[gregorian.month - 1]) \(gregorian.year)",
            off: weekday == 6 || events.contains { $0.holiday },
            occasion: first.map { $0.uncertain ? "\($0.title) (احتمالی)" : $0.title },
            occasionIsHoliday: first?.holiday ?? false
        )
    }
}

/// Persian digits for display; the numbers themselves stay Latin everywhere else.
public func fa(_ value: Int) -> String {
    let digits = Array("۰۱۲۳۴۵۶۷۸۹")
    return String(String(value).map { character in
        guard character.isASCII, let digit = character.wholeNumberValue else { return character }
        return digits[digit]
    })
}

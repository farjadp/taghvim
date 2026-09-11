// ============================================================================
// Source: mobile/ios/TaghvimCore/Sources/TaghvimCore/WidgetData.swift
// Version: 0.1.0 — 2026-09-10
// Why: Reads mobile/shared/widget-data.json and answers «what does this day
//      carry, for these groups». The filter is the one src/lib/widget-data.ts
//      names as the reference: `iran` always, the rest by their switch, and a
//      day is a holiday only when a visible row says so. Friday is off by
//      being Friday, as on the site; it is not in the file.
// Env / Deps: Foundation. The JSON is bundled into the app and widget targets.
// ============================================================================

import Foundation

public enum EventCategory: String, Decodable, Sendable {
    case iran, state, religious, world
}

public struct WidgetEvent: Decodable, Equatable, Sendable {
    public let title: String
    public let category: EventCategory
    public let holiday: Bool
    /// A computed lunar holiday that may land a day off the official one.
    public let uncertain: Bool

    public init(from decoder: Decoder) throws {
        // Stored as a four-item array to keep the file small: [title, category, holiday, uncertain].
        var row = try decoder.unkeyedContainer()
        title = try row.decode(String.self)
        category = try row.decode(EventCategory.self)
        holiday = try row.decode(Int.self) == 1
        uncertain = try row.decode(Int.self) == 1
    }
}

public struct EventGroups: Equatable, Sendable {
    public var religious: Bool
    public var state: Bool
    public var world: Bool

    /// The site's default, «پیش‌فرض ایران عزیز»: religious and state off, world on.
    public static let `default` = EventGroups(religious: false, state: false, world: true)

    public init(religious: Bool, state: Bool, world: Bool) {
        self.religious = religious
        self.state = state
        self.world = world
    }

    func shows(_ category: EventCategory) -> Bool {
        switch category {
        case .iran: return true
        case .state: return state
        case .religious: return religious
        case .world: return world
        }
    }
}

public struct WidgetData: Decodable, Sendable {
    public static let supportedVersion = 1

    public struct Years: Decodable, Sendable {
        public let from: Int
        public let to: Int
    }

    public let version: Int
    public let years: Years
    public let months: [String]
    public let monthsOlder: [String]
    public let weekdays: [String]
    public let notice: String
    public let days: [String: [WidgetEvent]]

    public enum LoadError: Error { case unsupportedVersion(Int) }

    public static func load(_ data: Data) throws -> WidgetData {
        let file = try JSONDecoder().decode(WidgetData.self, from: data)
        guard file.version == supportedVersion else { throw LoadError.unsupportedVersion(file.version) }
        return file
    }

    /// Whether the file knows this year at all. Outside it the widget still prints
    /// the date — the conversion needs no data — but must not claim «no occasion».
    public func covers(_ date: PersianDate) -> Bool {
        (years.from...years.to).contains(date.year)
    }

    public func events(on date: PersianDate, groups: EventGroups) -> [WidgetEvent] {
        (days[date.key] ?? []).filter { groups.shows($0.category) }
    }

    public func isHoliday(on date: PersianDate, groups: EventGroups) -> Bool {
        events(on: date, groups: groups).contains { $0.holiday }
    }
}

// ============================================================================
// Source: mobile/ios/TaghvimCore/Tests/TaghvimCoreTests/TaghvimCoreTests.swift
// Version: 0.1.0 — 2026-09-10
// Why: Holds the Swift port to the site's own answers. The vectors and the
//      widget data are written by the web code (npm run build:widget-data), so
//      a pass here means the widget and taghv.im name the same day.
// Env / Deps: Reads ../../../shared/*.json relative to this file. `swift test`.
// ============================================================================

import Foundation
import XCTest
@testable import TaghvimCore

private let shared = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()
    .appendingPathComponent("../../../../shared")
    .standardized

private struct Vectors: Decodable {
    let start: String
    let days: [[Int]]
    let nowruz: [String: String]
}

private func gregorian(_ iso: String) -> GregorianDate {
    let parts = iso.split(separator: "-").map { Int($0)! }
    return GregorianDate(year: parts[0], month: parts[1], day: parts[2])
}

private func utc(_ iso: String) -> Date {
    ISO8601DateFormatter().date(from: iso)!
}

final class JalaliTests: XCTestCase {
    private var vectors: Vectors!

    override func setUpWithError() throws {
        let data = try Data(contentsOf: shared.appendingPathComponent("jalali-vectors.json"))
        vectors = try JSONDecoder().decode(Vectors.self, from: data)
    }

    func testEveryConsecutiveDayMatchesTheSite() throws {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let start = gregorian(vectors.start)
        var day = calendar.date(from: DateComponents(year: start.year, month: start.month, day: start.day, hour: 12))!
        for expected in vectors.days {
            let parts = calendar.dateComponents([.year, .month, .day], from: day)
            let g = GregorianDate(year: parts.year!, month: parts.month!, day: parts.day!)
            let persian = Jalali.persian(from: g)
            XCTAssertEqual([persian.year, persian.month, persian.day], expected, "\(g)")
            XCTAssertEqual(Jalali.gregorian(from: persian), g)
            day = calendar.date(byAdding: .day, value: 1, to: day)!
        }
        XCTAssertGreaterThan(vectors.days.count, 9000)
    }

    func testNowruzOfEverySupportedYearMatchesTheSite() {
        XCTAssertEqual(vectors.nowruz.count, Jalali.supportedYears.count)
        for (year, iso) in vectors.nowruz {
            let date = PersianDate(year: Int(year)!, month: 1, day: 1)
            XCTAssertEqual(Jalali.gregorian(from: date), gregorian(iso), year)
            XCTAssertEqual(Jalali.persian(from: gregorian(iso)), date, year)
        }
    }

    func testEsfandLengthFollowsLeapYears() {
        // 1403 and 1408 are leap, 1404–1407 are not (checked against jalaali-js).
        XCTAssertEqual(Jalali.monthLength(year: 1403, month: 12), 30)
        XCTAssertEqual(Jalali.monthLength(year: 1405, month: 12), 29)
        XCTAssertEqual(Jalali.monthLength(year: 1408, month: 12), 30)
    }
}

final class TodayTests: XCTestCase {
    func testTheDayTurnsAtTehranMidnightNotTheDevicesOwn() {
        // Tehran is UTC+3:30 all year since 2022: 20:30 UTC is 00:00 in Tehran.
        let before = utc("2026-09-10T20:29:59Z")
        let after = utc("2026-09-10T20:30:00Z")
        XCTAssertEqual(Today.persian(at: before), Jalali.persian(from: GregorianDate(year: 2026, month: 9, day: 10)))
        XCTAssertEqual(Today.persian(at: after), Jalali.persian(from: GregorianDate(year: 2026, month: 9, day: 11)))
        XCTAssertEqual(Today.nextMidnight(after: before), after)
    }

    func testWeekdaysAreSaturdayFirst() {
        // 1 Farvardin 1406 is 21 March 2027, a Sunday — the site's example widget says یکشنبه.
        XCTAssertEqual(Today.weekdayIndex(at: utc("2027-03-21T08:00:00Z")), 1)
        // 10 Sep 2026 is a Thursday.
        XCTAssertEqual(Today.weekdayIndex(at: utc("2026-09-10T08:00:00Z")), 5)
    }
}

final class WidgetDataTests: XCTestCase {
    private var file: WidgetData!

    override func setUpWithError() throws {
        file = try WidgetData.load(Data(contentsOf: shared.appendingPathComponent("widget-data.json")))
    }

    func testNowruzIsANationalHolidayUnderEveryGroupSetting() {
        let nowruz = PersianDate(year: 1406, month: 1, day: 1)
        let none = EventGroups(religious: false, state: false, world: false)
        XCTAssertTrue(file.isHoliday(on: nowruz, groups: none))
        XCTAssertTrue(file.events(on: nowruz, groups: none).allSatisfy { $0.category == .iran })
    }

    func testHiddenGroupsContributeNoRowsAndNoHoliday() {
        // 1405-6-8 carries a religious holiday pinned to the official calendar.
        let day = PersianDate(year: 1405, month: 6, day: 8)
        let on = EventGroups(religious: true, state: false, world: false)
        XCTAssertTrue(file.events(on: day, groups: on).contains { $0.category == .religious && !$0.uncertain })
        XCTAssertFalse(file.events(on: day, groups: .default).contains { $0.category == .religious })
    }

    func testTheFileNamesItsWindow() {
        XCTAssertTrue(file.covers(PersianDate(year: 1405, month: 6, day: 19)))
        XCTAssertFalse(file.covers(PersianDate(year: 1410, month: 1, day: 1)))
        XCTAssertEqual(file.weekdays.first, "شنبه")
    }
}

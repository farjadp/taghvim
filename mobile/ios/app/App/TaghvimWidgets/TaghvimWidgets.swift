// ============================================================================
// Source: mobile/ios/app/App/TaghvimWidgets/TaghvimWidgets.swift
// Version: 0.1.0 — 2026-09-11
// Why: The iPhone widgets. Two, as picked on 10 Sep: small B on the home screen
//      and C on the lock screen (rectangular, plus the one-line inline form).
//      The timeline carries one entry now and one a second past each of the
//      next seven Tehran midnights — WidgetKit's documented way for a widget
//      whose reload points are known — then asks for a new one. The day is the
//      Tehran day; the groups and month names come from the app through the
//      App Group, written by WidgetSyncPlugin. The placeholder carries no date:
//      the Android build once showed Nowruz on a Friday in Shahrivar.
// Env / Deps: WidgetKit, SwiftUI, TaghvimCore; widget-data.json in the bundle.
// ============================================================================

import SwiftUI
import TaghvimCore
import WidgetKit

enum WidgetStore {
    static let appGroup = "group.im.taghv.app"

    static let data: WidgetData? = {
        guard let url = Bundle.main.url(forResource: "widget-data", withExtension: "json"),
              let bytes = try? Data(contentsOf: url) else { return nil }
        return try? WidgetData.load(bytes)
    }()

    private static var defaults: UserDefaults? { UserDefaults(suiteName: appGroup) }

    /// The app's view settings, or the site's defaults until the app has sent them.
    static var groups: EventGroups {
        let d = EventGroups.default
        guard let defaults else { return d }
        func flag(_ key: String, _ fallback: Bool) -> Bool { defaults.object(forKey: key) as? Bool ?? fallback }
        return EventGroups(religious: flag("religious", d.religious), state: flag("state", d.state), world: flag("world", d.world))
    }

    static var older: Bool { defaults?.bool(forKey: "avestan") ?? false }
}

struct DayEntry: TimelineEntry {
    let date: Date
    /// nil when there is nothing true to show yet — the placeholder, or a missing data file.
    let day: WidgetDay?
}

struct DayProvider: TimelineProvider {
    func placeholder(in context: Context) -> DayEntry { DayEntry(date: Date(), day: nil) }

    func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
        completion(entry(at: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
        var entries = [entry(at: Date())]
        var cursor = Date()
        for _ in 0..<7 {
            // One second past midnight, so the Tehran clock is unambiguously on the new day.
            cursor = Today.nextMidnight(after: cursor).addingTimeInterval(1)
            entries.append(entry(at: cursor))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(at instant: Date) -> DayEntry {
        DayEntry(date: instant, day: WidgetStore.data.map {
            WidgetDay.at(instant, data: $0, groups: WidgetStore.groups, older: WidgetStore.older)
        })
    }
}

struct SmallWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TaghvimSmall", provider: DayProvider()) { entry in
            SmallView(day: entry.day)
        }
        .configurationDisplayName("تقویم — کوچک")
        .description("روز هفته، روز و ماه")
        .supportedFamilies([.systemSmall])
    }
}

struct LockWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TaghvimLock", provider: DayProvider()) { entry in
            LockView(day: entry.day)
        }
        .configurationDisplayName("تقویم — صفحهٔ قفل")
        .description("تاریخ و مناسبت، زیر ساعت")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

@main
struct TaghvimWidgets: WidgetBundle {
    var body: some Widget {
        SmallWidget()
        LockWidget()
    }
}

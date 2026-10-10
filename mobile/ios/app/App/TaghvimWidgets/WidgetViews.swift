// ============================================================================
// Source: mobile/ios/app/App/TaghvimWidgets/WidgetViews.swift
// Version: 0.3.0 — 2026-10-09
// Why: The designs Farjad picked, drawn in SwiftUI: small B (weekday, the
//      numeral, the month), wide B (since 9 Oct, the Android widget ported
//      after «ویجت‌ها خیلی محدوده» on X: a forest block with the numeral and
//      month, clay on a day off, then «weekday year» and the first occasion) and lock-screen C (the numeral beside month and year
//      in a translucent box, the occasion or weekday under them; one line in
//      the inline form). Colours are the site's tokens with their dark
//      counterparts — keep them equal to src/app/globals.css. The numeral is
//      clay on a day off. System font, as on Android. Right to left always,
//      whatever the phone's language. Each widget is one VoiceOver element
//      reading `day.spoken`, not the bare numeral and month.
// Env / Deps: SwiftUI, WidgetKit, TaghvimCore.
// ============================================================================

import SwiftUI
import TaghvimCore
import WidgetKit

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xff) / 255, green: CGFloat((hex >> 8) & 0xff) / 255, blue: CGFloat(hex & 0xff) / 255, alpha: 1)
    }
}

enum Palette {
    private static func token(_ light: UInt32, _ dark: UInt32) -> Color {
        Color(UIColor { $0.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light) })
    }
    static let surface = token(0xffffff, 0x1a2420) // --color-surface
    static let ink = token(0x243e34, 0xe6ece8)     // --color-ink
    static let muted = token(0x5c6a61, 0x9fb0a6)   // --color-muted
    static let forest = token(0x214f40, 0x8cc7ad)  // --color-forest
    static let clay = token(0xa9503b, 0xe39a85)    // --color-clay
    static let paper = token(0xf7f8f4, 0x121a16)   // --color-paper: text on the block
}

private extension View {
    /// One VoiceOver element for the whole widget, reading the day's sentence.
    @ViewBuilder func spoken(_ day: WidgetDay?) -> some View {
        if let day {
            accessibilityElement(children: .ignore).accessibilityLabel(day.spoken)
        } else {
            self
        }
    }

    /// iOS 17 wants the background declared as the widget's container; 16 draws it.
    @ViewBuilder func widgetBackground<Background: View>(@ViewBuilder _ background: () -> Background) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget, content: background)
        } else {
            self.background(background())
        }
    }
}

// Small B — home screen.
struct SmallView: View {
    let day: WidgetDay?

    var body: some View {
        Group {
            if let day {
                VStack(spacing: 2) {
                    Text(day.weekday).font(.system(size: 14)).foregroundStyle(Palette.muted)
                    Text(fa(day.day))
                        .font(.system(size: 60, weight: .heavy))
                        .foregroundStyle(day.off ? Palette.clay : Palette.forest)
                        .minimumScaleFactor(0.6)
                    Text(day.month).font(.system(size: 16, weight: .medium)).foregroundStyle(Palette.ink)
                }
                .lineLimit(1)
            } else {
                // No date to show yet: the card and the name, nothing to misread.
                Text("تقویم").font(.system(size: 18, weight: .heavy)).foregroundStyle(Palette.forest)
            }
        }
        .spoken(day)
        .environment(\.layoutDirection, .rightToLeft)
        .widgetBackground { Palette.surface }
    }
}

// Wide B — home screen, medium. Same proportions as Android's 4×1: the block is about
// a quarter of the width and sits on the right, because the layout is right to left.
struct MediumView: View {
    let day: WidgetDay?

    var body: some View {
        Group {
            if let day {
                HStack(spacing: 0) {
                    VStack(spacing: 2) {
                        Text(fa(day.day))
                            .font(.system(size: 48, weight: .heavy))
                            .minimumScaleFactor(0.6)
                        Text(day.month).font(.system(size: 15, weight: .medium))
                    }
                    .lineLimit(1)
                    .foregroundStyle(Palette.paper)
                    .frame(width: 104)
                    .frame(maxHeight: .infinity)
                    .background(day.off ? Palette.clay : Palette.forest)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(day.weekday) \(fa(day.year))")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(Palette.ink)
                            .lineLimit(1)
                        // The occasion, clay when it is a holiday; with none, the Gregorian
                        // date, isolated left to right so its digits keep their order.
                        if let occasion = day.occasion {
                            Text(occasion)
                                .font(.system(size: 14))
                                .foregroundStyle(day.occasionIsHoliday ? Palette.clay : Palette.muted)
                                .lineLimit(2)
                        } else {
                            Text("\u{2066}\(day.gregorian)\u{2069}")
                                .font(.system(size: 14))
                                .foregroundStyle(Palette.muted)
                                .lineLimit(1)
                        }
                    }
                    .padding(.horizontal, 16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                Text("تقویم").font(.system(size: 18, weight: .heavy)).foregroundStyle(Palette.forest)
            }
        }
        .spoken(day)
        .environment(\.layoutDirection, .rightToLeft)
        .widgetBackground { Palette.surface }
    }
}

// Lock screen C — rectangular, and the inline line above the clock.
struct LockView: View {
    @Environment(\.widgetFamily) private var family
    let day: WidgetDay?

    var body: some View {
        Group {
            if family == .accessoryInline {
                Text(day.map { "\(fa($0.day)) \($0.month) \(fa($0.year))" } ?? "تقویم")
            } else if let day {
                HStack(spacing: 8) {
                    Text(fa(day.day)).font(.system(size: 30, weight: .heavy)).minimumScaleFactor(0.7)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("\(day.month) \(fa(day.year))").font(.system(size: 14, weight: .bold))
                        Text(day.occasion ?? day.weekday).font(.system(size: 12)).opacity(0.8)
                    }
                    .lineLimit(1)
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 8)
            } else {
                Text("تقویم").font(.system(size: 14, weight: .bold))
            }
        }
        .spoken(day)
        .environment(\.layoutDirection, .rightToLeft)
        .widgetBackground { AccessoryWidgetBackground() }
    }
}

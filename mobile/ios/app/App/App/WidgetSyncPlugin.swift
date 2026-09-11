// ============================================================================
// Source: mobile/ios/app/App/App/WidgetSyncPlugin.swift
// Version: 0.1.0 — 2026-09-11
// Why: The page's one door to the iPhone widgets — the twin of the Android
//      WidgetSyncPlugin, with the same JS name, so src/lib/widget-sync.ts works
//      unchanged. setView({religious, state, world, avestan}) writes the four
//      settings into the App Group and asks WidgetKit to redraw. Nothing else
//      crosses: not the memorial switch, not personal dates. A missing field
//      keeps the site's default.
// Env / Deps: Capacitor 8, WidgetKit; App Group group.im.taghv.app.
// ============================================================================

import Capacitor
import Foundation
import WidgetKit

@objc(WidgetSyncPlugin)
public class WidgetSyncPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetSyncPlugin"
    public let jsName = "WidgetSync"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setView", returnType: CAPPluginReturnPromise),
    ]

    @objc func setView(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: "group.im.taghv.app") else {
            call.reject("App Group is not available")
            return
        }
        // The site's defaults, «پیش‌فرض ایران عزیز»: religious and state off, world on.
        defaults.set(call.getBool("religious") ?? false, forKey: "religious")
        defaults.set(call.getBool("state") ?? false, forKey: "state")
        defaults.set(call.getBool("world") ?? true, forKey: "world")
        defaults.set(call.getBool("avestan") ?? false, forKey: "avestan")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}

// ============================================================================
// Source: mobile/ios/app/App/App/MainViewController.swift
// Version: 0.1.0 — 2026-09-11
// Why: Capacitor's view controller, plus the one local plugin: the app's own
//      WidgetSyncPlugin is not an npm package, so it is registered here, where
//      Capacitor 8 expects local plugins to be registered.
// Env / Deps: Capacitor 8.
// ============================================================================

import Capacitor
import UIKit

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetSyncPlugin())
    }
}

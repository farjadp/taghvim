// ============================================================================
// Source: mobile/ios/app/App/App/MainViewController.swift
// Version: 0.2.0 — 2026-10-06
// Why: Capacitor's view controller, plus the one local plugin: the app's own
//      WidgetSyncPlugin is not an npm package, so it is registered here, where
//      Capacitor 8 expects local plugins to be registered. It also puts a
//      backdrop behind the status bar: with contentInset "always" the page
//      starts below it, but scrolled content slid underneath with nothing
//      behind the clock and battery icons. The backdrop takes the page's own
//      background colour, so it follows the in-app theme, not only the system's,
//      and so does the strip behind the home indicator.
// Env / Deps: Capacitor 8, iOS 15+ (WKWebView.underPageBackgroundColor).
// ============================================================================

import Capacitor
import UIKit
import WebKit

class MainViewController: CAPBridgeViewController {
    private let statusBarBackdrop = UIView()
    private var pageColorObservation: NSKeyValueObservation?

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetSyncPlugin())
        installStatusBarBackdrop()
    }

    // From the top of the screen to the top of the safe area: exactly the
    // status bar's strip, on every iPhone shape, in either orientation.
    private func installStatusBarBackdrop() {
        guard let webView = webView else { return }
        statusBarBackdrop.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusBarBackdrop)
        NSLayoutConstraint.activate([
            statusBarBackdrop.topAnchor.constraint(equalTo: view.topAnchor),
            statusBarBackdrop.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            statusBarBackdrop.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            statusBarBackdrop.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
        ])
        // WebKit samples the page's background into underPageBackgroundColor and
        // announces each change through KVO, so a theme switch inside the app
        // (data-theme on <html>) repaints the strip without any JavaScript.
        pageColorObservation = webView.observe(\.underPageBackgroundColor, options: [.initial, .new]) { [weak self] webView, _ in
            DispatchQueue.main.async { self?.applyPageColor(webView.underPageBackgroundColor) }
        }
    }

    private func applyPageColor(_ color: UIColor?) {
        guard let color = color else { return }
        statusBarBackdrop.backgroundColor = color
        // The home-indicator inset at the bottom is the scroll view's own
        // background, which Capacitor leaves at systemBackground: a white band
        // under the paper colour, and black under the dark one.
        webView?.backgroundColor = color
        webView?.scrollView.backgroundColor = color
        // Dark icons on a light page, light icons on a dark one. Read from the
        // colour itself because the in-app theme can disagree with the system's.
        var white: CGFloat = 0
        color.resolvedColor(with: traitCollection).getWhite(&white, alpha: nil)
        setStatusBarStyle(white > 0.5 ? .darkContent : .lightContent)
    }
}

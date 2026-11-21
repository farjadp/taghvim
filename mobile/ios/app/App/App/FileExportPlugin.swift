// ============================================================================
// Source: mobile/ios/app/App/App/FileExportPlugin.swift
// Version: 0.1.0 — 2026-11-20
// Why: The iPhone half of src/lib/native-export.ts, the twin of Android's
//      FileExportPlugin.kt with the same JS name and contract. WKWebView drops
//      a blob: link clicked with `download`, so the .ics of «تاریخ‌های من» and
//      the hero's day card had no way out of the app. The page calls
//      FileExport.share({ fileName, mimeType, content | base64, text? });
//      ExportCore's ExportFiles.check decides what is accepted, this writes the
//      bytes to <tmp>/exports/<name> and presents UIActivityViewController with
//      the file (and `text` as a caption). Nothing leaves the phone except by
//      the person's own pick in that sheet, and no permission is needed.
//      Resolves { shared: true } once the sheet is on screen — a cancel is not
//      reported, as on Android. Rejects with BAD_NAME / BAD_TYPE / BAD_CONTENT
//      / TOO_LARGE on what check refuses, WRITE_FAILED, or NO_ACTIVITY.
//      The exports folder is emptied in load(), which runs once per launch when
//      MainViewController registers the plugin, and again before every write.
// Env / Deps: Capacitor 8, UIKit, ExportCore (mobile/ios/ExportCore);
//      registered in MainViewController.capacitorDidLoad.
// ============================================================================

import Capacitor
import ExportCore
import Foundation
import UIKit

@objc(FileExportPlugin)
public class FileExportPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FileExportPlugin"
    public let jsName = "FileExport"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise),
    ]

    // The app's own temporary directory; never backed up, and the system may purge it.
    private var base: URL { URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true) }

    override public func load() {
        // Cold start: the last export (people's names, or a day card) does not survive a relaunch.
        ExportFiles.clear(base: base)
    }

    @objc func share(_ call: CAPPluginCall) {
        let checked = ExportFiles.check(
            fileName: call.getString("fileName"),
            mimeType: call.getString("mimeType"),
            content: call.getString("content"),
            base64: call.getString("base64"),
            text: call.getString("text")
        )
        let accepted: ExportFiles.Accepted
        switch checked {
        case let .rejected(code, message):
            call.reject(message, code)
            return
        case let .ok(ok):
            accepted = ok
        }

        let file: URL
        do {
            file = try ExportFiles.write(base: base, name: accepted.name, bytes: accepted.bytes)
        } catch {
            call.reject("could not write the file", "WRITE_FAILED", error)
            return
        }

        // Plugin methods run on Capacitor's queue; UIKit only on the main thread.
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let root = self.bridge?.viewController else {
                call.reject("no view controller to show the share sheet", "NO_ACTIVITY")
                return
            }
            var items: [Any] = [file]
            if let text = accepted.text { items.append(text) }
            let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)

            // Present from whatever is on top: presenting from a controller that
            // already shows something fails without an error.
            var host: UIViewController = root
            while let presented = host.presentedViewController, !presented.isBeingDismissed { host = presented }
            if host.presentedViewController != nil {
                call.reject("another sheet is still closing", "NO_ACTIVITY")
                return
            }

            // On iPad the sheet is a popover and UIKit throws if it has no anchor.
            // The page does not pass the button's position, so it floats centred
            // over the page with no arrow.
            if let popover = sheet.popoverPresentationController {
                popover.sourceView = host.view
                popover.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            host.present(sheet, animated: true) {
                call.resolve(["shared": true])
            }
        }
    }
}

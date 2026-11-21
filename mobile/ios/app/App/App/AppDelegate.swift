// ============================================================================
// Source: mobile/ios/app/App/App/AppDelegate.swift
// Version: 0.2.1 — 2026-11-20
// Why: Capacitor's app delegate, plus one privacy rule: the page's localStorage
//      holds the personal dates, which can be people's names, and the app says
//      that list stays on this device, so it must stay out of device backups.
// Env / Deps: UIKit, Capacitor. Sets the backup-exclusion flag on Library/WebKit.
// ============================================================================

import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        excludeWebViewStorageFromBackup()
        return true
    }

    // Observed on the iOS 26.5 simulator: WebKit flags a site's folder at
    // first and cleared the flag on a later use once the folder was older than
    // 24 hours, so localStorage became backup-eligible. The flag therefore goes on the parent, which WebKit does
    // not touch. Set on every launch, before the web view exists, and the folder
    // is created here because it does not exist yet on a first launch.
    private func excludeWebViewStorageFromBackup() {
        let fileManager = FileManager.default
        do {
            var webKitDirectory = try fileManager
                .url(for: .libraryDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
                .appendingPathComponent("WebKit", isDirectory: true)
            try fileManager.createDirectory(at: webKitDirectory, withIntermediateDirectories: true)
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try webKitDirectory.setResourceValues(values)
        } catch {
            // The calendar still works without the flag, so this must not stop launch.
            NSLog("Taghvim: could not exclude web storage from backup: %@", error.localizedDescription)
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

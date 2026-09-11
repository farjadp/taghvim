// swift-tools-version:5.9
// ============================================================================
// Source: mobile/ios/TaghvimCore/Package.swift
// Version: 0.1.0 — 2026-09-10
// Why: The date and occasion logic the iPhone app and its widgets share. Kept a
//      plain Swift package, not inside an Xcode project, so `swift test` runs it
//      on the Mac with no simulator and the widget target links the same code.
// Env / Deps: Foundation only. macOS listed so the tests run on the host.
// ============================================================================

import PackageDescription

let package = Package(
    name: "TaghvimCore",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [.library(name: "TaghvimCore", targets: ["TaghvimCore"])],
    targets: [
        .target(name: "TaghvimCore"),
        .testTarget(name: "TaghvimCoreTests", dependencies: ["TaghvimCore"]),
    ]
)

// swift-tools-version:5.9
// ============================================================================
// Source: mobile/ios/ExportCore/Package.swift
// Version: 0.1.0 — 2026-11-20
// Why: The pure half of the iPhone app's FileExport plugin — what the page may
//      hand out and where it is written — kept a plain Swift package, like
//      TaghvimCore, so `swift test` holds it on the Mac with no simulator. Its
//      own package rather than part of TaghvimCore because the app target
//      (iOS 15) links it and the widgets do not need it.
// Env / Deps: Foundation only. macOS listed so the tests run on the host.
// ============================================================================

import PackageDescription

let package = Package(
    name: "ExportCore",
    platforms: [.iOS(.v15), .macOS(.v13)],
    products: [.library(name: "ExportCore", targets: ["ExportCore"])],
    targets: [
        .target(name: "ExportCore"),
        .testTarget(name: "ExportCoreTests", dependencies: ["ExportCore"]),
    ]
)

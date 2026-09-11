// ============================================================================
// Source: mobile/android/core/settings.gradle.kts
// Version: 0.1.0 — 2026-09-10
// Why: The date and occasion logic the Android app and its widgets share, as a
//      plain Kotlin/JVM module so `./gradlew test` runs on the Mac without an
//      emulator. The Capacitor app will include it as a composite build.
// Env / Deps: Gradle wrapper in this folder; JDK 21.
// ============================================================================

rootProject.name = "taghvim-core"

dependencyResolutionManagement {
    repositories { mavenCentral() }
}

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

// ============================================================================
// Source: mobile/android/core/build.gradle.kts
// Version: 0.1.0 — 2026-09-10
// Why: Builds and tests the Kotlin port against mobile/shared. org.json is
//      compileOnly because Android ships it in the framework; the tests pull the
//      same API from Maven. Java 17 bytecode, the floor current Android Gradle
//      plugins build against. No toolchain block: the only JDK on the Mac is
//      the one inside Android Studio (25), and a toolchain of 17 would make
//      Gradle go looking for a JDK that is not there. Targets are set instead.
// Env / Deps: Kotlin JVM plugin, JUnit 5, org.json. Versions pinned.
//      JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
// ============================================================================

import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    kotlin("jvm") version "2.4.0"
}

group = "im.taghv"
version = "0.1.0"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
}

dependencies {
    compileOnly("org.json:json:20240303")
    testImplementation("org.json:json:20240303")
    testImplementation(platform("org.junit:junit-bom:5.11.4"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
    testLogging { events("passed", "failed") }
}

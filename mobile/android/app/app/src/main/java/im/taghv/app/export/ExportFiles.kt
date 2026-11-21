// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/export/ExportFiles.kt
// Version: 0.2.0 — 2026-11-20
// Why: The pure half of FileExportPlugin, kept free of Android types so the JVM
//      tests can hold it: which file names the page may ask for, and where on
//      disk such a file may land. The plugin is not a general file writer — it
//      exists for the .ics of «تاریخ‌های من» — so a name must be a bare
//      basename of [A-Za-z0-9._-] ending in .ics, the type must be
//      text/calendar, and the file always lands in cacheDir/exports/, the one
//      folder res/xml/file_paths.xml hands to the FileProvider for it.
//      The name is kept rather than replaced by a fixed one because the
//      receiving app shows it (FileProvider reports it as DISPLAY_NAME) and the
//      site's download already calls the file taghvim-dates.ics.
//      clear() empties that folder: before each new export, and once per
//      process from MainActivity, so the last export — people's names — does
//      not outlive the dates it was made from.
// Env / Deps: java.io only (java.nio.file needs API 26; minSdk is 24).
// ============================================================================

package im.taghv.app.export

import java.io.File

object ExportFiles {
    // Must equal the cache-path's `path` in res/xml/file_paths.xml.
    const val DIR = "exports"
    const val MIME_TYPE = "text/calendar"
    const val MAX_NAME = 64
    // 60 dates × 10 written-out years is far below this; anything larger is not ours.
    const val MAX_BYTES = 1_000_000

    private val SAFE_NAME = Regex("^[A-Za-z0-9][A-Za-z0-9._-]*\\.ics$")

    // The name the file will carry, or null when the page asked for something
    // that is not a plain .ics basename. No path separators, no leading dot, no
    // "..", no Persian or spaces: a name this narrow needs no escaping anywhere.
    fun safeFileName(raw: String?): String? {
        if (raw == null || raw.length > MAX_NAME) return null
        if (!SAFE_NAME.matches(raw) || raw.contains("..")) return null
        return raw
    }

    fun isAllowedMimeType(raw: String?): Boolean =
        raw != null && raw.substringBefore(';').trim().equals(MIME_TYPE, ignoreCase = true)

    // The file inside cacheDir/exports/, checked by canonical path so no name
    // that slipped past safeFileName could ever point outside the folder.
    fun target(cacheDir: File, name: String): File {
        val dir = File(cacheDir, DIR).canonicalFile
        val file = File(dir, name).canonicalFile
        require(file.parentFile == dir) { "export path escapes $DIR/" }
        return file
    }

    // Deletes the regular files directly inside cacheDir/exports/ and nothing
    // else: no subfolder is entered, and a symlink is neither followed nor
    // removed, so this can never reach outside the folder. A missing folder,
    // or an exports/ that is itself a link, is left alone. Returns how many
    // files were deleted.
    // A link is told apart by its canonical path: a symlink resolves somewhere
    // other than <exports>/<its own name>, so it is skipped rather than followed.
    fun clear(cacheDir: File): Int {
        val dir = File(cacheDir, DIR)
        if (!dir.isDirectory) return 0
        val real = dir.canonicalFile
        if (real != File(cacheDir.canonicalFile, DIR)) return 0
        var deleted = 0
        val entries = dir.listFiles() ?: return 0
        for (entry in entries) {
            if (!entry.isFile || entry.canonicalFile != File(real, entry.name)) continue
            if (entry.delete()) deleted++
        }
        return deleted
    }
}

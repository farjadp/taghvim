// ============================================================================
// Source: mobile/android/app/app/src/test/java/im/taghv/app/export/ExportFilesTest.kt
// Version: 0.1.0 — 2026-11-20
// Why: Holds FileExportPlugin's pure half on the JVM: the page's name for the
//      .ics is accepted as is, anything that is not a plain .ics basename is
//      refused, only text/calendar passes, and the file always lands directly
//      in cacheDir/exports/ — the one folder file_paths.xml shares for it.
// Env / Deps: JUnit 4; a temp folder stands in for cacheDir.
// ============================================================================

package im.taghv.app.export

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class ExportFilesTest {
    @Test
    fun acceptsTheNameThePageSends() {
        assertEquals("taghvim-dates.ics", ExportFiles.safeFileName("taghvim-dates.ics"))
        assertEquals("a_b.2.ics", ExportFiles.safeFileName("a_b.2.ics"))
    }

    @Test
    fun refusesAnythingButAPlainIcsBasename() {
        val bad = listOf(
            null, "", ".ics", "../taghvim-dates.ics", "x/../../y.ics", "/data/x.ics", "a/b.ics",
            "a\\b.ics", ".hidden.ics", "a..ics", "taghvim-dates.txt", "taghvim-dates.ics.exe",
            "تاریخ.ics", "my dates.ics", "a.ics\u0000", "-a.ics", "x".repeat(ExportFiles.MAX_NAME) + ".ics",
        )
        for (name in bad) assertNull("accepted: $name", ExportFiles.safeFileName(name))
    }

    @Test
    fun onlyTextCalendarPasses() {
        assertTrue(ExportFiles.isAllowedMimeType("text/calendar"))
        assertTrue(ExportFiles.isAllowedMimeType("text/calendar;charset=utf-8"))
        assertFalse(ExportFiles.isAllowedMimeType(null))
        assertFalse(ExportFiles.isAllowedMimeType("text/plain"))
        assertFalse(ExportFiles.isAllowedMimeType("application/octet-stream"))
    }

    @Test
    fun theFileLandsDirectlyInCacheExports() {
        val cache = Files.createTempDirectory("cache").toFile()
        val file = ExportFiles.target(cache, "taghvim-dates.ics")
        assertEquals(File(cache, "exports").canonicalFile, file.parentFile)
        assertEquals("taghvim-dates.ics", file.name)
        // The canonical-path check is the second fence behind safeFileName.
        assertThrows(IllegalArgumentException::class.java) { ExportFiles.target(cache, "../escape.ics") }
        assertThrows(IllegalArgumentException::class.java) { ExportFiles.target(cache, "sub/x.ics") }
        cache.deleteRecursively()
    }
}

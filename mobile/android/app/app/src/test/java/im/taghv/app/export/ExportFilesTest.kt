// ============================================================================
// Source: mobile/android/app/app/src/test/java/im/taghv/app/export/ExportFilesTest.kt
// Version: 0.3.0 — 2026-11-20
// Why: Holds FileExportPlugin's pure half on the JVM: the three names the page
//      sends are accepted as is, anything that is not a plain basename is
//      refused, only the (mime, extension, payload) triples for .ics, .png and
//      .jpg pass, base64 is decoded strictly, sizes are capped on the decoded
//      bytes, image bytes must carry their signature, the caption is truncated
//      at 2,000 chars, the file always lands directly in cacheDir/exports/, and
//      clear() deletes only regular files directly in that folder.
// Env / Deps: JUnit 4; a temp folder stands in for cacheDir; java.util.Base64
//      encodes test input only (the app cannot use it at API 24).
// ============================================================================

package im.taghv.app.export

import java.io.File
import java.nio.file.Files
import java.util.Base64
import java.util.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class ExportFilesTest {
    private val pngBytes = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3)
    private val jpegBytes = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0xE0.toByte(), 9)

    private fun b64(bytes: ByteArray) = Base64.getEncoder().encodeToString(bytes)
    private fun ok(r: ExportFiles.Result) = r as? ExportFiles.Result.Ok ?: throw AssertionError("rejected: $r")
    private fun code(r: ExportFiles.Result) = (r as? ExportFiles.Result.Rejected)?.code ?: "OK"

    @Test
    fun acceptsTheNamesThePageSends() {
        for (n in listOf("taghvim-dates.ics", "taghvim-1405-08-30.png", "taghvim-1405-08-30.jpg", "a_b.2.ics")) {
            assertEquals(n, ExportFiles.safeFileName(n))
        }
    }

    @Test
    fun refusesAnythingButAPlainBasename() {
        val bad = listOf(
            null, "", ".ics", "../taghvim-dates.ics", "x/../../y.ics", "/data/x.ics", "a/b.ics",
            "a\\b.ics", ".hidden.ics", "a..ics", "a.ics\u0000", "-a.ics", "تاریخ.ics", "my dates.ics",
            "noext", "a.PNG", "x".repeat(ExportFiles.MAX_NAME) + ".ics",
        )
        for (name in bad) assertNull("accepted: $name", ExportFiles.safeFileName(name))
    }

    @Test
    fun theThreeAllowedTriplesPass() {
        val ics = ok(ExportFiles.check("taghvim-dates.ics", "text/calendar;charset=utf-8", "BEGIN:VCALENDAR", null, null))
        assertEquals(ExportFiles.Kind.ICS, ics.kind)
        assertTrue(ics.bytes.contentEquals("BEGIN:VCALENDAR".toByteArray()))
        val png = ok(ExportFiles.check("taghvim-1405-08-30.png", "image/png", null, b64(pngBytes), "متن"))
        assertEquals(ExportFiles.Kind.PNG, png.kind)
        assertTrue(png.bytes.contentEquals(pngBytes))
        assertEquals("متن", png.text)
        val jpg = ok(ExportFiles.check("taghvim-1405-08-30.jpg", "image/jpeg", null, b64(jpegBytes), null))
        assertEquals(ExportFiles.Kind.JPEG, jpg.kind)
        assertNull(jpg.text)
    }

    @Test
    fun anythingOutsideTheAllowlistIsBadType() {
        val png = b64(pngBytes)
        val jpg = b64(jpegBytes)
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.ics", "text/plain", "x", null, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.ics", null, "x", null, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.gif", "image/gif", null, png, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.svg", "image/svg+xml", "<svg/>", null, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.bin", "application/octet-stream", null, png, null)))
        // Extension must match the type; .jpeg is not the spelling the page uses.
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.jpeg", "image/jpeg", null, jpg, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.png", "image/jpeg", null, jpg, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.ics", "image/png", null, png, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.png", "text/calendar", "x", null, null)))
        // Payload kind must match the type.
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.png", "image/png", "text", null, null)))
        assertEquals("BAD_TYPE", code(ExportFiles.check("a.ics", "text/calendar", null, b64("x".toByteArray()), null)))
        assertEquals("BAD_NAME", code(ExportFiles.check("../a.png", "image/png", null, png, null)))
    }

    @Test
    fun exactlyOnePayload() {
        val png = b64(pngBytes)
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.png", "image/png", null, null, null)))
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.png", "image/png", "x", png, null)))
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.ics", "text/calendar", null, null, null)))
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.ics", "text/calendar", "x", "eA==", null)))
    }

    @Test
    fun malformedBase64IsBadContent() {
        val good = b64(pngBytes) // "iVBORw0KGgoBAgM="
        val bad = listOf(
            "", "data:image/png;base64,$good", "$good\n", " $good", good.dropLast(1), "$good=",
            good.replace('B', '-'), good.replace('B', '_'), "====", "A===", "iVBO=w==",
            "iVBORw0KGgo۱", // a Persian digit is not in the alphabet
        )
        for (s in bad) assertEquals("decoded: $s", "BAD_CONTENT", code(ExportFiles.check("a.png", "image/png", null, s, null)))
    }

    @Test
    fun decoderMatchesTheJdkOnEveryPadding() {
        val r = Random(7)
        for (n in 1..40) {
            val bytes = ByteArray(n).also { r.nextBytes(it) }
            assertTrue("n=$n", ExportFiles.decodeBase64(b64(bytes))!!.contentEquals(bytes))
        }
        assertNull(ExportFiles.decodeBase64(""))
        // Spare bits must be zero, so each byte string has one spelling.
        assertTrue(ExportFiles.decodeBase64("AA==")!!.contentEquals(byteArrayOf(0)))
        assertNull(ExportFiles.decodeBase64("AF=="))
        assertNull(ExportFiles.decodeBase64("AAB="))
    }

    @Test
    fun imageBytesMustCarryTheirSignature() {
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.png", "image/png", null, b64(jpegBytes), null)))
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.jpg", "image/jpeg", null, b64(pngBytes), null)))
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.png", "image/png", null, b64(pngBytes.copyOf(7)), null)))
        assertEquals("BAD_CONTENT", code(ExportFiles.check("a.png", "image/png", null, b64("<html>".toByteArray()), null)))
    }

    @Test
    fun sizeIsCappedOnDecodedBytesPerKind() {
        val atCap = pngBytes.copyOf(ExportFiles.MAX_IMAGE_BYTES)
        assertEquals("OK", code(ExportFiles.check("a.png", "image/png", null, b64(atCap), null)))
        val over = pngBytes.copyOf(ExportFiles.MAX_IMAGE_BYTES + 1)
        assertEquals("TOO_LARGE", code(ExportFiles.check("a.png", "image/png", null, b64(over), null)))
        // A card well past the largest ever measured (925 KB) passes.
        assertEquals("OK", code(ExportFiles.check("a.jpg", "image/jpeg", null, b64(jpegBytes.copyOf(1_500_000)), null)))
        // .ics keeps its own 1 MB cap, counted in UTF-8 bytes (Persian letters are two each).
        assertEquals("OK", code(ExportFiles.check("a.ics", "text/calendar", "x".repeat(ExportFiles.MAX_TEXT_BYTES), null, null)))
        assertEquals("TOO_LARGE", code(ExportFiles.check("a.ics", "text/calendar", "ت".repeat(ExportFiles.MAX_TEXT_BYTES / 2 + 1), null, null)))
    }

    @Test
    fun captionIsTruncatedNotRejected() {
        assertNull(ExportFiles.shareText(null))
        assertNull(ExportFiles.shareText("  "))
        assertEquals("امروز", ExportFiles.shareText("امروز"))
        val long = "ی".repeat(ExportFiles.MAX_SHARE_TEXT + 500)
        assertEquals(ExportFiles.MAX_SHARE_TEXT, ExportFiles.shareText(long)!!.length)
        // Never cut a surrogate pair in half.
        val pair = "a".repeat(ExportFiles.MAX_SHARE_TEXT - 1) + "🌙tail"
        val cut = ExportFiles.shareText(pair)!!
        assertEquals(ExportFiles.MAX_SHARE_TEXT - 1, cut.length)
        assertFalse(Character.isHighSurrogate(cut.last()))
        assertEquals(ExportFiles.MAX_SHARE_TEXT, ok(ExportFiles.check("a.png", "image/png", null, b64(pngBytes), long)).text!!.length)
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

    @Test
    fun clearDeletesOnlyRegularFilesDirectlyInExports() {
        val cache = Files.createTempDirectory("cache").toFile()
        assertEquals(0, ExportFiles.clear(cache)) // no exports/ yet
        val exports = File(cache, "exports").apply { mkdirs() }
        File(exports, "taghvim-dates.ics").writeText("x")
        File(exports, ".taghvim-dates.ics.tmp").writeText("x")
        val sub = File(exports, "sub").apply { mkdirs() }
        val nested = File(sub, "kept.ics").apply { writeText("x") }
        val outside = File(cache, "outside.ics").apply { writeText("x") }
        val link = File(exports, "link.ics")
        Files.createSymbolicLink(link.toPath(), outside.toPath())

        assertEquals(2, ExportFiles.clear(cache))
        assertFalse(File(exports, "taghvim-dates.ics").exists())
        assertFalse(File(exports, ".taghvim-dates.ics.tmp").exists())
        assertTrue("subfolder entered", nested.exists())
        assertTrue("link followed", outside.exists())
        assertTrue("link removed", Files.isSymbolicLink(link.toPath()))
        cache.deleteRecursively()
    }

    @Test
    fun clearLeavesAnExportsLinkAlone() {
        val cache = Files.createTempDirectory("cache").toFile()
        val elsewhere = Files.createTempDirectory("elsewhere").toFile()
        val victim = File(elsewhere, "victim.ics").apply { writeText("x") }
        Files.createSymbolicLink(File(cache, "exports").toPath(), elsewhere.toPath())
        assertEquals(0, ExportFiles.clear(cache))
        assertTrue(victim.exists())
        cache.deleteRecursively()
        elsewhere.deleteRecursively()
    }
}

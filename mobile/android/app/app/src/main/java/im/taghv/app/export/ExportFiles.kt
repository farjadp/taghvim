// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/export/ExportFiles.kt
// Version: 0.3.0 — 2026-11-20
// Why: The pure half of FileExportPlugin, kept free of Android types so the JVM
//      tests can hold it. The plugin is not a general file writer: it hands out
//      exactly three kinds of file, each a fixed (mime, extension, payload)
//      triple — the .ics of «تاریخ‌های من» as UTF-8 text, and the hero's day
//      card as a PNG or JPEG sent as base64. `check` turns what the page sent
//      into either the bytes to write or one reject code; the plugin only
//      writes and opens the chooser.
//      Names stay a bare ASCII basename whose extension matches the type,
//      because the receiving app shows the name (FileProvider reports it as
//      DISPLAY_NAME). Image bytes must start with their format's signature,
//      so the page cannot hand out something else under an image type.
//      clear() empties cacheDir/exports/ — the one folder res/xml/file_paths.xml
//      shares — before each new export and once per process from MainActivity,
//      so the last export (people's names, or the day's card) does not linger.
// Env / Deps: java.io only (java.nio.file and java.util.Base64 need API 26;
//      minSdk is 24 and desugaring does not cover Base64, so the decoder is
//      written out here).
// ============================================================================

package im.taghv.app.export

import java.io.File

object ExportFiles {
    // Must equal the cache-path's `path` in res/xml/file_paths.xml.
    const val DIR = "exports"
    const val MAX_NAME = 64

    // 60 dates × 10 written-out years of .ics is far below 1 MB; anything larger is not ours.
    const val MAX_TEXT_BYTES = 1_000_000

    // The card is 1080×1080. Measured: flat PNG cards ~50–250 KB, photo cards
    // up to 925 KB when they were PNG, 53–96 KB as JPEG. The raw RGBA frame
    // itself is 1080×1080×4 = 4.67 MB, which a real PNG of a drawn card never
    // approaches; 4 MiB is >4× the largest card ever measured and still keeps
    // the base64 string through the bridge under 5.6 MB.
    const val MAX_IMAGE_BYTES = 4 * 1024 * 1024

    // EXTRA_TEXT is the caption a chat app puts beside the image. shareText is
    // a sentence or two; 2,000 characters is headroom, and a longer one is
    // TRUNCATED rather than rejected — a long caption must never cost the
    // person the picture.
    const val MAX_SHARE_TEXT = 2_000

    enum class Payload { TEXT, BASE64 }

    enum class Kind(val mime: String, val extension: String, val payload: Payload, val maxBytes: Int, val magic: ByteArray?) {
        ICS("text/calendar", "ics", Payload.TEXT, MAX_TEXT_BYTES, null),
        PNG("image/png", "png", Payload.BASE64, MAX_IMAGE_BYTES, byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)),
        JPEG("image/jpeg", "jpg", Payload.BASE64, MAX_IMAGE_BYTES, byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte())),
    }

    sealed class Result {
        data class Ok(val kind: Kind, val name: String, val bytes: ByteArray, val text: String?) : Result()
        data class Rejected(val code: String, val message: String) : Result()
    }

    // Extension is checked separately against the type, so this only fences the shape.
    private val SAFE_NAME = Regex("^[A-Za-z0-9][A-Za-z0-9._-]*\\.[a-z]+$")

    // The name the file will carry, or null when it is not a plain ASCII
    // basename. No path separators, no leading dot, no "..", no Persian or
    // spaces: a name this narrow needs no escaping anywhere.
    fun safeFileName(raw: String?): String? {
        if (raw == null || raw.length > MAX_NAME) return null
        if (!SAFE_NAME.matches(raw) || raw.contains("..")) return null
        return raw
    }

    // The kind a mime type names, parameters (";charset=utf-8") ignored.
    fun kindFor(mime: String?): Kind? {
        val bare = mime?.substringBefore(';')?.trim()?.lowercase() ?: return null
        return Kind.values().firstOrNull { it.mime == bare }
    }

    // Everything the page sent, in the order a reader would check it: the
    // name, then the type and that the name's extension and the payload field
    // both belong to it, then the payload itself.
    fun check(fileName: String?, mimeType: String?, content: String?, base64: String?, text: String?): Result {
        val name = safeFileName(fileName) ?: return Result.Rejected("BAD_NAME", "fileName must be a plain ASCII basename")
        val kind = kindFor(mimeType) ?: return Result.Rejected("BAD_TYPE", "type is not one this app exports")
        if (!name.endsWith(".${kind.extension}")) return Result.Rejected("BAD_TYPE", "a ${kind.mime} file must end in .${kind.extension}")
        if ((content == null) == (base64 == null)) return Result.Rejected("BAD_CONTENT", "send exactly one of content or base64")
        val sentAs = if (content != null) Payload.TEXT else Payload.BASE64
        if (sentAs != kind.payload) return Result.Rejected("BAD_TYPE", "${kind.mime} is sent as ${kind.payload.name.lowercase()}")

        val bytes = when (kind.payload) {
            Payload.TEXT -> content!!.toByteArray(Charsets.UTF_8)
            Payload.BASE64 -> {
                // Cheap length test before allocating: n decoded bytes take 4·⌈n/3⌉ characters.
                if (base64!!.length > (kind.maxBytes + 2) / 3 * 4) return Result.Rejected("TOO_LARGE", "file too large")
                decodeBase64(base64) ?: return Result.Rejected("BAD_CONTENT", "base64 is malformed")
            }
        }
        if (bytes.size > kind.maxBytes) return Result.Rejected("TOO_LARGE", "file too large")
        val magic = kind.magic
        if (magic != null && !startsWith(bytes, magic)) return Result.Rejected("BAD_CONTENT", "bytes are not a ${kind.mime}")
        return Result.Ok(kind, name, bytes, shareText(text))
    }

    // Null for no caption; otherwise at most MAX_SHARE_TEXT chars, never
    // splitting a surrogate pair.
    fun shareText(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        if (raw.length <= MAX_SHARE_TEXT) return raw
        var end = MAX_SHARE_TEXT
        if (Character.isHighSurrogate(raw[end - 1])) end--
        return raw.substring(0, end)
    }

    private fun startsWith(bytes: ByteArray, prefix: ByteArray): Boolean {
        if (bytes.size < prefix.size) return false
        for (i in prefix.indices) if (bytes[i] != prefix[i]) return false
        return true
    }

    private const val ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    private val DECODE = IntArray(128) { -1 }.also { t -> ALPHABET.forEachIndexed { i, c -> t[c.code] = i } }

    // Strict RFC 4648 §4 base64: standard alphabet, padded to a multiple of 4,
    // '=' only as the last one or two characters, no whitespace, no `data:`
    // prefix, and the unused bits of the last group zero (so one byte string
    // has exactly one spelling). Null on anything else.
    fun decodeBase64(s: String): ByteArray? {
        if (s.isEmpty() || s.length % 4 != 0) return null
        val pad = when {
            s.endsWith("==") -> 2
            s.endsWith("=") -> 1
            else -> 0
        }
        val out = ByteArray(s.length / 4 * 3 - pad)
        var o = 0
        var i = 0
        while (i < s.length) {
            val last = i + 4 == s.length
            val v = IntArray(4)
            for (k in 0 until 4) {
                val c = s[i + k]
                if (last && c == '=' && k >= 4 - pad) { v[k] = 0; continue }
                if (c.code >= 128) return null
                val d = DECODE[c.code]
                if (d < 0) return null
                v[k] = d
            }
            val n = (v[0] shl 18) or (v[1] shl 12) or (v[2] shl 6) or v[3]
            if (last && pad == 2 && (v[1] and 0x0F) != 0) return null
            if (last && pad == 1 && (v[2] and 0x03) != 0) return null
            out[o++] = (n shr 16).toByte()
            if (o < out.size) out[o++] = (n shr 8).toByte()
            if (o < out.size) out[o++] = n.toByte()
            i += 4
        }
        return out
    }

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

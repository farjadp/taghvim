// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/export/FileExportPlugin.kt
// Version: 0.1.0 — 2026-11-20
// Why: The native half of src/lib/native-export.ts. In the app, the export of
//      «تاریخ‌های من» was a blob: link clicked with `download`; Capacitor's
//      WebView has no DownloadListener, so the click was dropped without a
//      word. The page now calls FileExport.share({ fileName, mimeType,
//      content }); this writes the text to cacheDir/exports/<name>, hands it
//      out through the app's FileProvider with a read grant, and opens the
//      system chooser on ACTION_SEND. Nothing leaves the phone except by the
//      person's own pick in that sheet, and no permission is needed: the cache
//      is the app's own, and the grant is per-intent.
//      Resolves { shared: true } once the chooser is up — the chooser does not
//      report a cancel, and the page treats both answers the same. Rejects on a
//      name, type or size it does not accept, a failed write, or no activity to
//      show the sheet; the page then says «فایل ساخته نشد.».
// Env / Deps: Capacitor 8 plugin API; androidx FileProvider with authority
//      ${applicationId}.fileprovider (AndroidManifest.xml) and the `exports`
//      cache-path in res/xml/file_paths.xml; registered in MainActivity.
// ============================================================================

package im.taghv.app.export

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import im.taghv.app.R
import java.io.File
import java.io.IOException

@CapacitorPlugin(name = "FileExport")
class FileExportPlugin : Plugin() {
    @PluginMethod
    fun share(call: PluginCall) {
        val name = ExportFiles.safeFileName(call.getString("fileName"))
            ?: return call.reject("fileName must be a plain .ics name", "BAD_NAME")
        if (!ExportFiles.isAllowedMimeType(call.getString("mimeType"))) {
            return call.reject("only ${ExportFiles.MIME_TYPE} is exported", "BAD_TYPE")
        }
        val content = call.getString("content")
            ?: return call.reject("content is missing", "NO_CONTENT")
        val bytes = content.toByteArray(Charsets.UTF_8)
        if (bytes.size > ExportFiles.MAX_BYTES) return call.reject("content too large", "TOO_LARGE")

        val file = try {
            write(name, bytes)
        } catch (e: IOException) {
            return call.reject("could not write the file", "WRITE_FAILED", e)
        } catch (e: IllegalArgumentException) {
            return call.reject("could not write the file", "WRITE_FAILED", e)
        }

        val host = activity ?: return call.reject("no activity to show the share sheet", "NO_ACTIVITY")
        val uri = try {
            FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        } catch (e: IllegalArgumentException) {
            return call.reject("file is outside the provider's paths", "WRITE_FAILED", e)
        }

        val send = Intent(Intent.ACTION_SEND).apply {
            type = ExportFiles.MIME_TYPE
            putExtra(Intent.EXTRA_STREAM, uri)
            // ClipData carries the grant through the chooser to the app picked in it;
            // EXTRA_STREAM alone is not enough for the grant on every version.
            clipData = ClipData.newUri(context.contentResolver, name, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(send, context.getString(R.string.export_chooser_title)).apply {
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        try {
            host.runOnUiThread {
                try {
                    host.startActivity(chooser)
                    call.resolve(JSObject().put("shared", true))
                } catch (e: ActivityNotFoundException) {
                    call.reject("no app can receive the file", "NO_ACTIVITY", e)
                }
            }
        } catch (e: RuntimeException) {
            call.reject("could not open the share sheet", "NO_ACTIVITY", e)
        }
    }

    // One file at a time: the folder is emptied first, so an old export never
    // lingers beside the new one. Written to a temp name and renamed, so a
    // receiving app can never read half a file.
    private fun write(name: String, bytes: ByteArray): File {
        val target = ExportFiles.target(context.cacheDir, name)
        val dir = target.parentFile ?: throw IOException("no export folder")
        if (!dir.isDirectory && !dir.mkdirs()) throw IOException("cannot create ${dir.name}")
        dir.listFiles()?.forEach { it.delete() }
        val temp = File(dir, ".$name.tmp")
        temp.writeBytes(bytes)
        if (!temp.renameTo(target)) {
            temp.delete()
            throw IOException("cannot move the file into place")
        }
        return target
    }
}

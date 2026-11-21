// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/export/FileExportPlugin.kt
// Version: 0.3.0 — 2026-11-20
// Why: The native half of src/lib/native-export.ts. Capacitor's WebView has
//      no DownloadListener and no navigator.share, so a blob: download is
//      dropped without a word. The page calls FileExport.share({ fileName,
//      mimeType, content | base64, text? }) for two things: the .ics of
//      «تاریخ‌های من» (UTF-8 content) and the hero's day card (PNG or JPEG as
//      base64). ExportFiles.check decides what is accepted; this writes the
//      bytes to cacheDir/exports/<name>, hands the file out through the app's
//      FileProvider with a read grant, and opens the system chooser on
//      ACTION_SEND, `text` riding along as EXTRA_TEXT. Nothing leaves the
//      phone except by the person's own pick in that sheet, and no permission
//      is needed: the cache is the app's own, and the grant is per-intent.
//      Resolves { shared: true } once the chooser is up — the chooser does not
//      report a cancel, and the page treats both answers the same. Rejects with
//      BAD_NAME / BAD_TYPE / BAD_CONTENT / TOO_LARGE on what check refuses,
//      WRITE_FAILED, or NO_ACTIVITY.
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
        val checked = ExportFiles.check(
            call.getString("fileName"),
            call.getString("mimeType"),
            call.getString("content"),
            call.getString("base64"),
            call.getString("text"),
        )
        val ok = when (checked) {
            is ExportFiles.Result.Rejected -> return call.reject(checked.message, checked.code)
            is ExportFiles.Result.Ok -> checked
        }

        val file = try {
            write(ok.name, ok.bytes)
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
            type = ok.kind.mime
            putExtra(Intent.EXTRA_STREAM, uri)
            // The caption a chat app puts beside the picture (Telegram has no alt text).
            ok.text?.let { putExtra(Intent.EXTRA_TEXT, it) }
            // ClipData carries the grant through the chooser to the app picked in it;
            // EXTRA_STREAM alone is not enough for the grant on every version.
            clipData = ClipData.newUri(context.contentResolver, ok.name, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val title = context.getString(
            if (ok.kind == ExportFiles.Kind.ICS) R.string.export_chooser_title else R.string.export_chooser_title_image,
        )
        val chooser = Intent.createChooser(send, title).apply {
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        // Plugin methods run on Capacitor's plugin thread, so runOnUiThread only
        // posts the runnable and returns; anything startActivity throws is thrown
        // later, on the main thread, where no try around this call can see it.
        // So the catch is inside: ActivityNotFoundException when nothing can show
        // the sheet, and any other RuntimeException (a SecurityException, say),
        // which would otherwise crash the app and leave the page's promise
        // unsettled.
        host.runOnUiThread {
            try {
                host.startActivity(chooser)
                call.resolve(JSObject().put("shared", true))
            } catch (e: ActivityNotFoundException) {
                call.reject("no app can receive the file", "NO_ACTIVITY", e)
            } catch (e: RuntimeException) {
                call.reject("could not open the share sheet", "NO_ACTIVITY", e)
            }
        }
    }

    // One file at a time: the folder is emptied first, so an old export never
    // lingers beside the new one. Written to a temp name and renamed, so a
    // receiving app can never read half a file.
    private fun write(name: String, bytes: ByteArray): File {
        val target = ExportFiles.target(context.cacheDir, name)
        val dir = target.parentFile ?: throw IOException("no export folder")
        if (!dir.isDirectory && !dir.mkdirs()) throw IOException("cannot create ${dir.name}")
        // Emptying on each new share can pull a file out from under a receiver
        // still reading an earlier share (mail apps read the URI lazily, after
        // the chooser returns). Accepted: one export at a time.
        ExportFiles.clear(context.cacheDir)
        val temp = File(dir, ".$name.tmp")
        temp.writeBytes(bytes)
        if (!temp.renameTo(target)) {
            temp.delete()
            throw IOException("cannot move the file into place")
        }
        return target
    }
}

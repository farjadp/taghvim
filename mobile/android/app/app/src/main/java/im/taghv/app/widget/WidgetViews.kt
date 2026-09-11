// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/WidgetViews.kt
// Version: 0.1.0 — 2026-09-10
// Why: Lays a WidgetDay out as the designs Farjad picked on 10 Sep — small B
//      (weekday, numeral, month) and wide B (a green block with the numeral and
//      month, clay on a day off, then weekday, year and the first occasion) —
//      each in a tall and a strip form, because Android hands a 1×1 widget
//      57×102dp in portrait and 127×51 in landscape. On Android 12+ the
//      launcher picks between them itself; below, the widget's reported height
//      decides. System font, by Farjad's call: widgets cannot use a bundled one.
//      Colours come from resources with night variants; on 12+ they are passed
//      as resources so the launcher re-resolves them when the theme flips.
// Env / Deps: RemoteViews; layouts res/layout/widget_*.xml.
// ============================================================================

package im.taghv.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews
import im.taghv.app.MainActivity
import im.taghv.app.R

object WidgetViews {
    // Below this height a widget gets its one-row form.
    private const val STRIP_BELOW_DP = 80

    fun small(context: Context, day: WidgetDay, options: Bundle?): RemoteViews =
        responsive(options, smallTall(context, day), smallStrip(context, day), minWidth = 40f)

    fun wide(context: Context, day: WidgetDay, options: Bundle?): RemoteViews =
        responsive(options, wideTall(context, day), wideStrip(context, day), minWidth = 180f)

    private fun responsive(options: Bundle?, tall: RemoteViews, strip: RemoteViews, minWidth: Float): RemoteViews {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Both entries share one width, so they differ only in height and the
            // tall one is always the larger: it wins wherever it fits, the strip
            // only where the box is under 80dp high. The first version gave the
            // strip a wider key (100×40) than the tall one (40×80); on a Pixel
            // 1×1 — measured 78×109dp portrait, 160×64 landscape — the launcher
            // then drew the strip in portrait and cut «شهریور» to «شهر…».
            return RemoteViews(
                mapOf(
                    SizeF(minWidth, 40f) to strip,
                    SizeF(minWidth, STRIP_BELOW_DP.toFloat()) to tall,
                ),
            )
        }
        val height = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT) ?: 0
        return if (height in 1 until STRIP_BELOW_DP) strip else tall
    }

    private fun smallTall(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_small).apply {
            setTextViewText(R.id.weekday, day.weekday)
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.month, day.month)
            numeral(context, R.id.day, day)
            opensApp(context)
        }

    private fun smallStrip(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_small_strip).apply {
            setTextViewText(R.id.weekday, day.weekday)
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.month, day.month)
            numeral(context, R.id.day, day)
            opensApp(context)
        }

    private fun wideTall(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_wide).apply {
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.month, day.month)
            setTextViewText(R.id.title, "${day.weekday} ${fa(day.year)}")
            occasionLine(context, day)
            block(day)
            opensApp(context)
        }

    private fun wideStrip(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_wide_strip).apply {
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.title, "${day.weekday} ${day.month} ${fa(day.year)}")
            occasionLine(context, day)
            block(day)
            opensApp(context)
        }

    // The occasion, in clay when it is a holiday; with none, the Gregorian date,
    // isolated left-to-right so its digits keep their order inside RTL text.
    private fun RemoteViews.occasionLine(context: Context, day: WidgetDay) {
        val occasion = day.occasion
        if (occasion != null) {
            setTextViewText(R.id.occasion, occasion)
            color(context, R.id.occasion, if (day.occasionIsHoliday) R.color.widget_clay else R.color.widget_muted)
        } else {
            setTextViewText(R.id.occasion, "⁦${day.gregorian}⁩")
            color(context, R.id.occasion, R.color.widget_muted)
        }
        setViewVisibility(R.id.occasion, View.VISIBLE)
    }

    private fun RemoteViews.block(day: WidgetDay) {
        setInt(R.id.block, "setBackgroundResource", if (day.off) R.drawable.widget_block_clay else R.drawable.widget_block_forest)
    }

    private fun RemoteViews.numeral(context: Context, id: Int, day: WidgetDay) {
        color(context, id, if (day.off) R.color.widget_clay else R.color.widget_forest)
    }

    private fun RemoteViews.color(context: Context, id: Int, colorRes: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) setColorStateList(id, "setTextColor", colorRes)
        else setTextColor(id, context.getColor(colorRes))
    }

    private fun RemoteViews.opensApp(context: Context) {
        val intent = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        setOnClickPendingIntent(R.id.root, PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE))
    }
}

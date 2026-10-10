// ============================================================================
// Source: mobile/android/app/app/src/main/java/im/taghv/app/widget/WidgetViews.kt
// Version: 0.3.0 — 2026-10-10
// Why: Lays a WidgetDay out as the designs Farjad picked on 10 Sep — small B
//      (weekday, numeral, month) and wide B (a green block with the numeral and
//      month, clay on a day off, then weekday, year and the first occasion) —
//      each in a tall and a strip form, because Android hands a 1×1 widget
//      57×102dp in portrait and 127×51 in landscape. On Android 12+ the
//      launcher picks between them itself; below, the widget's reported height
//      decides. The month widget (10 Oct) is one layout in two heights: the
//      grid alone, and from MONTH_LIST_FROM the month's next occasions under it.
//      System font, by Farjad's call: widgets cannot use a bundled one.
//      Colours come from resources with night variants; on 12+ they are passed
//      as resources so the launcher re-resolves them when the theme flips.
//      Every form sets the root's content description to `day.spoken`, so
//      TalkBack reads one sentence instead of the bare numeral and month.
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

    // From this height the month widget has room for its occasion list: six rows of
    // the grid and the header need about 180dp, three occasion lines about 70 more.
    // Measured on the Android 16 emulator (420dpi, 10 Oct): 4×2 is 177dp tall and
    // 4×3 is 275dp, so 4×2 keeps the grid alone and one row taller shows the list.
    // 300 was the first guess, from the docs' table, and showed no list at 4×3.
    private const val MONTH_LIST_FROM = 250

    fun month(context: Context, month: WidgetMonth, options: Bundle?): RemoteViews {
        val grid = monthViews(context, month, withList = false)
        val tall = monthViews(context, month, withList = true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Same width in both keys, as in `responsive`, so they differ only in height.
            return RemoteViews(mapOf(SizeF(220f, 110f) to grid, SizeF(220f, MONTH_LIST_FROM.toFloat()) to tall))
        }
        val height = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT) ?: 0
        return if (height >= MONTH_LIST_FROM) tall else grid
    }

    private val DAY_IDS = intArrayOf(R.id.d0, R.id.d1, R.id.d2, R.id.d3, R.id.d4, R.id.d5, R.id.d6)
    private val DOT_IDS = intArrayOf(R.id.o0, R.id.o1, R.id.o2, R.id.o3, R.id.o4, R.id.o5, R.id.o6)

    private fun monthViews(context: Context, month: WidgetMonth, withList: Boolean) =
        RemoteViews(context.packageName, R.layout.widget_month).apply {
            setTextViewText(R.id.title, month.month)
            setTextViewText(R.id.year, fa(month.year))
            setTextViewText(R.id.weekday, month.weekday)
            removeAllViews(R.id.grid)
            for (week in month.cells.chunked(7)) {
                val row = RemoteViews(context.packageName, R.layout.widget_month_row)
                week.forEachIndexed { i, cell ->
                    row.setTextViewText(DAY_IDS[i], fa(cell.day))
                    // Today: a forest disc with paper text. Otherwise clay on a day off,
                    // faint outside the month, ink for the rest — the site grid's rules.
                    row.setInt(DAY_IDS[i], "setBackgroundResource", if (cell.today) R.drawable.widget_today else 0)
                    row.color(context, DAY_IDS[i], when {
                        cell.today -> R.color.widget_paper
                        !cell.inMonth -> R.color.widget_faint
                        cell.off -> R.color.widget_clay
                        else -> R.color.widget_ink
                    })
                    row.setViewVisibility(DOT_IDS[i], if (cell.occasion && !cell.today) View.VISIBLE else View.INVISIBLE)
                    row.setImageViewResource(DOT_IDS[i], if (cell.off) R.drawable.widget_dot_clay else R.drawable.widget_dot_muted)
                }
                addView(R.id.grid, row)
            }
            removeAllViews(R.id.list)
            if (withList) {
                if (month.upcoming.isEmpty()) addView(R.id.list, occasionLine(context, null, "مناسبتی در ادامهٔ این ماه نیست.", holiday = false))
                else for (o in month.upcoming) addView(R.id.list, occasionLine(context, o.day, o.title, o.holiday))
            }
            setViewVisibility(R.id.list_section, if (withList) View.VISIBLE else View.GONE)
            // One sentence for the whole widget, as the others: the month, then today.
            setContentDescription(R.id.root, month.spoken)
            opensApp(context)
        }

    private fun occasionLine(context: Context, day: Int?, title: String, holiday: Boolean) =
        RemoteViews(context.packageName, R.layout.widget_month_occasion).apply {
            setTextViewText(R.id.occasion_day, day?.let { fa(it) } ?: "")
            setTextViewText(R.id.occasion_title, title)
            color(context, R.id.occasion_title, if (day == null) R.color.widget_muted else if (holiday) R.color.widget_clay else R.color.widget_ink)
            color(context, R.id.occasion_day, if (holiday) R.color.widget_clay else R.color.widget_muted)
        }

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
            spoken(day)
            opensApp(context)
        }

    private fun smallStrip(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_small_strip).apply {
            setTextViewText(R.id.weekday, day.weekday)
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.month, day.month)
            numeral(context, R.id.day, day)
            spoken(day)
            opensApp(context)
        }

    private fun wideTall(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_wide).apply {
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.month, day.month)
            setTextViewText(R.id.title, "${day.weekday} ${fa(day.year)}")
            occasionLine(context, day)
            block(day)
            spoken(day)
            opensApp(context)
        }

    private fun wideStrip(context: Context, day: WidgetDay) =
        RemoteViews(context.packageName, R.layout.widget_wide_strip).apply {
            setTextViewText(R.id.day, fa(day.day))
            setTextViewText(R.id.title, "${day.weekday} ${day.month} ${fa(day.year)}")
            occasionLine(context, day)
            block(day)
            spoken(day)
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

    // One sentence for the whole widget; the root is the click target TalkBack lands on.
    private fun RemoteViews.spoken(day: WidgetDay) {
        setContentDescription(R.id.root, day.spoken)
    }

    private fun RemoteViews.opensApp(context: Context) {
        val intent = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        setOnClickPendingIntent(R.id.root, PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE))
    }
}

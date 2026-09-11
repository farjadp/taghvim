# mobile/

The Android and iPhone apps and their widgets. Roadmap and running log: the
«اپ‌ها و ویجت‌ها — Roadmap» sub-page of the Taghvim row in Notion.

## Layout

| Path | What it is |
|---|---|
| `shared/widget-data.json` | What `eventsForDate` says for every day of `WIDGET_YEARS`, per category. The widgets look a day up here; they never re-implement the event tables. |
| `shared/jalali-vectors.json` | The site's own Gregorian → Jalali answers: 9,497 consecutive days (1395–1420) and 1 Farvardin of every year 1200–1600. Every native port is tested against it. |
| `ios/TaghvimCore/` | Swift package shared by the iPhone app and its widgets: `Jalali` (a line-for-line port of jalaali-js 2.0.1), `Today` (the day and the next midnight on the Tehran clock), `WidgetData` (reads the file, filters by group). |

Both `shared/` files are **generated and committed**. After changing events,
month names or `WIDGET_YEARS` in `src/lib/widget-data.ts`:

```bash
npm run build:widget-data
```

`src/lib/widget-data.test.ts` fails while either file differs from what the
script would write, so an edit cannot reach the site without reaching the
widget. It also fails once `WIDGET_YEARS` stops reaching the year after the
current one — move the window and rebuild.

## Rules the native code keeps

- **The day is the Tehran day.** The widget prints the Iranian date, so it turns
  at midnight in Tehran, not in the phone's zone.
- **The filter is `visibleWidgetEvents`.** `iran` always shows; `state`,
  `religious` and `world` follow their switch; a day is a holiday only when a
  visible row says so. Friday is off by being Friday and is not in the file.
- **`uncertain` rows are computed lunar holidays** and may land a day off; say so
  wherever one is shown, as the site does.
- **Outside the file's years**, print the date and nothing else — never claim a
  day has no occasion when the file simply does not know.

## Tests

```bash
npm test                                          # includes widget-data.test.ts
cd mobile/ios/TaghvimCore && swift test           # Swift port against the vectors
```

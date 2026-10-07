// ============================================================================
// Source: src/lib/rates.ts
// Version: 0.1.0 — 2026-10-07
// Why: Free-market exchange rates for the «نرخ ارز» tool, read from the public
//      Telegram channel @sarafha_rate: the post parser, the read schedule and the
//      types. Pure — the fetching lives in rates-server.ts, so a client component
//      can import the types and the notice without shipping a network call.
// Env / Deps: None.
// ============================================================================

export const RATES_CHANNEL = 'sarafha_rate';
export const RATES_CHANNEL_URL = `https://t.me/${RATES_CHANNEL}`;

export type RateUnit = 'toman' | 'usd';
export type Rate = { id: string; label: string; unit: RateUnit; value: number; prev: number | null };
// `at` is the post's own instant from Telegram, ISO with offset
export type RatesSnapshot = { at: string; rates: Rate[] };

// The channel's labels, mapped to our ids and names. Lines we do not know are
// skipped, so a new item in the post never breaks the parse.
const KNOWN: { id: string; source: string; label: string; unit: RateUnit }[] = [
  { id: 'usd', source: 'دلار آمریکا', label: 'دلار آمریکا', unit: 'toman' },
  { id: 'eur', source: 'یورو', label: 'یورو', unit: 'toman' },
  { id: 'cad', source: 'دلار کانادا', label: 'دلار کانادا', unit: 'toman' },
  { id: 'aed', source: 'درهم امارات', label: 'درهم امارات', unit: 'toman' },
  { id: 'try', source: 'لیر ترکیه', label: 'لیر ترکیه', unit: 'toman' },
  { id: 'cny', source: 'یوآن چین', label: 'یوآن چین', unit: 'toman' },
  { id: 'usdt', source: 'تتر', label: 'تتر', unit: 'toman' },
  { id: 'emami', source: 'سکه امامی', label: 'سکه امامی', unit: 'toman' },
  { id: 'half', source: 'نیم سکه', label: 'نیم سکه', unit: 'toman' },
  { id: 'quarter', source: 'ربع سکه', label: 'ربع سکه', unit: 'toman' },
  { id: 'gram18', source: 'گرم طلای 18', label: 'گرم طلای ۱۸', unit: 'toman' },
  { id: 'mesghal', source: 'مثقال طلا', label: 'مثقال طلا', unit: 'toman' },
  { id: 'xau', source: 'اونس طلا', label: 'اونس طلا', unit: 'usd' },
  { id: 'xag', source: 'اونس نقره', label: 'اونس نقره', unit: 'usd' },
  { id: 'brent', source: 'نفت برنت', label: 'نفت برنت', unit: 'usd' },
  { id: 'wti', source: 'نفت آمریکا', label: 'نفت آمریکا', unit: 'usd' },
];
// A post without these is not a rates post (an ad, an announcement) and is skipped
const REQUIRED = ['usd', 'eur', 'emami'];

export const RATES_NOTICE = 'نرخ بازار آزاد، نه نرخ رسمی. از کانال عمومی تلگرام «قیمت لحظه ای دلار» خوانده می‌شود، روزی پنج بار؛ پس ممکن است چند ساعت از بازار عقب باشد. ارزها، سکه و طلا به تومان؛ اونس و نفت به دلار.';

// The channel writes «18»; Persian or Arabic-Indic digits would be normalised the same way
function latinDigits(text: string) {
  return text.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

// One post's text → its values by id, or null when it is not a rates post
export function parsePost(text: string): Map<string, number> | null {
  const values = new Map<string, number>();
  for (const raw of latinDigits(text).split('\n')) {
    // «🔴 دلار آمریکا : 264,300» — the dot is decoration and does not track direction
    const match = raw.match(/^[^\p{L}]*(\p{L}.*?)\s*:\s*([\d,٬]+(?:\.\d+)?)\s*$/u);
    if (!match) continue;
    const known = KNOWN.find((item) => item.source === match[1].trim());
    if (!known) continue;
    const value = Number(match[2].replace(/[,٬]/g, ''));
    if (Number.isFinite(value) && value > 0) values.set(known.id, value);
  }
  return REQUIRED.every((id) => values.has(id)) ? values : null;
}

function decode(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

// The channel's public preview page → the newest rates post, with each value's
// change against the rates post before it. Null when the page holds none.
export function parseChannelPage(html: string): RatesSnapshot | null {
  const posts: { at: string; values: Map<string, number> }[] = [];
  // Each message block carries its text and, after it, its <time datetime>
  for (const block of html.split('tgme_widget_message_wrap').slice(1)) {
    const text = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const at = block.match(/<time datetime="([^"]+)"/);
    if (!text || !at || Number.isNaN(Date.parse(at[1]))) continue;
    const values = parsePost(decode(text[1]));
    if (values) posts.push({ at: at[1], values });
  }
  posts.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const latest = posts.at(-1);
  if (!latest) return null;
  const before = posts.at(-2);
  return {
    at: latest.at,
    rates: KNOWN.filter((item) => latest.values.has(item.id)).map((item) => ({
      id: item.id, label: item.label, unit: item.unit,
      value: latest.values.get(item.id)!,
      prev: before?.values.get(item.id) ?? null,
    })),
  };
}

// The fixed Tehran hours at which a read is due — five a day, as Farjad asked
export const READ_HOURS = [9, 12, 15, 18, 21];
// Older than this and the tool is hidden rather than showing a price as current
export const STALE_AFTER_MS = 72 * 3_600_000;

// Which read slot an instant falls in, as a key: «2026-10-07@18». A new key means a read is due.
export function slotKey(now: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour);
  const slot = [...READ_HOURS].reverse().find((h) => h <= hour);
  if (slot !== undefined) return `${parts.year}-${parts.month}-${parts.day}@${slot}`;
  // Before the first read hour: still yesterday's last slot
  return `${slotKey(new Date(now.getTime() - (hour + 1) * 3_600_000)).split('@')[0]}@${READ_HOURS.at(-1)}`;
}

export function isFresh(snapshot: RatesSnapshot, now: Date) {
  return now.getTime() - Date.parse(snapshot.at) <= STALE_AFTER_MS;
}
